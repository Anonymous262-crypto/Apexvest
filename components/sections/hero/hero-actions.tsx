"use client";

import { ArrowRight, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { appLinks, hero, type PlanContent } from "@/content/site";
import { useMe } from "@/lib/use-me";
import { cn } from "@/lib/utils";

import { Button } from "../../ui/button";
import HeroForm from "./hero-form";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/**
 * Under the headline. Signed out: pick a plan (optional) and enter an email; the plan travels in the
 * URL through sign-up. Signed in: go straight to the dashboard, or to the invest form for a chosen plan.
 */
export default function HeroActions({ plans }: { plans: PlanContent[] }) {
  const { signedIn, me, dashboardHref } = useMe();
  const [plan, setPlan] = useState<string | undefined>();

  const chips = (
    <div
      className="mx-auto hidden max-w-2xl flex-wrap items-center justify-center gap-2 sm:flex"
      role="group"
      aria-label="Choose a plan to start with"
    >
      {plans.map((p) => {
        const selected = plan === p.slug;
        const className = cn(
          "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors",
          selected
            ? "border-brand bg-brand/10 text-brand"
            : "text-muted-foreground hover:text-foreground hover:bg-accent/60",
        );
        const label = (
          <>
            {p.name}{" "}
            <span className="text-muted-foreground text-xs font-normal">
              from {usd.format(p.minUsd)}
            </span>
          </>
        );
        return signedIn ? (
          <Link
            key={p.slug}
            href={`/dashboard/investments?plan=${p.slug}#invest`}
            className={className}
          >
            {label}
          </Link>
        ) : (
          <button
            key={p.slug}
            type="button"
            aria-pressed={selected}
            onClick={() => setPlan(selected ? undefined : p.slug)}
            className={className}
          >
            {label}
          </button>
        );
      })}
    </div>
  );

  if (signedIn) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href={dashboardHref}>
              <LayoutDashboard /> Go to your dashboard
            </Link>
          </Button>
        </div>
        <p className="text-muted-foreground text-sm">
          {me
            ? `Welcome back${me.username ? `, @${me.username}` : ""}.`
            : "Welcome back."}
          <span className="hidden sm:inline">
            {" "}
            Pick a plan to jump straight to it:
          </span>
        </p>
        {chips}
        <p className="text-muted-foreground text-xs">{hero.microcopy}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Start with any plan, or just enter your email:
      </p>
      {chips}
      <HeroForm plan={plan} />
      {plan && (
        <p className="text-muted-foreground -mt-2 flex items-center justify-center gap-1 text-xs">
          Starting with{" "}
          <span className="text-foreground font-medium">
            {plans.find((p) => p.slug === plan)?.name}
          </span>{" "}
          <ArrowRight className="size-3" aria-hidden="true" /> you will continue
          to it after sign-up.
        </p>
      )}
      <p className="text-muted-foreground text-sm">{hero.microcopy}</p>
      <p className="text-sm">
        <span className="text-muted-foreground">{hero.loginPrompt} </span>
        <a
          href={plan ? `/login?plan=${plan}` : appLinks.login}
          className="text-brand font-medium underline-offset-4 hover:underline"
        >
          {hero.loginLink}
        </a>
      </p>
    </div>
  );
}
