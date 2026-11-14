import { randomBytes } from "node:crypto";

import { connectDb, withTx } from "../db";
import { emails } from "../email/templates";
import { Referral, Setting, User } from "../models";
import { formatUsd } from "../money";
import { credit } from "./ledger";
import { notify } from "./notify";

export interface ReferralSettings {
  enabled: boolean;
  /** Reward as a percentage of the referred user's first qualifying deposit. */
  pct: number;
  capUsd: number;
  minDepositUsd: number;
}

export const DEFAULT_REFERRAL: ReferralSettings = {
  enabled: true,
  pct: 2,
  capUsd: 100,
  minDepositUsd: 100,
};

export async function getReferralSettings(): Promise<ReferralSettings> {
  await connectDb();
  const doc = await Setting.findOne({ key: "referral" }).lean();
  return {
    ...DEFAULT_REFERRAL,
    ...((doc?.value as Partial<ReferralSettings>) ?? {}),
  };
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no look-alike characters

function newCode() {
  const bytes = randomBytes(8);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

/** The user's referral code, created on first use. */
export async function ensureReferralCode(userId: string): Promise<string> {
  await connectDb();
  const u = await User.findById(userId).select("referralCode").lean();
  if (u?.referralCode) return u.referralCode as string;
  for (let i = 0; i < 5; i++) {
    const code = newCode();
    try {
      const res = await User.updateOne(
        { _id: userId, referralCode: { $exists: false } },
        { referralCode: code },
      );
      if (res.matchedCount === 0) {
        const again = await User.findById(userId).select("referralCode").lean();
        return (again?.referralCode as string) ?? code;
      }
      return code;
    } catch (e) {
      if (!(e instanceof Error && /E11000|duplicate key/i.test(e.message)))
        throw e;
    }
  }
  throw new Error("Could not create a referral code.");
}

/** At sign-up: link the new user to whoever's code they used. Silent if the code is unknown. */
export async function attachReferral(newUserId: string, code?: string) {
  if (!code) return;
  await connectDb();
  const referrer = await User.findOne({
    referralCode: code.trim().toUpperCase(),
    status: "active",
  })
    .select("_id")
    .lean();
  if (!referrer || String(referrer._id) === newUserId) return;
  await User.updateOne({ _id: newUserId }, { referredBy: referrer._id });
  await Referral.create({
    referrerId: referrer._id,
    referredId: newUserId,
  }).catch(() => {});
}

/**
 * After a deposit is approved: if the depositor was referred and this is their first deposit that
 * meets the minimum, credit the referrer once. Never throws.
 */
export async function maybeRewardReferrer(deposit: {
  _id: unknown;
  userId: unknown;
  amountCents: number;
}) {
  try {
    await connectDb();
    const st = await getReferralSettings();
    if (!st.enabled || deposit.amountCents < st.minDepositUsd * 100) return;
    const reward = Math.min(
      st.capUsd * 100,
      Math.round((deposit.amountCents * st.pct) / 100),
    );
    if (reward <= 0) return;
    // Claim atomically so two approvals can never pay twice.
    const ref = await Referral.findOneAndUpdate(
      { referredId: deposit.userId, status: "joined" },
      {
        status: "rewarded",
        rewardCents: reward,
        depositId: deposit._id,
        rewardedAt: new Date(),
      },
    );
    if (!ref) return;
    try {
      await withTx((session) =>
        credit(session, ref.referrerId, reward, "referral_bonus", {
          refType: "referral",
          refId: ref._id,
          note: "Referral reward",
        }),
      );
    } catch (e) {
      await Referral.updateOne(
        { _id: ref._id },
        {
          status: "joined",
          rewardCents: 0,
          $unset: { depositId: 1, rewardedAt: 1 },
        },
      );
      throw e;
    }
    const amount = formatUsd(reward);
    await notify(
      String(ref.referrerId),
      {
        title: "Referral reward",
        body: `${amount} credited because your friend made their first deposit.`,
        href: "/dashboard/referrals",
      },
      emails.referralReward(amount),
    );
  } catch (e) {
    console.error("[referral] reward failed", e);
  }
}

export const maskEmail = (email: string) => {
  const [name, domain] = email.split("@");
  return `${name.slice(0, 1)}${"•".repeat(Math.max(2, Math.min(5, name.length - 1)))}@${domain}`;
};
