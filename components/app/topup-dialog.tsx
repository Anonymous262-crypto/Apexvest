"use client";

import { DollarSign } from "lucide-react";
import { useState } from "react";

import { topUpAction } from "@/app/actions/user";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { profitCents } from "@/lib/compound";
import { formatUsd } from "@/lib/money";

import { ActionForm, SubmitButton, TextField } from "./form";

/** Add money to an active plan. Shows the pro-rated projection before anything is sent. */
export function TopUpDialog({
  trigger,
  id,
  planName,
  daysLeft,
  durationDays,
  dailyPct,
  available,
  room,
}: {
  trigger: React.ReactNode;
  id: string;
  planName: string;
  daysLeft: number;
  durationDays: number;
  dailyPct: number;
  available: number;
  /** Cents the plan still allows on top of what is already committed. */
  room: number;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const n = Number(amount);
  const profit = n > 0 ? profitCents(n * 100, dailyPct, daysLeft) : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Top up {planName}</DialogTitle>
          <DialogDescription>
            Add to this plan. The new amount matures together with the rest, in{" "}
            {daysLeft} day{daysLeft === 1 ? "" : "s"}.
          </DialogDescription>
        </DialogHeader>
        <ActionForm
          action={topUpAction}
          onSuccess={() => {
            setOpen(false);
            setAmount("");
          }}
        >
          <input type="hidden" name="id" value={id} />
          <TextField
            name="amount"
            icon={DollarSign}
            label="Amount (USD)"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="10"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            hint={`Available ${formatUsd(available)}. You can add up to ${formatUsd(room)} more to this plan.`}
          />
          <div className="bg-muted/50 space-y-1 rounded-lg border p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time left</span>
              <span>
                {daysLeft} of {durationDays} days
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Projected profit on this amount
              </span>
              <span>{formatUsd(profit)}</span>
            </div>
            <p className="text-muted-foreground pt-1 text-xs">
              Profit is pro-rated for the days that remain, so a late top-up
              earns proportionally less. Projected returns are illustrative and
              not guaranteed. Your capital is at risk.
            </p>
          </div>
          <SubmitButton pending="Adding…">Add to plan</SubmitButton>
        </ActionForm>
      </DialogContent>
    </Dialog>
  );
}
