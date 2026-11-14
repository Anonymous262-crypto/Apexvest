import {
  ArrowLeft,
  CalendarClock,
  Check,
  Lock,
  TrendingUp,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { InvestmentGrowthChart } from "@/components/app/investment-chart";
import { PageHeader, Panel, StatCard, StatusBadge } from "@/components/app/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireUser } from "@/lib/auth/guards";
import { effectiveDaily, profitCents, schedule } from "@/lib/compound";
import { connectDb } from "@/lib/db";
import { Investment } from "@/lib/models";
import { formatDate, formatUsd } from "@/lib/money";
import { accrue } from "@/lib/services/investments";
import { plain } from "@/lib/services/queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Investment" };

const DAY = 86_400_000;

export default async function InvestmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  await connectDb();
  await accrue(user.id);
  const doc = await Investment.findOne({ _id: id, userId: user.id })
    .lean()
    .catch(() => null);
  if (!doc) notFound();
  const inv = plain(doc) as {
    _id: string;
    planName: string;
    principalCents: number;
    durationDays: number;
    projectedPct: number;
    dailyPct?: number;
    totalProfitCents: number;
    startedAt: string;
    maturesAt: string;
    status: string;
    kind?: string;
    autoCompound?: boolean;
  };

  // eslint-disable-next-line react-hooks/purity -- server component, evaluated once per request
  const nowMs = Date.now();
  const daily = effectiveDaily(inv);
  const compounding = inv.dailyPct != null;
  const rows = compounding
    ? schedule(inv.principalCents, daily, inv.durationDays)
    : [];
  const elapsed = Math.min(
    inv.durationDays,
    Math.max(0, Math.floor((nowMs - new Date(inv.startedAt).getTime()) / DAY)),
  );
  const earned = compounding
    ? profitCents(inv.principalCents, daily, elapsed)
    : Math.round((inv.totalProfitCents * elapsed) / inv.durationDays);
  const left = Math.max(0, inv.durationDays - elapsed);
  const matured = inv.status === "matured";

  return (
    <>
      <Link
        href="/dashboard/investments"
        className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> All investments
      </Link>
      <PageHeader
        title={`${inv.planName} investment`}
        description={`${daily.toFixed(2)}% a day, compounded, over ${inv.durationDays} days. Started ${formatDate(inv.startedAt)}.`}
        action={<StatusBadge status={inv.status} />}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Invested" value={formatUsd(inv.principalCents)} />
        <StatCard
          label="Earned so far"
          value={`+${formatUsd(earned)}`}
          tone="positive"
          icon={TrendingUp}
          hint={`Day ${elapsed} of ${inv.durationDays}`}
        />
        <StatCard
          label="Projected at maturity"
          value={formatUsd(inv.principalCents + inv.totalProfitCents)}
          hint={`+${formatUsd(inv.totalProfitCents)} projected`}
        />
        <StatCard
          label={matured ? "Matured" : "Locked until"}
          value={formatDate(inv.maturesAt)}
          icon={matured ? CalendarClock : Lock}
          hint={
            matured
              ? "Credited to your balance"
              : `${left} day${left === 1 ? "" : "s"} left`
          }
        />
      </div>

      {!matured && (
        <p className="bg-muted/50 flex items-start gap-2 rounded-lg border px-4 py-3 text-sm">
          <Lock
            className="text-muted-foreground mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          <span>
            Your principal and the profit that builds each day are locked until{" "}
            <strong>{formatDate(inv.maturesAt)}</strong>. On that date the full
            amount is credited to your available balance
            {inv.autoCompound
              ? ", and then reinvested automatically as you chose"
              : ", and you can withdraw it"}
            . Projected returns are illustrative and not guaranteed.
          </span>
        </p>
      )}

      {compounding && (
        <>
          <Panel
            title="Growth"
            description="Projected value of this investment, day by day"
          >
            <InvestmentGrowthChart
              data={rows.map((r) => ({
                day: r.day,
                value: r.valueCents / 100,
              }))}
              elapsed={elapsed}
              principal={inv.principalCents / 100}
            />
          </Panel>
          <Panel
            title="Daily schedule"
            description="What is added each day. A tick means that day's profit has been added."
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">
                  {elapsed} of {inv.durationDays} days added
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {Math.round((elapsed / inv.durationDays) * 100)}%
                </span>
              </div>
              <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                <div
                  className="bg-success h-full rounded-full"
                  style={{ width: `${(elapsed / inv.durationDays) * 100}%` }}
                />
              </div>
            </div>
            <div className="max-h-[34rem] overflow-y-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead>Day</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Added that day</TableHead>
                    <TableHead className="text-right">Total profit</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow
                      key={r.day}
                      className={cn(
                        r.day > elapsed && "text-muted-foreground",
                        r.day === elapsed && "bg-success/5",
                      )}
                    >
                      <TableCell data-label="Added">
                        {r.day <= elapsed ? (
                          <span
                            className="bg-success text-primary-foreground flex size-5 items-center justify-center rounded-full"
                            title="Added"
                          >
                            <Check className="size-3" aria-hidden="true" />
                            <span className="sr-only">Added</span>
                          </span>
                        ) : (
                          <span
                            className="flex size-5 items-center justify-center rounded-full border border-dashed"
                            title="Upcoming"
                          >
                            <span className="sr-only">Upcoming</span>
                          </span>
                        )}
                      </TableCell>
                      <TableCell data-label="Day">
                        {r.day}
                        {r.day === elapsed && (
                          <span className="text-success ml-1.5 text-xs font-medium">
                            added today
                          </span>
                        )}
                      </TableCell>
                      <TableCell data-label="Date">
                        {formatDate(
                          new Date(
                            new Date(inv.startedAt).getTime() + r.day * DAY,
                          ),
                        )}
                      </TableCell>
                      <TableCell
                        data-label="Added that day"
                        className={cn(
                          "text-right tabular-nums",
                          r.day <= elapsed && "text-success font-medium",
                        )}
                      >
                        +{formatUsd(r.dayCents)}
                      </TableCell>
                      <TableCell
                        data-label="Total profit"
                        className="text-right tabular-nums"
                      >
                        {formatUsd(r.profitCents)}
                      </TableCell>
                      <TableCell
                        data-label="Value"
                        className="text-right tabular-nums"
                      >
                        {formatUsd(r.valueCents)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Panel>
        </>
      )}
    </>
  );
}
