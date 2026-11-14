import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { NextOffer } from "@/lib/services/offers";

/** "You are two weeks in. Here is the next tier." Shown to investors with a mature enough plan. */
export function OfferCard({ offer }: { offer: NextOffer }) {
  const { next } = offer;
  return (
    <div className="border-gold/50 from-gold/10 relative overflow-hidden rounded-xl border bg-linear-to-br to-transparent p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="bg-gold/15 text-gold-foreground flex size-10 shrink-0 items-center justify-center rounded-xl">
            <Sparkles className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold">A new offer: {next.name}</p>
            <p className="text-muted-foreground text-sm text-pretty">
              You are {offer.daysIn} days into {offer.currentPlan}. {next.name}{" "}
              accepts {next.range} and projects {next.projectedPct}% over{" "}
              {next.durationDays} days. Projected returns are illustrative and
              not guaranteed.
            </p>
          </div>
        </div>
        <Button asChild size="sm">
          <Link href={`/dashboard/investments?plan=${next.slug}#invest`}>
            View {next.name} <ArrowRight />
          </Link>
        </Button>
      </div>
    </div>
  );
}
