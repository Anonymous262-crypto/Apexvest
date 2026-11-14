import { ArrowRight, Rocket } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { formatUsd } from "@/lib/money";

/** "You picked a plan before signing up. Here is the next step to start it." */
export function ContinueCard({
  plan,
  available,
}: {
  plan: {
    slug: string;
    name: string;
    minCents: number;
    maxCents: number;
    durationDays: number;
    projectedPct: number;
  };
  available: number;
}) {
  const short = Math.max(0, plan.minCents - available);
  const ready = short === 0;
  return (
    <div className="border-brand/40 from-brand/10 rounded-xl border bg-linear-to-br to-transparent p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="bg-brand/15 text-brand flex size-10 shrink-0 items-center justify-center rounded-xl">
            <Rocket className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold">Continue with {plan.name}</p>
            <p className="text-muted-foreground text-sm text-pretty">
              {ready
                ? `Your balance is ready. ${plan.name} accepts ${formatUsd(plan.minCents)} to ${formatUsd(plan.maxCents)} over ${plan.durationDays} days, with a projected ${plan.projectedPct}% (illustrative, not guaranteed).`
                : `${plan.name} starts at ${formatUsd(plan.minCents)}. Deposit ${formatUsd(short)} more to start it. Projected returns are illustrative and not guaranteed.`}
            </p>
          </div>
        </div>
        <Button asChild size="sm">
          <Link
            href={
              ready
                ? `/dashboard/investments?plan=${plan.slug}#invest`
                : "/dashboard/deposit?new=1"
            }
          >
            {ready ? `Invest in ${plan.name}` : "Make a deposit"} <ArrowRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}
