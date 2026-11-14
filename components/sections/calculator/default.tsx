"use client";

import {
  CalendarClock,
  DollarSign,
  type LucideIcon,
  Percent,
} from "lucide-react";
import { useId, useState } from "react";

import { calculator } from "@/content/site";

import { IconInput } from "../../app/icon-input";
import { GrowthChart } from "../../mockups/chart";
import { Section } from "../../ui/section";

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function Field({
  icon,
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <IconInput
        icon={icon}
        id={id}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={Number.isFinite(value) ? value : ""}
        onChange={(e) => onChange(Number(e.target.value))}
        groupClassName="bg-secondary"
        className="text-base sm:text-sm"
      />
    </div>
  );
}

const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : lo));

export default function Calculator() {
  const [amount, setAmount] = useState(1000);
  const [rate, setRate] = useState(8);
  const [years, setYears] = useState(5);

  const P = clamp(amount, 0, 1_000_000);
  const r = clamp(rate, 0, 100) / 100;
  const t = clamp(years, 1, 40);
  const series = Array.from(
    { length: Math.round(t) + 1 },
    (_, i) => P * (1 + r) ** i,
  );
  const final = P * (1 + r) ** t;

  return (
    <Section id={calculator.id} aria-labelledby="calc-title" className="reveal">
      <div className="max-w-container mx-auto flex flex-col items-center gap-10">
        <h2
          id="calc-title"
          className="max-w-[640px] text-center text-[clamp(1.625rem,3vw,2.25rem)] leading-tight font-semibold tracking-tight text-balance"
        >
          {calculator.title}
        </h2>
        <div className="grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
          <div className="bg-card border-border dark:border-border/10 flex flex-col gap-5 rounded-xl border p-6 shadow-md">
            <Field
              icon={DollarSign}
              label={calculator.amountLabel}
              value={amount}
              onChange={setAmount}
              min={0}
              max={1000000}
              step={100}
            />
            <Field
              icon={Percent}
              label={calculator.returnLabel}
              value={rate}
              onChange={setRate}
              min={0}
              max={100}
              step={0.5}
            />
            <Field
              icon={CalendarClock}
              label={calculator.yearsLabel}
              value={years}
              onChange={setYears}
              min={1}
              max={40}
              step={1}
            />
          </div>
          <div className="bg-card border-border dark:border-border/10 flex flex-col gap-4 rounded-xl border p-6 shadow-md">
            <div>
              <div className="text-muted-foreground text-sm">
                {calculator.resultLabel}
              </div>
              <div
                className="text-brand text-4xl font-bold tracking-tight"
                aria-live="polite"
              >
                {fmt.format(final)}
              </div>
            </div>
            <p className="sr-only">{calculator.chartAlt}</p>
            <div className="h-32 flex-1">
              <GrowthChart points={series.length > 1 ? series : [P, P]} />
            </div>
            <p className="text-muted-foreground text-xs">{calculator.note}</p>
          </div>
        </div>
      </div>
    </Section>
  );
}
