import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Layers,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import {
  Checklist,
  EmptyState,
  PageHeader,
  Panel,
  StatCard,
} from "@/components/app/ui";
import { formatDateTime, formatUsd } from "@/lib/money";
import { adminOverview } from "@/lib/services/queries";

export const metadata: Metadata = { title: "Admin overview" };

export default async function AdminOverview() {
  const o = await adminOverview();
  const queues = [
    {
      href: "/admin/deposits",
      label: "Pending deposits",
      n: o.pendDep,
      icon: ArrowDownToLine,
    },
    {
      href: "/admin/withdrawals",
      label: "Pending withdrawals",
      n: o.pendWd,
      icon: ArrowUpFromLine,
    },
    {
      href: "/admin/users",
      label: "KYC to review",
      n: o.pendKyc,
      icon: ShieldCheck,
    },
  ];
  return (
    <>
      <PageHeader
        title="Overview"
        description="Platform totals and the work waiting for review."
      />
      <Checklist
        title="Suggested next steps"
        description="A few things that keep the platform ready for users."
        steps={[
          {
            label: "Add a payment method",
            hint: "Users cannot deposit until an asset has a network and wallet address.",
            done: o.liveMethods > 0,
            href: "/admin/payment-methods",
            cta: "Add one",
          },
          {
            label: "Check your plans",
            hint: "At least one active plan is needed before anyone can invest.",
            done: o.livePlans > 0,
            href: "/admin/settings",
            cta: "Review plans",
          },
          {
            label: "Clear the review queues",
            hint: `${o.pendDep} deposits, ${o.pendWd} withdrawals and ${o.pendKyc} identity checks are waiting.`,
            done: o.pendDep + o.pendWd + o.pendKyc === 0,
            href: o.pendDep
              ? "/admin/deposits"
              : o.pendWd
                ? "/admin/withdrawals"
                : "/admin/users",
            cta: "Open queue",
          },
        ]}
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total users" value={String(o.users)} icon={Users} />
        <StatCard label="Verified users" value={String(o.verified)} />
        <StatCard
          label="Total deposits"
          value={formatUsd(o.deposits)}
          icon={ArrowDownToLine}
        />
        <StatCard
          label="Total withdrawals"
          value={formatUsd(o.withdrawals)}
          icon={ArrowUpFromLine}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {queues.map((q) => (
          <Link
            key={q.href}
            href={q.href}
            className="bg-card hover:border-brand/50 flex items-center justify-between rounded-xl border p-4 transition-colors"
          >
            <div>
              <p className="text-muted-foreground text-xs">{q.label}</p>
              <p className="text-2xl font-semibold tabular-nums">{q.n}</p>
            </div>
            <q.icon
              className={
                q.n
                  ? "text-gold-foreground size-5"
                  : "text-muted-foreground size-5"
              }
            />
          </Link>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StatCard
          label="Active principal"
          value={formatUsd(o.activePrincipal)}
          hint={`${o.activeCount} active investments`}
          icon={Layers}
        />
        <Panel title="Recent admin activity">
          {o.recentAudit.length === 0 ? (
            <EmptyState
              title="No admin activity yet"
              body="Approvals, wallet changes and plan edits will be logged here."
            />
          ) : (
            <ul className="divide-y text-sm">
              {o.recentAudit.map(
                (a: {
                  _id: string;
                  action: string;
                  actorEmail?: string;
                  createdAt: string;
                }) => (
                  <li
                    key={a._id}
                    className="flex items-center justify-between gap-2 py-2"
                  >
                    <span>
                      <span className="font-medium">{a.action}</span>{" "}
                      <span className="text-muted-foreground">
                        by {a.actorEmail}
                      </span>
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {formatDateTime(a.createdAt)}
                    </span>
                  </li>
                ),
              )}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
