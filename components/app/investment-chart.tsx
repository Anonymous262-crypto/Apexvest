"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const config = {
  value: { label: "Projected value", color: "var(--brand)" },
} satisfies ChartConfig;
const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const compact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Compounding curve for one investment, with a marker for today. */
export function InvestmentGrowthChart({
  data,
  elapsed,
  principal,
}: {
  data: { day: number; value: number }[];
  elapsed: number;
  principal: number;
}) {
  const points = [{ day: 0, value: principal }, ...data];
  return (
    <ChartContainer config={config} className="h-48 w-full min-w-0 sm:h-60">
      <AreaChart data={points} margin={{ left: 0, right: 12, top: 8 }}>
        <defs>
          <linearGradient id="inv" x1="0" x2="0" y1="0" y2="1">
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
          dataKey="day"
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={32}
          tick={{ fontSize: 11 }}
          tickFormatter={(v: number) => `Day ${v}`}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={48}
          tickCount={4}
          tick={{ fontSize: 11 }}
          domain={[principal, "auto"]}
          tickFormatter={(v: number) => compact.format(v)}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, p) => `Day ${p?.[0]?.payload?.day ?? ""}`}
              formatter={(v) => usd.format(Number(v))}
            />
          }
        />
        {elapsed > 0 && (
          <ReferenceLine
            x={elapsed}
            stroke="var(--gold)"
            strokeDasharray="3 3"
            label={{
              value: "Today",
              fontSize: 11,
              fill: "var(--gold-foreground)",
              position: "insideTopLeft",
            }}
          />
        )}
        <Area
          dataKey="value"
          type="monotone"
          stroke="var(--color-value)"
          strokeWidth={2}
          fill="url(#inv)"
        />
      </AreaChart>
    </ChartContainer>
  );
}
