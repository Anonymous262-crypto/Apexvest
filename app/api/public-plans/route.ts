import { NextResponse } from "next/server";

import { getPublicPlans } from "@/lib/services/public-plans";

/** Public, cache-friendly plan list so the landing page can refresh without a reload. */
export async function GET() {
  const plans = await getPublicPlans();
  return NextResponse.json(
    { plans },
    {
      headers: {
        "cache-control": "public, s-maxage=10, stale-while-revalidate=30",
      },
    },
  );
}
