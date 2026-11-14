"use client";

import {
  Clock,
  DollarSign,
  Percent,
  Tag,
  TriangleAlert,
  Type,
} from "lucide-react";
import { useState } from "react";

import { createPlanAction, updatePlanAction } from "@/app/actions/admin";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  apyFromDaily,
  effectiveDaily,
  profitCents,
  totalPctFromDaily,
} from "@/lib/compound";
import { formatUsd } from "@/lib/money";

import { ActionForm, SubmitButton, TextField } from "./form";

export interface PlanData {
  id: string;
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
}

const HIGH_RETURN = 30;

/** Create or edit a plan, with a live summary of what users will see. */
export function PlanDialog({
  trigger,
  plan,
}: {
  trigger: React.ReactNode;
  plan?: PlanData;
}) {
  const [open, setOpen] = useState(false);
  const [min, setMin] = useState(plan ? String(plan.minCents / 100) : "");
  const [max, setMax] = useState(plan ? String(plan.maxCents / 100) : "");
  const [days, setDays] = useState(plan ? String(plan.durationDays) : "");
  const [pct, setPct] = useState(
    plan ? String(plan.dailyPct ?? effectiveDaily(plan).toFixed(4)) : "",
  );
  const [name, setName] = useState(plan?.name ?? "");
  const [active, setActive] = useState(plan?.active ?? true);
  const [featured, setFeatured] = useState(plan?.featured ?? false);

  const n = (v: string) =>
    Number.isFinite(Number(v)) && v !== "" ? Number(v) : 0;
  const total = totalPctFromDaily(n(pct), n(days));
  const sample = profitCents(n(min) * 100, n(pct), n(days));
  const apy = apyFromDaily(n(pct));
  const high = total >= HIGH_RETURN || apy >= 100;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{plan ? `Edit ${plan.name}` : "New plan"}</DialogTitle>
          <DialogDescription>
            {plan
              ? "Changes apply to new investments only. Existing investments keep their original terms."
              : "Set the terms users will see before they invest."}
          </DialogDescription>
        </DialogHeader>
        <ActionForm
          action={plan ? updatePlanAction : createPlanAction}
          onSuccess={() => setOpen(false)}
          resetOnSuccess={!plan}
        >
          {plan && <input type="hidden" name="id" value={plan.id} />}
          <TextField
            name="name"
            icon={Type}
            label="Plan name"
            placeholder="Growth"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            autoComplete="off"
          />
          <TextField
            name="tagline"
            icon={Tag}
            label="Tagline"
            placeholder="Balanced plan with a 30-day term"
            defaultValue={plan?.tagline}
            maxLength={120}
            autoComplete="off"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField
              name="min"
              icon={DollarSign}
              label="Minimum (USD)"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="1"
              required
              value={min}
              onChange={(e) => setMin(e.target.value)}
            />
            <TextField
              name="max"
              icon={DollarSign}
              label="Maximum (USD)"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="1"
              required
              value={max}
              onChange={(e) => setMax(e.target.value)}
            />
            <TextField
              name="durationDays"
              icon={Clock}
              label="Duration (days)"
              type="number"
              inputMode="numeric"
              min="1"
              required
              value={days}
              onChange={(e) => setDays(e.target.value)}
            />
            <TextField
              name="dailyPct"
              icon={Percent}
              label="Daily return (%)"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              max="5"
              required
              value={pct}
              onChange={(e) => setPct(e.target.value)}
              hint="Credited every day and compounded. Locked until the end date."
            />
          </div>

          {n(min) > 0 && n(pct) > 0 && n(days) > 0 && (
            <div className="bg-muted/50 space-y-1 rounded-lg border p-3 text-sm">
              <p className="font-medium">{name || "This plan"} at a glance</p>
              <p className="text-muted-foreground text-xs">
                {n(pct)}% a day, compounded, over {n(days)} days is a projected{" "}
                {total.toFixed(2)}% in total. {formatUsd(n(min) * 100)} invested
                shows a projected profit of {formatUsd(sample)}. Kept
                compounding for a year, this daily rate would equal about{" "}
                {apy >= 1000
                  ? Math.round(apy).toLocaleString()
                  : apy.toFixed(0)}
                % a year.
              </p>
            </div>
          )}
          {high && (
            <p className="border-gold/50 bg-gold/10 flex gap-2 rounded-lg border p-3 text-xs">
              <TriangleAlert
                className="text-gold-foreground mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              A projected return of {n(pct)}% can read like a high-yield
              promise. Keep it labelled “projected” and “illustrative” wherever
              it is shown, and check it against the rules for your country.
            </p>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField
              name="badge"
              icon={Tag}
              label="Badge (optional)"
              placeholder="Balanced"
              defaultValue={plan?.badge}
              maxLength={24}
              autoComplete="off"
              hint="Shown on the landing page card."
            />
            <label className="flex items-center gap-2 self-center pt-2 text-sm">
              <input
                type="checkbox"
                name="featured"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="size-4"
              />
              Highlight on landing page
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="size-4"
            />
            Open to new investments
          </label>
          <SubmitButton pending="Saving…">
            {plan ? "Save changes" : "Create plan"}
          </SubmitButton>
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}
