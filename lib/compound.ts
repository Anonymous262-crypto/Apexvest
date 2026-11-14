/**
 * Daily compounding maths, shared by the server and the browser.
 *
 * A plan pays a fixed percentage every day on the running balance (principal plus profit
 * already accrued). Nothing can be withdrawn until the end date. All of it is illustrative:
 * a projection, never a promise.
 */

/** Total return over the whole term for a daily rate, in percent. */
export const totalPctFromDaily = (dailyPct: number, days: number) =>
  ((1 + dailyPct / 100) ** days - 1) * 100;

/** The daily rate that produces a given total return over the term (used for older plans). */
export const dailyFromTotal = (totalPct: number, days: number) =>
  ((1 + totalPct / 100) ** (1 / days) - 1) * 100;

/** What a daily rate would be worth over a year if it kept compounding (APY), in percent. */
export const apyFromDaily = (dailyPct: number) =>
  ((1 + dailyPct / 100) ** 365 - 1) * 100;

/** Profit in cents after `days` days of compounding on `principalCents`. */
export const profitCents = (
  principalCents: number,
  dailyPct: number,
  days: number,
) => Math.round(principalCents * ((1 + dailyPct / 100) ** days - 1));

export interface ScheduleRow {
  day: number;
  /** Profit credited on this day. */
  dayCents: number;
  /** Total profit so far. */
  profitCents: number;
  /** Principal plus profit so far. */
  valueCents: number;
}

/** Day-by-day compounding table. Pure and deterministic, so it can be drawn without storing anything. */
export function schedule(
  principalCents: number,
  dailyPct: number,
  days: number,
): ScheduleRow[] {
  const rows: ScheduleRow[] = [];
  let prev = 0;
  for (let d = 1; d <= days; d++) {
    const p = profitCents(principalCents, dailyPct, d);
    rows.push({
      day: d,
      dayCents: p - prev,
      profitCents: p,
      valueCents: principalCents + p,
    });
    prev = p;
  }
  return rows;
}

/** The daily rate for a stored plan or investment: explicit if present, otherwise derived from its total. */
export const effectiveDaily = (o: {
  dailyPct?: number | null;
  projectedPct?: number | null;
  durationDays: number;
}) =>
  o.dailyPct != null
    ? o.dailyPct
    : dailyFromTotal(o.projectedPct ?? 0, o.durationDays);
