import { connectDb } from "../db";
import {
  Asset,
  AuditLog,
  Deposit,
  Investment,
  Kyc,
  LedgerEntry,
  Notification,
  Plan,
  User,
  Withdrawal,
} from "../models";
import { accrue } from "./investments";

const DAY = 86_400_000;
export const plain = <T>(v: T): T => JSON.parse(JSON.stringify(v));

export async function activePlans() {
  await connectDb();
  return plain(
    await Plan.find({ active: true }).sort({ sort: 1, minCents: 1 }).lean(),
  );
}

/** Daily portfolio value (available balance + invested principal + accrued profit) for the last N days. */
export async function portfolioSeries(userId: string, days = 30) {
  const [entries, investments] = await Promise.all([
    LedgerEntry.find({ userId }).sort({ createdAt: 1 }).lean(),
    Investment.find({ userId }).lean(),
  ]);
  const out: { date: string; value: number }[] = [];
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    const end = new Date(now - i * DAY);
    end.setHours(23, 59, 59, 999);
    const t = Math.min(end.getTime(), now);
    let balance = 0;
    for (const e of entries)
      if (e.createdAt.getTime() <= t) balance = e.balanceAfterCents;
    let invested = 0;
    for (const inv of investments) {
      const start = inv.startedAt.getTime();
      if (start > t) continue;
      const settledAt =
        inv.status === "matured" ? inv.maturesAt.getTime() : Infinity;
      if (t >= settledAt) continue;
      const d = Math.min(inv.durationDays, Math.floor((t - start) / DAY));
      invested +=
        inv.principalCents +
        Math.round((inv.totalProfitCents * d) / inv.durationDays);
    }
    out.push({
      date: end.toISOString().slice(0, 10),
      value: (balance + invested) / 100,
    });
  }
  return out;
}

export async function investorOverview(userId: string) {
  await connectDb();
  await accrue(userId);
  const [user, active, profitAgg, recent, series, pendingDeposits, unread] =
    await Promise.all([
      User.findById(userId).lean(),
      Investment.find({ userId, status: "active" }).lean(),
      LedgerEntry.aggregate([
        {
          $match: {
            userId: new (await import("mongoose")).Types.ObjectId(userId),
            type: "profit",
          },
        },
        { $group: { _id: null, t: { $sum: "$amountCents" } } },
      ]),
      LedgerEntry.find({ userId }).sort({ createdAt: -1 }).limit(6).lean(),
      portfolioSeries(userId),
      Deposit.countDocuments({ userId, status: "pending" }),
      Notification.countDocuments({ userId, readAt: { $exists: false } }),
    ]);
  const invested = active.reduce((s, i) => s + i.principalCents, 0);
  const accrued = active.reduce((s, i) => s + i.accruedCents, 0);
  const realized = profitAgg[0]?.t ?? 0;
  const available = user?.balanceCents ?? 0;
  return plain({
    available,
    invested,
    profit: realized + accrued,
    total: available + invested + accrued,
    activeCount: active.length,
    pendingDeposits,
    unread,
    recent,
    series,
  });
}

export async function adminOverview() {
  await connectDb();
  const sum = (m: Record<string, unknown>, M: typeof Deposit) =>
    M.aggregate([
      { $match: m },
      { $group: { _id: null, t: { $sum: "$amountCents" } } },
    ]);
  const [
    users,
    verified,
    dep,
    wd,
    pendDep,
    pendWd,
    pendKyc,
    invAgg,
    recentAudit,
    liveMethods,
    livePlans,
  ] = await Promise.all([
    User.countDocuments({ role: "investor" }),
    User.countDocuments({
      role: "investor",
      emailVerifiedAt: { $exists: true },
    }),
    sum({ status: "approved" }, Deposit),
    sum({ status: "paid" }, Withdrawal),
    Deposit.countDocuments({ status: "pending" }),
    Withdrawal.countDocuments({ status: "pending" }),
    Kyc.countDocuments({ status: "pending" }),
    Investment.aggregate([
      { $match: { status: "active" } },
      { $group: { _id: null, t: { $sum: "$principalCents" }, n: { $sum: 1 } } },
    ]),
    AuditLog.find().sort({ createdAt: -1 }).limit(8).lean(),
    Asset.countDocuments({
      active: true,
      networks: { $elemMatch: { active: true, address: { $ne: "" } } },
    }),
    Plan.countDocuments({ active: true }),
  ]);
  return plain({
    users,
    verified,
    deposits: dep[0]?.t ?? 0,
    withdrawals: wd[0]?.t ?? 0,
    pendDep,
    pendWd,
    pendKyc,
    activePrincipal: invAgg[0]?.t ?? 0,
    activeCount: invAgg[0]?.n ?? 0,
    recentAudit,
    liveMethods,
    livePlans,
  });
}
