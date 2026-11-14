import { profitCents } from "../compound";
import { connectDb } from "../db";
import { Investment } from "../models";
import { formatUsd } from "../money";

const DAY = 86_400_000;

export type DailyCredit = {
  id: string;
  plan: string;
  /** Formatted USD added by the latest completed day. */
  added: string;
  day: number;
  of: number;
};

/**
 * What each active investment added in its latest completed day, for the "added today" strip.
 * Uses the same day count as accrual, so it matches the daily schedule exactly.
 */
export async function getDailyCredits(userId: string) {
  await connectDb();
  const list = await Investment.find({ userId, status: "active" })
    .select(
      "planName principalCents dailyPct totalProfitCents durationDays startedAt",
    )
    .lean();
  const now = Date.now();
  let total = 0;
  const items: DailyCredit[] = [];
  for (const inv of list) {
    const day = Math.min(
      inv.durationDays as number,
      Math.floor((now - new Date(inv.startedAt as Date).getTime()) / DAY),
    );
    if (day < 1) continue;
    const at = (d: number) =>
      inv.dailyPct != null
        ? profitCents(inv.principalCents as number, inv.dailyPct as number, d)
        : Math.round(
            ((inv.totalProfitCents as number) * d) /
              (inv.durationDays as number),
          );
    const added = at(day) - at(day - 1);
    if (added <= 0) continue;
    total += added;
    items.push({
      id: String(inv._id),
      plan: inv.planName as string,
      added: formatUsd(added),
      day,
      of: inv.durationDays as number,
    });
  }
  return { items, total: formatUsd(total) };
}
