import { OFFER_AFTER_DAYS } from "@/content/site";

import { connectDb } from "../db";
import { emails } from "../email/templates";
import { Investment, Plan } from "../models";
import { formatUsd } from "../money";
import { notify } from "./notify";

const DAY = 86_400_000;

export interface NextOffer {
  currentPlan: string;
  daysIn: number;
  next: {
    slug: string;
    name: string;
    range: string;
    durationDays: number;
    projectedPct: number;
  };
}

/** The next tier up from a plan: the active plan with the smallest minimum above this one. */
async function nextTier(minCents: number) {
  return Plan.findOne({ active: true, minCents: { $gt: minCents } })
    .sort({ minCents: 1 })
    .lean();
}

const toNext = (p: {
  slug: string;
  name: string;
  minCents: number;
  maxCents: number;
  durationDays: number;
  projectedPct: number;
}) => ({
  slug: p.slug,
  name: p.name,
  range: `${formatUsd(p.minCents)} to ${formatUsd(p.maxCents)}`,
  durationDays: p.durationDays,
  projectedPct: p.projectedPct,
});

/** Once per investment, after OFFER_AFTER_DAYS: in-app notification and email suggesting the next tier. */
export async function sendOfferIfDue(inv: {
  _id: unknown;
  userId: unknown;
  planName: string;
  planId: unknown;
  offerNotifiedAt?: Date;
}) {
  if (inv.offerNotifiedAt) return;
  await connectDb();
  const claimed = await Investment.findOneAndUpdate(
    { _id: inv._id, offerNotifiedAt: { $exists: false } },
    { offerNotifiedAt: new Date() },
  );
  if (!claimed) return;
  const plan = await Plan.findById(inv.planId).select("minCents").lean();
  const next = plan ? await nextTier(plan.minCents as number) : null;
  if (!next) return;
  const o = toNext(next as never);
  await notify(
    String(inv.userId),
    {
      title: `A new offer: ${o.name}`,
      body: `You are ${OFFER_AFTER_DAYS} days into ${inv.planName}. ${o.name} projects ${o.projectedPct}% over ${o.durationDays} days.`,
      href: `/dashboard/investments?plan=${o.slug}#invest`,
    },
    emails.investmentOffer(
      inv.planName,
      OFFER_AFTER_DAYS,
      o.name,
      o.range,
      o.durationDays,
      o.projectedPct,
      `/dashboard/investments?plan=${o.slug}#invest`,
    ),
  );
}

/** For the dashboard: the user's oldest eligible investment and the tier above it. */
export async function getOffer(userId: string): Promise<NextOffer | null> {
  await connectDb();
  const cutoff = new Date(Date.now() - OFFER_AFTER_DAYS * DAY);
  const inv = await Investment.findOne({
    userId,
    status: "active",
    startedAt: { $lte: cutoff },
  })
    .sort({ principalCents: -1 })
    .lean();
  if (!inv) return null;
  const plan = await Plan.findById(inv.planId).select("minCents").lean();
  const next = plan ? await nextTier(plan.minCents as number) : null;
  if (!next) return null;
  return {
    currentPlan: inv.planName as string,
    daysIn: Math.floor((Date.now() - (inv.startedAt as Date).getTime()) / DAY),
    next: toNext(next as never),
  };
}
