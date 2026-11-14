import { randomBytes } from "node:crypto";

import { connectDb, withTx } from "../db";
import { emails } from "../email/templates";
import { Kyc, User, Withdrawal } from "../models";
import { formatUsd } from "../money";
import { credit, debit } from "./ledger";
import { alertAdmins, audit, notify } from "./notify";

type Actor = { id: string; email: string };

export const MIN_WITHDRAWAL_CENTS = 1000;

const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newReference = () =>
  `WDR-${Array.from(randomBytes(6), (b) => REF_ALPHABET[b % REF_ALPHABET.length]).join("")}`;

export async function kycStatus(userId: string) {
  await connectDb();
  const k = await Kyc.findOne({ userId }).lean();
  return (
    (k?.status as "pending" | "approved" | "rejected" | undefined) ?? "none"
  );
}

export async function requestWithdrawal(
  userId: string,
  input: {
    asset: string;
    network: string;
    address: string;
    amountCents: number;
  },
) {
  if ((await kycStatus(userId)) !== "approved") {
    throw new Error("Verify your identity before requesting a withdrawal.");
  }
  if (input.amountCents < MIN_WITHDRAWAL_CENTS) {
    throw new Error(
      `The minimum withdrawal is ${formatUsd(MIN_WITHDRAWAL_CENTS)}.`,
    );
  }
  const w = await withTx(async (session) => {
    const [w] = await Withdrawal.create(
      [{ userId, ...input, reference: newReference() }],
      {
        session,
      },
    );
    await debit(session, userId, input.amountCents, "withdrawal_hold", {
      refType: "withdrawal",
      refId: w._id,
    });
    return w;
  });
  const amount = formatUsd(input.amountCents);
  const u = await User.findById(userId).select("email");
  await notify(
    userId,
    {
      title: "Withdrawal requested",
      body: `${amount} is on hold while we review it.`,
      href: `/dashboard/withdraw/${w._id}`,
    },
    emails.withdrawalRequested(
      amount,
      input.asset,
      input.network,
      input.address,
    ),
  );
  await alertAdmins(
    "New withdrawal to review",
    [
      ["User", u?.email ?? ""],
      ["Amount", amount],
      ["Asset", `${input.asset} · ${input.network}`],
    ],
    "/admin/withdrawals",
  );
  return w;
}

export async function markWithdrawalPaid(
  admin: Actor,
  id: string,
  txHash: string,
) {
  await connectDb();
  const w = await Withdrawal.findOneAndUpdate(
    { _id: id, status: "pending" },
    { status: "paid", txHash, reviewedBy: admin.id, reviewedAt: new Date() },
    { new: true },
  );
  if (!w) throw new Error("Withdrawal is not pending.");
  const amount = formatUsd(w.amountCents);
  await notify(
    String(w.userId),
    {
      title: "Withdrawal paid",
      body: amount,
      href: `/dashboard/withdraw/${w._id}`,
    },
    emails.withdrawalPaid(amount, txHash),
  );
  await audit(admin, "withdrawal.paid", String(w._id), {
    txHash,
    amountCents: w.amountCents,
  });
}

export async function rejectWithdrawal(
  admin: Actor,
  id: string,
  reason: string,
) {
  const w = await withTx(async (session) => {
    const x = await Withdrawal.findOneAndUpdate(
      { _id: id, status: "pending" },
      {
        status: "rejected",
        reason,
        reviewedBy: admin.id,
        reviewedAt: new Date(),
      },
      { new: true, session },
    );
    if (!x) throw new Error("Withdrawal is not pending.");
    await credit(session, x.userId, x.amountCents, "withdrawal_refund", {
      refType: "withdrawal",
      refId: x._id,
    });
    return x;
  });
  const amount = formatUsd(w.amountCents);
  await notify(
    String(w.userId),
    {
      title: "Withdrawal rejected",
      body: "The amount returned to your balance.",
      href: "/dashboard/withdraw",
    },
    emails.withdrawalRejected(amount, reason),
  );
  await audit(admin, "withdrawal.reject", String(w._id), { reason });
}
