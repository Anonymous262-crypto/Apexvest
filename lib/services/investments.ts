import { OFFER_AFTER_DAYS } from "@/content/site";

import { effectiveDaily, profitCents, totalPctFromDaily } from "../compound";
import { connectDb, withTx } from "../db";
import { emails } from "../email/templates";
import { Investment, Plan, User } from "../models";
import { formatDate, formatUsd } from "../money";
import { credit, debit } from "./ledger";
import { notify } from "./notify";
import { sendOfferIfDue } from "./offers";

const DAY = 86_400_000;
export const MIN_TOPUP_CENTS = 1000;
/** A top-up needs at least this long left in the plan, otherwise there is nothing to accrue. */
export const MIN_TOPUP_DAYS = 2;

/** The daily rate of a plan or investment (older ones only stored a total, so derive it). */
const dailyOf = (p: {
  dailyPct?: number | null;
  projectedPct: number;
  durationDays: number;
}) => effectiveDaily(p);

export async function invest(
  userId: string,
  planSlug: string,
  principalCents: number,
  opts: { autoCompound?: boolean } = {},
) {
  await connectDb();
  const plan = await Plan.findOne({ slug: planSlug, active: true });
  if (!plan) throw new Error("This plan is not available.");
  if (principalCents < plan.minCents || principalCents > plan.maxCents) {
    throw new Error(
      `${plan.name} accepts ${formatUsd(plan.minCents)} to ${formatUsd(plan.maxCents)}.`,
    );
  }
  const inv = await withTx(async (session) => {
    const [inv] = await Investment.create(
      [
        {
          userId,
          planId: plan._id,
          planName: plan.name,
          planSlug: plan.slug,
          principalCents,
          projectedPct: plan.projectedPct,
          dailyPct: dailyOf(plan),
          durationDays: plan.durationDays,
          totalProfitCents: profitCents(
            principalCents,
            dailyOf(plan),
            plan.durationDays,
          ),
          maturesAt: new Date(Date.now() + plan.durationDays * DAY),
          autoCompound: Boolean(opts.autoCompound),
          kind: "new",
        },
      ],
      { session },
    );
    await debit(session, userId, principalCents, "investment", {
      refType: "investment",
      refId: inv._id,
      note: plan.name,
    });
    return inv;
  });
  await User.updateOne({ _id: userId }, { $unset: { pendingPlanSlug: 1 } });
  const amount = formatUsd(principalCents);
  await notify(
    userId,
    {
      title: `${plan.name} investment started`,
      body: `${amount} for ${plan.durationDays} days.`,
      href: "/dashboard/investments",
    },
    emails.investmentStarted(
      plan.name,
      amount,
      plan.durationDays,
      formatDate(inv.maturesAt),
    ),
  );
  return inv;
}

export async function setAutoCompound(
  userId: string,
  investmentId: string,
  on: boolean,
) {
  await connectDb();
  const res = await Investment.updateOne(
    { _id: investmentId, userId, status: "active" },
    { autoCompound: on },
  );
  if (!res.matchedCount) throw new Error("This investment is not active.");
}

/** Days left in an active investment, rounded up. */
export const daysLeft = (maturesAt: Date) =>
  Math.max(0, Math.ceil((maturesAt.getTime() - Date.now()) / DAY));

/**
 * Adds money to an active plan. The new amount is its own tranche that matures with the original,
 * and its projected profit is pro-rated for the days that remain, so it never over-promises.
 */
export async function topUp(
  userId: string,
  investmentId: string,
  amountCents: number,
) {
  await connectDb();
  const parent = await Investment.findOne({
    _id: investmentId,
    userId,
    status: "active",
  });
  if (!parent) throw new Error("This investment is not active.");
  const remaining = daysLeft(parent.maturesAt);
  if (remaining < MIN_TOPUP_DAYS)
    throw new Error(
      "This plan is about to mature, so it can no longer be topped up.",
    );
  if (amountCents < MIN_TOPUP_CENTS)
    throw new Error(`The minimum top-up is ${formatUsd(MIN_TOPUP_CENTS)}.`);
  const plan = await Plan.findById(parent.planId);
  if (!plan) throw new Error("This plan is no longer available.");

  // Total committed to this position (the original plus any earlier top-ups) must stay within the plan's maximum.
  const root = parent.parentId ?? parent._id;
  const tranches = await Investment.find({
    userId,
    status: "active",
    $or: [{ _id: root }, { parentId: root }],
  }).select("principalCents");
  const committed = tranches.reduce(
    (s: number, t: { principalCents: number }) => s + t.principalCents,
    0,
  );
  if (committed + amountCents > plan.maxCents) {
    throw new Error(
      `${plan.name} allows up to ${formatUsd(plan.maxCents)} in total. You can add ${formatUsd(Math.max(0, plan.maxCents - committed))} more.`,
    );
  }

  // Same daily rate as the original, compounding for the days that remain, so it matures together with it.
  const daily = dailyOf(parent);
  const totalProfitCents = profitCents(amountCents, daily, remaining);
  const inv = await withTx(async (session) => {
    const [inv] = await Investment.create(
      [
        {
          userId,
          planId: parent.planId,
          planName: parent.planName,
          planSlug: parent.planSlug,
          principalCents: amountCents,
          projectedPct:
            Math.round(totalPctFromDaily(daily, remaining) * 100) / 100,
          dailyPct: daily,
          durationDays: remaining,
          totalProfitCents,
          maturesAt: parent.maturesAt,
          parentId: root,
          autoCompound: parent.autoCompound,
          kind: "topup",
        },
      ],
      { session },
    );
    await debit(session, userId, amountCents, "investment", {
      refType: "investment",
      refId: inv._id,
      note: `${parent.planName} top-up`,
    });
    return inv;
  });
  const amount = formatUsd(amountCents);
  await notify(userId, {
    title: `Topped up ${parent.planName}`,
    body: `${amount} added, ${remaining} days left.`,
    href: "/dashboard/investments",
  });
  return { investment: inv, remaining, totalProfitCents };
}

/** The plan to reinvest into: the same plan if the amount fits, otherwise the largest open plan the amount qualifies for. */
async function reinvestPlan(planId: unknown, amountCents: number) {
  const same = await Plan.findOne({ _id: planId, active: true });
  if (same && amountCents >= same.minCents) return same;
  return Plan.findOne({ active: true, minCents: { $lte: amountCents } }).sort({
    minCents: -1,
  });
}

/**
 * Accrues daily profit and settles matured investments. Idempotent: a document is only advanced
 * when its accruedDays still matches what we read. Investments marked to reinvest roll into a new
 * plan at maturity (capped at the plan maximum, any remainder stays in the balance).
 */
export async function accrue(userId?: string) {
  await connectDb();
  const filter = { status: "active", ...(userId ? { userId } : {}) };
  const list = await Investment.find(filter);
  let settled = 0;
  for (const inv of list) {
    const days = Math.min(
      inv.durationDays,
      Math.floor((Date.now() - inv.startedAt.getTime()) / DAY),
    );
    if (days >= OFFER_AFTER_DAYS && days < inv.durationDays) {
      await sendOfferIfDue(inv).catch((e) =>
        console.error("[offer] failed", e),
      );
    }
    if (days <= inv.accruedDays) continue;
    // Compounded daily. Investments created before daily compounding existed accrue in a straight line.
    const accruedCents =
      inv.dailyPct != null
        ? profitCents(inv.principalCents, inv.dailyPct, days)
        : Math.round((inv.totalProfitCents * days) / inv.durationDays);
    const matured = days >= inv.durationDays;
    let reinvested: {
      planName: string;
      amountCents: number;
      days: number;
      maturesAt: Date;
    } | null = null;
    try {
      await withTx(async (session) => {
        const upd = await Investment.findOneAndUpdate(
          { _id: inv._id, status: "active", accruedDays: inv.accruedDays },
          {
            accruedDays: days,
            accruedCents,
            ...(matured ? { status: "matured" } : {}),
          },
          { new: true, session },
        );
        if (!upd || !matured) return;
        const ref = {
          refType: "investment",
          refId: inv._id,
          note: inv.planName,
        };
        await credit(
          session,
          inv.userId,
          inv.principalCents,
          "principal_return",
          ref,
        );
        await credit(session, inv.userId, inv.totalProfitCents, "profit", ref);

        if (inv.autoCompound) {
          const total = inv.principalCents + inv.totalProfitCents;
          const plan = await reinvestPlan(inv.planId, total);
          if (plan) {
            const amount = Math.min(total, plan.maxCents);
            const maturesAt = new Date(Date.now() + plan.durationDays * DAY);
            const [next] = await Investment.create(
              [
                {
                  userId: inv.userId,
                  planId: plan._id,
                  planName: plan.name,
                  planSlug: plan.slug,
                  principalCents: amount,
                  projectedPct: plan.projectedPct,
                  dailyPct: dailyOf(plan),
                  durationDays: plan.durationDays,
                  totalProfitCents: profitCents(
                    amount,
                    dailyOf(plan),
                    plan.durationDays,
                  ),
                  maturesAt,
                  autoCompound: true,
                  compoundedFrom: inv._id,
                  kind: "reinvest",
                },
              ],
              { session },
            );
            await debit(session, inv.userId, amount, "investment", {
              refType: "investment",
              refId: next._id,
              note: `${plan.name} (auto-reinvest)`,
            });
            reinvested = {
              planName: plan.name,
              amountCents: amount,
              days: plan.durationDays,
              maturesAt,
            };
          }
        }
      });
      if (matured) {
        settled++;
        const payout = formatUsd(inv.principalCents + inv.totalProfitCents);
        const re = reinvested as {
          planName: string;
          amountCents: number;
          days: number;
          maturesAt: Date;
        } | null;
        if (re) {
          await notify(
            String(inv.userId),
            {
              title: `${inv.planName} matured and reinvested`,
              body: `${formatUsd(re.amountCents)} went into ${re.planName}.`,
              href: "/dashboard/investments",
            },
            emails.investmentReinvested(
              inv.planName,
              payout,
              re.planName,
              formatUsd(re.amountCents),
              re.days,
              formatDate(re.maturesAt),
            ),
          );
        } else {
          await notify(
            String(inv.userId),
            {
              title: `${inv.planName} investment matured`,
              body: `${payout} credited.`,
              href: "/dashboard/investments",
            },
            emails.investmentMatured(inv.planName, payout),
          );
        }
      }
    } catch (e) {
      console.error("[accrue] failed for", String(inv._id), e);
    }
  }
  return { checked: list.length, settled };
}
