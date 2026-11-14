import { connectDb } from "../db";
import { Deposit, LedgerEntry, Setting, Withdrawal } from "../models";

export interface ActivityItem {
  id: string;
  kind: "withdrawal" | "profit" | "deposit";
  who: string;
  amount: string;
  at: number;
}

const DAY = 86_400_000;
const MIN_ITEMS = 3;

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** j***n. Enough to read as a person, not enough to identify one. */
export function maskHandle(handle: string) {
  const h = handle.trim();
  return h.length < 3 ? `${h.slice(0, 1)}***` : `${h[0]}***${h[h.length - 1]}`;
}

export async function isTickerEnabled() {
  await connectDb();
  const s = await Setting.findOne({ key: "activity_ticker" }).lean();
  return (s?.value as { enabled?: boolean } | undefined)?.enabled !== false;
}

type U = {
  username?: string;
  email?: string;
  role?: string;
  status?: string;
} | null;
const handleOf = (u: U) =>
  u && u.role === "investor" && u.status === "active"
    ? maskHandle(u.username || (u.email ?? "").split("@")[0] || "user")
    : null;

let cache: { at: number; items: ActivityItem[] } | null = null;

/**
 * Real, recent platform activity only: paid withdrawals, profit credited at maturity and confirmed deposits
 * from the last two weeks, with masked usernames. Nothing is invented. Hidden when there is too little
 * activity to keep individuals anonymous, or when an admin turns it off.
 */
export async function getRecentActivity(): Promise<ActivityItem[]> {
  if (cache && Date.now() - cache.at < 60_000) return cache.items;
  let items: ActivityItem[] = [];
  try {
    if (await isTickerEnabled()) {
      await connectDb();
      const since = new Date(Date.now() - 14 * DAY);
      const [w, p, d] = await Promise.all([
        Withdrawal.find({ status: "paid", reviewedAt: { $gte: since } })
          .sort({ reviewedAt: -1 })
          .limit(8)
          .populate("userId", "username email role status")
          .lean(),
        LedgerEntry.find({ type: "profit", createdAt: { $gte: since } })
          .sort({ createdAt: -1 })
          .limit(8)
          .populate("userId", "username email role status")
          .lean(),
        Deposit.find({ status: "approved", reviewedAt: { $gte: since } })
          .sort({ reviewedAt: -1 })
          .limit(6)
          .populate("userId", "username email role status")
          .lean(),
      ]);
      const out: ActivityItem[] = [];
      for (const r of w) {
        const who = handleOf(r.userId as U);
        if (who && r.amountCents >= 100)
          out.push({
            id: `w${r._id}`,
            kind: "withdrawal",
            who,
            amount: money.format(r.amountCents / 100),
            at: new Date(r.reviewedAt as Date).getTime(),
          });
      }
      for (const r of p) {
        const who = handleOf(r.userId as U);
        if (who && r.amountCents >= 100)
          out.push({
            id: `p${r._id}`,
            kind: "profit",
            who,
            amount: money.format(r.amountCents / 100),
            at: new Date(r.createdAt as Date).getTime(),
          });
      }
      for (const r of d) {
        const who = handleOf(r.userId as U);
        if (who && r.amountCents >= 100)
          out.push({
            id: `d${r._id}`,
            kind: "deposit",
            who,
            amount: money.format(r.amountCents / 100),
            at: new Date(r.reviewedAt as Date).getTime(),
          });
      }
      out.sort((a, b) => b.at - a.at);
      items = out.length >= MIN_ITEMS ? out.slice(0, 14) : [];
    }
  } catch (e) {
    console.error("[activity] failed", e);
  }
  cache = { at: Date.now(), items };
  return items;
}

export const clearActivityCache = () => {
  cache = null;
};
