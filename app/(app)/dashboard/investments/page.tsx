import { CalendarClock, Layers, Plus, TrendingUp, Wallet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { toggleAutoCompoundAction } from "@/app/actions/user";
import { SubmitButton } from "@/components/app/form";
import { InvestWizard } from "@/components/app/invest-wizard";
import { OfferCard } from "@/components/app/offer-card";
import { ToastForm } from "@/components/app/toast-form";
import { TopUpDialog } from "@/components/app/topup-dialog";
import {
  EmptyState,
  PageHeader,
  Panel,
  StatCard,
  StatusBadge,
} from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/guards";
import { effectiveDaily } from "@/lib/compound";
import { connectDb } from "@/lib/db";
import { Investment, User } from "@/lib/models";
import { formatDate, formatUsd } from "@/lib/money";
import { accrue, daysLeft, MIN_TOPUP_DAYS } from "@/lib/services/investments";
import { getOffer } from "@/lib/services/offers";
import { activePlans, plain } from "@/lib/services/queries";

export const metadata: Metadata = { title: "Investments" };

export default async function InvestmentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  await connectDb();
  await accrue(user.id);
  const [plans, list, u, offer] = await Promise.all([
    activePlans(),
    Investment.find({ userId: user.id }).sort({ createdAt: -1 }).lean(),
    User.findById(user.id).lean(),
    getOffer(user.id),
  ]);
  const rows = plain(list);
  const planMax = new Map(
    plans.map((p: { slug: string; maxCents: number }) => [p.slug, p.maxCents]),
  );
  // Money already committed per position (original plus top-ups), to show how much room is left.
  const committed = new Map<string, number>();
  for (const r of rows as {
    _id: string;
    parentId?: string;
    status: string;
    principalCents: number;
  }[]) {
    if (r.status !== "active") continue;
    const root = r.parentId ?? r._id;
    committed.set(root, (committed.get(root) ?? 0) + r.principalCents);
  }
  const topUpInfo = (i: {
    _id: string;
    parentId?: string;
    planSlug: string;
    maturesAt: string;
  }) => {
    const left = daysLeft(new Date(i.maturesAt));
    const max = planMax.get(i.planSlug);
    if (left < MIN_TOPUP_DAYS || max === undefined) return null;
    const room = Math.max(0, max - (committed.get(i.parentId ?? i._id) ?? 0));
    return room >= 1000 ? { daysLeft: left, room } : null;
  };
  type Inv = {
    _id: string;
    planName: string;
    principalCents: number;
    accruedCents: number;
    totalProfitCents: number;
    accruedDays: number;
    durationDays: number;
    maturesAt: string;
    status: string;
    kind?: string;
    autoCompound?: boolean;
    projectedPct: number;
    dailyPct?: number;
    planSlug: string;
    parentId?: string;
  };
  const all = rows as Inv[];
  const active = all.filter((i) => i.status === "active");
  const done = all.filter((i) => i.status !== "active");
  const invested = active.reduce((n, i) => n + i.principalCents, 0);
  const accrued = active.reduce((n, i) => n + i.accruedCents, 0);
  const next = [...active].sort(
    (a, b) => new Date(a.maturesAt).getTime() - new Date(b.maturesAt).getTime(),
  )[0];

  const card = (i: Inv) => {
    const top = i.status === "active" ? topUpInfo(i) : null;
    const pct = Math.min(
      100,
      Math.round((i.accruedDays / Math.max(1, i.durationDays)) * 100),
    );
    return (
      <li key={i._id} className="bg-card space-y-3 rounded-xl border p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link
              href={`/dashboard/investments/${i._id}`}
              className="hover:text-brand font-semibold underline-offset-4 hover:underline"
            >
              {i.planName}
            </Link>
            <p className="text-muted-foreground text-xs">
              {i.kind && i.kind !== "new"
                ? `${i.kind === "topup" ? "Top-up" : "Auto-reinvest"} · `
                : ""}
              Locked until {formatDate(i.maturesAt)}
            </p>
          </div>
          <StatusBadge status={i.status} />
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Invested</p>
            <p className="font-semibold tabular-nums">
              {formatUsd(i.principalCents)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Profit so far</p>
            <p className="text-success font-semibold tabular-nums">
              {formatUsd(i.accruedCents)}
              <span className="text-muted-foreground text-xs font-normal">
                {" "}
                / {formatUsd(i.totalProfitCents)}
              </span>
            </p>
          </div>
        </div>
        <div className="space-y-1">
          <div className="bg-muted h-1.5 overflow-hidden rounded-full">
            <div
              className="bg-brand h-full rounded-full"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            Day {i.accruedDays} of {i.durationDays}
          </p>
        </div>
        {i.status !== "active" && (
          <div className="border-t pt-3">
            <Button asChild size="sm" variant="outline" className="w-full">
              <Link href={`/dashboard/investments/${i._id}`}>View details</Link>
            </Button>
          </div>
        )}
        {i.status === "active" && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
            <ToastForm action={toggleAutoCompoundAction}>
              <input type="hidden" name="id" value={i._id} />
              <input
                type="hidden"
                name="on"
                value={i.autoCompound ? "false" : "true"}
              />
              <SubmitButton
                size="sm"
                variant={i.autoCompound ? "default" : "outline"}
                pending="…"
              >
                Reinvest: {i.autoCompound ? "On" : "Off"}
              </SubmitButton>
            </ToastForm>
            <div className="flex gap-2">
              {top && (
                <TopUpDialog
                  id={i._id}
                  planName={i.planName}
                  daysLeft={top.daysLeft}
                  durationDays={i.durationDays}
                  dailyPct={effectiveDaily(i)}
                  available={u?.balanceCents ?? 0}
                  room={top.room}
                  trigger={
                    <Button size="sm" variant="outline">
                      <Plus /> Top up
                    </Button>
                  }
                />
              )}
              <Button asChild size="sm" variant="outline">
                <Link href={`/dashboard/investments/${i._id}`}>
                  View details
                </Link>
              </Button>
            </div>
          </div>
        )}
      </li>
    );
  };

  return (
    <>
      <PageHeader
        title="Investments"
        description="Choose a plan, then follow each investment until it matures."
        action={
          plans.length ? (
            <InvestWizard
              plans={plans}
              available={u?.balanceCents ?? 0}
              defaultPlan={sp.plan ?? u?.pendingPlanSlug}
              defaultOpen={Boolean(sp.plan)}
            />
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Available to invest"
          value={formatUsd(u?.balanceCents ?? 0)}
          icon={Wallet}
        />
        <StatCard
          label="Invested now"
          value={formatUsd(invested)}
          icon={Layers}
          hint={`${active.length} active`}
        />
        <StatCard
          label="Profit accrued"
          value={formatUsd(accrued)}
          icon={TrendingUp}
          tone="positive"
        />
        <StatCard
          label="Next maturity"
          value={next ? formatDate(next.maturesAt) : "-"}
          icon={CalendarClock}
          hint={next ? next.planName : "No active plans"}
        />
      </div>

      {plans.length === 0 && (
        <Panel>
          <EmptyState
            icon={Layers}
            title="No plans open right now"
            body="New plans will appear here when they are available."
          />
        </Panel>
      )}
      {offer && <OfferCard offer={offer} />}
      <div id="invest" className="scroll-mt-20" />
      <Panel title={`Active investments (${active.length})`}>
        {active.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No active investments"
            body="Choose a plan above once your balance is funded. You will see daily progress here."
            action={
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/deposit">Fund your balance</Link>
              </Button>
            }
          />
        ) : (
          <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {active.map(card)}
          </ul>
        )}
      </Panel>

      {done.length > 0 && (
        <Panel title={`Completed (${done.length})`}>
          <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {done.map(card)}
          </ul>
        </Panel>
      )}
    </>
  );
}
