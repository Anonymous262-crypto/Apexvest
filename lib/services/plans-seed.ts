import { plans as content } from "@/content/site";

import { connectDb } from "../db";
import { Investment, Plan } from "../models";

/** Slugs from earlier versions of the plan lineup. */
const LEGACY = ["starter", "growth", "premium"];

/**
 * Non-destructive: upserts the default plan lineup from content/site.ts (overwriting those plans'
 * terms), then retires the old three plans (deleted if unused, closed if they have investments).
 * Custom plans with other slugs are left alone.
 */
export async function syncDefaultPlans() {
  await connectDb();
  let created = 0;
  let updated = 0;
  for (const [i, p] of content.items.entries()) {
    const res = await Plan.updateOne(
      { slug: p.slug },
      {
        $set: {
          name: p.name,
          tagline: p.tagline,
          minCents: p.minUsd * 100,
          maxCents: p.maxUsd * 100,
          durationDays: p.durationDays,
          dailyPct: p.dailyPct,
          projectedPct: p.projectedPct,
          featured: Boolean("featured" in p && p.featured),
          badge: "badge" in p ? p.badge : undefined,
          sort: i,
          active: true,
        },
      },
      { upsert: true },
    );
    if (res.upsertedCount) created++;
    else updated++;
  }
  let removed = 0;
  let closed = 0;
  for (const slug of LEGACY) {
    const plan = await Plan.findOne({ slug });
    if (!plan) continue;
    if (await Investment.exists({ planId: plan._id })) {
      plan.active = false;
      await plan.save();
      closed++;
    } else {
      await Plan.deleteOne({ _id: plan._id });
      removed++;
    }
  }
  return { created, updated, removed, closed };
}
