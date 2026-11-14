import { type PlanContent, plans as fallback } from "@/content/site";

import { effectiveDaily } from "../compound";
import { connectDb } from "../db";
import { isDbConfigured } from "../env";
import { Plan } from "../models";

/**
 * The plans shown on the public landing page. Reads the live plans the admin manages;
 * falls back to the defaults in content/site.ts if the database is unavailable or empty.
 */
export async function getPublicPlans(): Promise<PlanContent[]> {
  if (!isDbConfigured()) return fallback.items;
  try {
    await connectDb();
    const rows = await Plan.find({ active: true })
      .sort({ sort: 1, minCents: 1 })
      .lean();
    if (!rows.length) return fallback.items;
    return rows.map((p) => ({
      slug: p.slug as string,
      name: p.name as string,
      tagline: (p.tagline as string) || "",
      minUsd: (p.minCents as number) / 100,
      maxUsd: (p.maxCents as number) / 100,
      durationDays: p.durationDays as number,
      dailyPct: effectiveDaily({
        dailyPct: p.dailyPct as number | undefined,
        projectedPct: p.projectedPct as number,
        durationDays: p.durationDays as number,
      }),
      projectedPct: p.projectedPct as number,
      button: `Start with ${p.name}`,
      featured: Boolean(p.featured),
      badge: (p.badge as string) || undefined,
    }));
  } catch (e) {
    console.error("[public-plans] falling back to defaults", e);
    return fallback.items;
  }
}
