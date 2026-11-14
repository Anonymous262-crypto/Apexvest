import {
  ArrowDownToLine,
  Layers,
  PiggyBank,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ContinueCard } from "@/components/app/continue-card";
import { OfferCard } from "@/components/app/offer-card";
import { PortfolioChart } from "@/components/app/portfolio-chart";
import {
  Checklist,
  EmptyState,
  LEDGER_LABEL,
  PageHeader,
  Panel,
  StatCard,
} from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/guards";
import { connectDb } from "@/lib/db";
import { Deposit, Investment, Plan, User } from "@/lib/models";
import { formatDate, formatUsd } from "@/lib/money";
import { getOffer } from "@/lib/services/offers";
import { investorOverview } from "@/lib/services/queries";
import { kycStatus } from "@/lib/services/withdrawals";

export const metadata: Metadata = { title: "Overview" };

export default async function Overview() {
  const user = await requireUser();
  await connectDb();
  const [o, kyc, funded, invested, offer, pendingPlan] = await Promise.all([
    investorOverview(user.id),
    kycStatus(user.id),
    Deposit.countDocuments({ userId: user.id, status: "approved" }),
    Investment.countDocuments({ userId: user.id }),
    getOffer(user.id),
    User.findById(user.id)
      .select("pendingPlanSlug")
      .lean()
      .then((u) =>
        u?.pendingPlanSlug
          ? Plan.findOne({ slug: u.pendingPlanSlug, active: true }).lean()
          : null,
      ),
  ]);
  const first = (user.name || user.email).split(/[ @]/)[0];

  return (
    <>
      <PageHeader
        title={`Welcome back, ${first}`}
        description="Your portfolio, deposits and withdrawals at a glance."
        action={
          <Button asChild>
            <Link href="/dashboard/deposit?new=1">
              <ArrowDownToLine /> Deposit
            </Link>
          </Button>
        }
      />
      {kyc !== "approved" && (
        <div className="border-gold/50 bg-gold/10 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm">
          <span>
            {kyc === "pending"
              ? "Your identity verification is under review. Withdrawals unlock once it is approved."
              : "Verify your identity to unlock withdrawals."}
          </span>
          {kyc !== "pending" && (
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/settings">Verify identity</Link>
            </Button>
          )}
        </div>
      )}
      {pendingPlan && invested === 0 && (
        <ContinueCard
          plan={{
            slug: pendingPlan.slug as string,
            name: pendingPlan.name as string,
            minCents: pendingPlan.minCents as number,
            maxCents: pendingPlan.maxCents as number,
            durationDays: pendingPlan.durationDays as number,
            projectedPct: pendingPlan.projectedPct as number,
          }}
          available={o.available}
        />
      )}
      {offer && <OfferCard offer={offer} />}
      <Checklist
        title="Get started"
        description="Four quick steps to get the most out of your account."
        steps={[
          {
            label: "Make your first deposit",
            hint: "Send crypto and we credit your balance once it is confirmed.",
            done: funded > 0 || o.available > 0,
            href: "/dashboard/deposit",
            cta: "Deposit",
          },
          {
            label: "Start an investment",
            hint: "Compare plan terms, then put your balance to work.",
            done: invested > 0,
            href: "/dashboard/investments",
            cta: "Pick a plan",
          },
          {
            label: "Verify your identity",
            hint: "Required before your first withdrawal.",
            done: kyc === "approved" || kyc === "pending",
            href: "/dashboard/settings",
            cta: "Verify",
          },
          {
            label: "Turn on two-step login",
            hint: "Add an authenticator app for extra protection.",
            done: user.mfaEnabled,
            href: "/dashboard/settings",
            cta: "Set up",
          },
        ]}
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Portfolio value"
          value={formatUsd(o.total)}
          icon={PiggyBank}
        />
        <StatCard
          label="Available balance"
          value={formatUsd(o.available)}
          icon={Wallet}
        />
        <StatCard
          label="Total invested"
          value={formatUsd(o.invested)}
          hint={`${o.activeCount} active`}
          icon={Layers}
        />
        <StatCard
          label="Profit / loss"
          value={`${o.profit >= 0 ? "+" : ""}${formatUsd(o.profit)}`}
          tone={o.profit > 0 ? "positive" : undefined}
          icon={TrendingUp}
          hint="Projected, illustrative"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Panel
          title="Portfolio growth"
          description="Last 30 days, in USD"
          className="lg:col-span-3"
        >
          <PortfolioChart data={o.series} />
        </Panel>
        <Panel title="Recent activity" className="lg:col-span-2">
          {o.recent.length === 0 ? (
            <EmptyState
              title="No activity yet"
              body="Make a deposit to get started."
            />
          ) : (
            <ul className="divide-y">
              {o.recent.map(
                (e: {
                  _id: string;
                  type: string;
                  amountCents: number;
                  createdAt: string;
                }) => (
                  <li
                    key={e._id}
                    className="flex items-center justify-between gap-3 py-2.5 text-sm"
                  >
                    <span>
                      <span className="block font-medium">
                        {LEDGER_LABEL[e.type] ?? e.type}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {formatDate(e.createdAt)}
                      </span>
                    </span>
                    <span
                      className={
                        e.amountCents >= 0
                          ? "text-success font-semibold tabular-nums"
                          : "font-semibold tabular-nums"
                      }
                    >
                      {e.amountCents >= 0 ? "+" : ""}
                      {formatUsd(e.amountCents)}
                    </span>
                  </li>
                ),
              )}
            </ul>
          )}
          <Button asChild variant="ghost" size="sm" className="self-start">
            <Link href="/dashboard/transactions">View all transactions</Link>
          </Button>
        </Panel>
      </div>
      {o.pendingDeposits > 0 && (
        <p className="text-muted-foreground text-sm">
          {o.pendingDeposits} deposit{o.pendingDeposits > 1 ? "s" : ""} awaiting
          confirmation. We target confirmation within about an hour.
        </p>
      )}
    </>
  );
}
