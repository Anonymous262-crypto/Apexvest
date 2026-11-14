import { PieChart } from "lucide-react";
import type { Metadata } from "next";

import { PortfolioChart } from "@/components/app/portfolio-chart";
import { EmptyState, PageHeader, Panel, StatCard } from "@/components/app/ui";
import { requireUser } from "@/lib/auth/guards";
import { connectDb } from "@/lib/db";
import { Investment } from "@/lib/models";
import { formatUsd } from "@/lib/money";
import {
  investorOverview,
  plain,
  portfolioSeries,
} from "@/lib/services/queries";

export const metadata: Metadata = { title: "My Portfolio" };

export default async function PortfolioPage() {
  const user = await requireUser();
  const o = await investorOverview(user.id);
  await connectDb();
  const [series, active] = await Promise.all([
    portfolioSeries(user.id, 90),
    Investment.find({ userId: user.id, status: "active" }).lean(),
  ]);
  const byPlan = new Map<string, number>();
  for (const i of plain(active) as {
    planName: string;
    principalCents: number;
  }[])
    byPlan.set(i.planName, (byPlan.get(i.planName) ?? 0) + i.principalCents);
  const parts = [["Available", o.available], ...byPlan.entries()] as [
    string,
    number,
  ][];
  const total = parts.reduce((s, [, v]) => s + v, 0) || 1;
  return (
    <>
      <PageHeader
        title="My Portfolio"
        description="How your money is spread across your balance and plans."
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Portfolio value" value={formatUsd(o.total)} />
        <StatCard label="Available" value={formatUsd(o.available)} />
        <StatCard label="Invested" value={formatUsd(o.invested)} />
        <StatCard
          label="Profit / loss"
          value={formatUsd(o.profit)}
          tone={o.profit > 0 ? "positive" : undefined}
        />
      </div>
      <Panel title="Growth" description="Last 90 days, in USD">
        <PortfolioChart data={series} />
      </Panel>
      <Panel title="Allocation">
        {total <= 1 ? (
          <EmptyState
            icon={PieChart}
            title="Nothing to show yet"
            body="Your allocation appears once your balance is funded."
          />
        ) : (
          <ul className="space-y-3">
            {parts.map(([name, v]) => (
              <li key={name} className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>{name}</span>
                  <span className="tabular-nums">
                    {formatUsd(v)} · {Math.round((v / total) * 100)}%
                  </span>
                </div>
                <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                  <div
                    className="bg-brand h-full"
                    style={{ width: `${(v / total) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
