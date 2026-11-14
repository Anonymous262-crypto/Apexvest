"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const config = {
  value: { label: "Portfolio value", color: "var(--brand)" },
} satisfies ChartConfig;

const compact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function PortfolioChart({
  data,
}: {
  data: { date: string; value: number }[];
}) {
  return (
    <ChartContainer config={config} className="h-48 w-full min-w-0 sm:h-60">
      <AreaChart data={data} margin={{ left: 0, right: 12, top: 8 }}>
        <defs>
          <linearGradient id="pv" x1="0" x2="0" y1="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-value)"
              stopOpacity={0.35}
            />
            <stop
              offset="100%"
              stopColor="var(--color-value)"
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="4 6" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          minTickGap={40}
          interval="preserveStartEnd"
          tick={{ fontSize: 11 }}
          tickFormatter={(v: string) =>
            new Date(v).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          }
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={44}
          tickCount={4}
          tick={{ fontSize: 11 }}
          tickFormatter={(v: number) => compact.format(v)}
          domain={[0, "auto"]}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent formatter={(v) => usd.format(Number(v))} />
          }
        />
        <Area
          dataKey="value"
          type="monotone"
          stroke="var(--color-value)"
          strokeWidth={2}
          fill="url(#pv)"
        />
      </AreaChart>
    </ChartContainer>
  );
}
