"use client";

import NumberFlow from "@number-flow/react";
import { CircleCheck, Star } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { SegmentedToggle } from "@/components/ui/segmented-toggle";
import { appLinks, type PlanContent, plans } from "@/content/site";
import { profitCents } from "@/lib/compound";
import { useMe } from "@/lib/use-me";
import { cn } from "@/lib/utils";

type View = "total" | "daily";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function features(p: PlanContent) {
  const profit = Math.round(
    profitCents(p.minUsd * 100, p.dailyPct, p.durationDays) / 100,
  );
  return [
    `${usd.format(p.minUsd)} to ${usd.format(p.maxUsd)}`,
    `${p.durationDays}-day term`,
    `${p.dailyPct}% a day, compounded daily`,
    `About ${usd.format(profit)} projected on ${usd.format(p.minUsd)}`,
    "Locked until the end date, then credited",
  ];
}

/** Efferd pricing-4 layout, adapted: the big number is the projected return, the toggle switches total vs per day. */
/** Keeps the cards in sync with the admin's plans: refetches on focus and every 30s while visible. */
function useLivePlans(initial: PlanContent[]) {
  const [live, setLive] = useState<PlanContent[] | null>(null);
  useEffect(() => {
    let stop = false;
    async function refresh() {
      if (document.visibilityState !== "visible") return;
      try {
        const r = await fetch("/api/public-plans", { cache: "no-store" });
        if (!r.ok) return;
        const j = (await r.json()) as { plans?: PlanContent[] };
        if (!stop && j.plans?.length)
          setLive((cur) =>
            JSON.stringify(cur) === JSON.stringify(j.plans) ? cur : j.plans!,
          );
      } catch {}
    }
    const t = setInterval(refresh, 30_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      stop = true;
      clearInterval(t);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  return live ?? initial;
}

const PER_PAGE = 3;

/** Three plans at a time, grouped smallest to largest, so each group is easy to compare. */
export function Pricing({ initial }: { initial: PlanContent[] }) {
  const items = useLivePlans(initial);
  const [view, setView] = useState<View>("total");
  const [page, setPage] = useState(0);

  const groups: PlanContent[][] = [];
  for (let i = 0; i < items.length; i += PER_PAGE)
    groups.push(items.slice(i, i + PER_PAGE));
  const current = Math.min(page, groups.length - 1);
  const label = (g: PlanContent[]) =>
    g.length > 1 ? `${g[0].name} to ${g[g.length - 1].name}` : g[0].name;

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
        {groups.length > 1 && (
          <SegmentedToggle
            label="Choose plan group"
            value={String(current)}
            onChange={(v) => setPage(Number(v))}
            options={groups.map((g, i) => ({
              value: String(i),
              label: label(g),
            }))}
            className="mx-0"
          />
        )}
        <SegmentedToggle
          label="Show projected return"
          value={view}
          onChange={setView}
          options={[
            { value: "total", label: plans.toggle.total },
            { value: "daily", label: plans.toggle.daily },
          ]}
          className="mx-0"
        />
      </div>
      <div
        key={current}
        className="animate-in fade-in slide-in-from-bottom-2 mx-auto grid w-full max-w-5xl grid-cols-1 gap-5 duration-300 md:grid-cols-3"
      >
        {(groups[current] ?? []).map((plan) => (
          <PlanCard key={plan.slug} plan={plan} view={view} />
        ))}
      </div>
    </div>
  );
}

function PlanCard({ plan, view }: { plan: PlanContent; view: View }) {
  const { signedIn } = useMe();
  // Signed in: straight to the invest form for this plan. Signed out: sign up with the plan in the URL.
  const href = signedIn
    ? `/dashboard/investments?plan=${plan.slug}#invest`
    : appLinks.registerWith({ plan: plan.slug });
  const value = view === "total" ? plan.projectedPct : plan.dailyPct;
  return (
    <article
      aria-labelledby={`plan-${plan.slug}`}
      className={cn(
        "bg-card relative flex w-full flex-col overflow-hidden rounded-xl border shadow-sm",
        plan.featured && "border-brand ring-brand/20 shadow-lg ring-4",
      )}
    >
      {plan.featured && (
        <span
          aria-hidden="true"
          className="gold-line absolute top-0 left-[10%] h-px w-[80%]"
        />
      )}
      <div className={cn("border-b p-5", plan.featured && "bg-brand/[0.03]")}>
        {plan.badge && (
          <span className="border-gold/60 bg-gold/10 text-gold-foreground absolute top-3 right-3 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium">
            <Star className="size-3 fill-current" aria-hidden="true" />
            {plan.badge}
          </span>
        )}
        <h3 id={`plan-${plan.slug}`} className="text-lg font-semibold">
          {plan.name}
        </h3>
        <p className="text-muted-foreground mt-1 min-h-10 text-sm">
          {plan.tagline}
        </p>
        <div className="mt-5 flex items-end gap-1.5">
          <NumberFlow
            className="text-4xl font-extrabold tracking-tight tabular-nums"
            value={value / 100}
            format={{
              style: "percent",
              maximumFractionDigits: view === "total" ? 1 : 2,
              minimumFractionDigits: view === "total" ? 1 : 2,
            }}
          />
          <span className="text-muted-foreground pb-1 text-sm">
            {view === "total" ? `over ${plan.durationDays} days` : "per day"}
          </span>
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          {plans.returnLabel}, illustrative
        </p>
      </div>
      <ul className="text-muted-foreground flex-1 space-y-3 p-5 text-sm">
        {features(plan).map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <CircleCheck
              className="text-brand mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="border-t p-4">
        <Button
          asChild
          size="lg"
          variant={plan.featured ? "default" : "outline"}
          className="w-full"
        >
          <a href={href}>{plan.button}</a>
        </Button>
      </div>
    </article>
  );
}
