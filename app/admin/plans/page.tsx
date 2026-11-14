import {
  ArrowDown,
  ArrowUp,
  BadgePercent,
  Clock,
  Download,
  Eye,
  EyeOff,
  Layers,
  Pencil,
  Plus,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import type { Metadata } from "next";

import {
  deletePlanAction,
  movePlanAction,
  syncDefaultPlansAction,
  togglePlanAction,
} from "@/app/actions/admin";
import { IconSubmit, SubmitButton } from "@/components/app/form";
import { PlanDialog } from "@/components/app/plan-form";
import { ConfirmAction, ToastForm } from "@/components/app/toast-form";
import {
  EmptyState,
  PageHeader,
  Panel,
  StatCard,
  StatusBadge,
} from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { effectiveDaily } from "@/lib/compound";
import { profitCents } from "@/lib/compound";
import { connectDb } from "@/lib/db";
import { Investment, Plan } from "@/lib/models";
import { formatUsd } from "@/lib/money";
import { plain } from "@/lib/services/queries";

export const metadata: Metadata = { title: "Plans" };

type P = {
  _id: string;
  slug: string;
  name: string;
  tagline?: string;
  minCents: number;
  maxCents: number;
  durationDays: number;
  projectedPct: number;
  dailyPct?: number;
  active: boolean;
  featured?: boolean;
  badge?: string;
};
type Usage = { _id: string; active: number; principal: number; total: number };

const daily = (p: {
  dailyPct?: number;
  projectedPct: number;
  durationDays: number;
}) => Math.round(effectiveDaily(p) * 1000) / 1000;

export default async function PlansPage() {
  await connectDb();
  const [plans, usageRows] = await Promise.all([
    plain(await Plan.find().sort({ sort: 1, createdAt: 1 }).lean()) as P[],
    Investment.aggregate([
      {
        $group: {
          _id: "$planId",
          active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
          principal: {
            $sum: {
              $cond: [{ $eq: ["$status", "active"] }, "$principalCents", 0],
            },
          },
          total: { $sum: 1 },
        },
      },
    ]) as Promise<Usage[]>,
  ]);
  const usage = new Map(usageRows.map((u) => [String(u._id), u]));
  const open = plans.filter((p) => p.active).length;
  const totalPrincipal = usageRows.reduce((s, u) => s + u.principal, 0);
  const totalActive = usageRows.reduce((s, u) => s + u.active, 0);

  return (
    <>
      <PageHeader
        title="Plans"
        description="The investment plans users can choose from. Terms are shown up front, and edits only affect new investments."
        action={
          <div className="flex flex-wrap gap-2">
            <ToastForm action={syncDefaultPlansAction}>
              <SubmitButton variant="outline" size="default" pending="Loading…">
                <Download /> Load default plans
              </SubmitButton>
            </ToastForm>
            <PlanDialog
              trigger={
                <Button>
                  <Plus /> New plan
                </Button>
              }
            />
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Open plans"
          value={`${open} of ${plans.length}`}
          icon={BadgePercent}
        />
        <StatCard
          label="Active investments"
          value={String(totalActive)}
          icon={Users}
        />
        <StatCard
          label="Invested in plans"
          value={formatUsd(totalPrincipal)}
          icon={Wallet}
        />
        <StatCard
          label="Investments, all time"
          value={String(usageRows.reduce((n, u) => n + u.total, 0))}
          icon={Layers}
        />
      </div>

      {plans.length === 0 ? (
        <Panel>
          <EmptyState
            icon={Layers}
            title="No plans yet"
            body="Create your first plan so users have something to invest in. Run npm run seed for the three starter plans."
            action={
              <PlanDialog
                trigger={
                  <Button size="sm">
                    <Plus /> Create a plan
                  </Button>
                }
              />
            }
          />
        </Panel>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((p, idx) => {
            const u = usage.get(p._id);
            const used = (u?.total ?? 0) > 0;
            return (
              <Panel key={p._id} className={p.active ? "" : "opacity-80"}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="flex items-center gap-2 truncate text-lg font-semibold">
                      {p.name}
                      {p.badge && (
                        <span className="border-gold/60 bg-gold/10 text-gold-foreground rounded-md border px-1.5 py-0.5 text-[10px] font-medium">
                          {p.badge}
                        </span>
                      )}
                      {p.featured && !p.badge && (
                        <span className="border-brand/40 bg-brand/10 text-brand rounded-md border px-1.5 py-0.5 text-[10px] font-medium">
                          Featured
                        </span>
                      )}
                    </h2>
                    <p className="text-muted-foreground line-clamp-2 min-h-8 text-xs">
                      {p.tagline || "No tagline"}
                    </p>
                  </div>
                  <StatusBadge status={p.active ? "active" : "suspended"} />
                </div>

                <dl className="grid grid-cols-1 gap-2 text-sm">
                  <div className="bg-muted/40 flex items-center justify-between rounded-lg px-3 py-2">
                    <dt className="text-muted-foreground flex items-center gap-2">
                      <Wallet className="size-4" aria-hidden="true" /> Amount
                    </dt>
                    <dd className="font-medium tabular-nums">
                      {formatUsd(p.minCents)} to {formatUsd(p.maxCents)}
                    </dd>
                  </div>
                  <div className="bg-muted/40 flex items-center justify-between rounded-lg px-3 py-2">
                    <dt className="text-muted-foreground flex items-center gap-2">
                      <Clock className="size-4" aria-hidden="true" /> Duration
                    </dt>
                    <dd className="font-medium">{p.durationDays} days</dd>
                  </div>
                  <div className="bg-muted/40 flex items-center justify-between rounded-lg px-3 py-2">
                    <dt className="text-muted-foreground flex items-center gap-2">
                      <BadgePercent className="size-4" aria-hidden="true" />{" "}
                      Daily return
                    </dt>
                    <dd className="text-brand font-semibold">
                      {daily(p)}%{" "}
                      <span className="text-muted-foreground text-xs font-normal">
                        = {p.projectedPct}% total
                      </span>
                    </dd>
                  </div>
                </dl>

                <div className="space-y-1.5">
                  <div className="text-muted-foreground flex justify-between text-xs">
                    <span>
                      {u
                        ? `${u.active} active · ${u.total} all time`
                        : "No investments yet"}
                    </span>
                    <span className="tabular-nums">
                      {formatUsd(u?.principal ?? 0)}
                    </span>
                  </div>
                  <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                    <div
                      className="bg-brand h-full rounded-full"
                      style={{
                        width: `${totalPrincipal ? Math.round(((u?.principal ?? 0) / totalPrincipal) * 100) : 0}%`,
                      }}
                    />
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Example: {formatUsd(p.minCents)} projects about{" "}
                    {formatUsd(
                      profitCents(
                        p.minCents,
                        effectiveDaily(p),
                        p.durationDays,
                      ),
                    )}{" "}
                    profit (illustrative).
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                  <div className="flex items-center gap-1">
                    <PlanDialog
                      key={`${p._id}-${p.name}-${p.tagline}-${p.minCents}-${p.maxCents}-${p.durationDays}-${p.projectedPct}-${p.active}-${p.featured}-${p.badge}`}
                      plan={{
                        id: p._id,
                        slug: p.slug,
                        name: p.name,
                        tagline: p.tagline,
                        minCents: p.minCents,
                        maxCents: p.maxCents,
                        durationDays: p.durationDays,
                        projectedPct: p.projectedPct,
                        dailyPct: p.dailyPct,
                        active: p.active,
                        featured: p.featured,
                        badge: p.badge,
                      }}
                      trigger={
                        <Button size="sm" variant="outline">
                          <Pencil /> Edit
                        </Button>
                      }
                    />
                    <ToastForm action={togglePlanAction}>
                      <input type="hidden" name="id" value={p._id} />
                      <IconSubmit
                        label={
                          p.active
                            ? `Close ${p.name} to new investments`
                            : `Open ${p.name} to new investments`
                        }
                      >
                        {p.active ? <EyeOff /> : <Eye />}
                      </IconSubmit>
                    </ToastForm>
                  </div>
                  <div className="flex items-center gap-1">
                    {idx > 0 && (
                      <ToastForm action={movePlanAction}>
                        <input type="hidden" name="id" value={p._id} />
                        <input type="hidden" name="dir" value="up" />
                        <IconSubmit label={`Move ${p.name} earlier`}>
                          <ArrowUp />
                        </IconSubmit>
                      </ToastForm>
                    )}
                    {idx < plans.length - 1 && (
                      <ToastForm action={movePlanAction}>
                        <input type="hidden" name="id" value={p._id} />
                        <input type="hidden" name="dir" value="down" />
                        <IconSubmit label={`Move ${p.name} later`}>
                          <ArrowDown />
                        </IconSubmit>
                      </ToastForm>
                    )}
                    <ConfirmAction
                      trigger={
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Delete ${p.name}`}
                          title={used ? "In use, close it instead" : "Delete"}
                        >
                          <Trash2 />
                        </Button>
                      }
                      title={`Delete ${p.name}?`}
                      description={
                        used
                          ? "This plan has investments, so it cannot be deleted. Close it to new investments instead."
                          : "This permanently removes the plan. It has no investments."
                      }
                      confirmLabel={used ? "Try anyway" : "Delete"}
                      action={deletePlanAction}
                      fields={{ id: p._id }}
                    />
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>
      )}
      <p className="text-muted-foreground text-xs">
        Projected returns are illustrative and not guaranteed. The plans on the
        public landing page are written separately in{" "}
        <code>content/site.ts</code>, so update both when terms change.
      </p>
    </>
  );
}
