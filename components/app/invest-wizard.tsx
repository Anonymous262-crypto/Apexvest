"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Plus,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";

import { investAction } from "@/app/actions/user";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { effectiveDaily, profitCents } from "@/lib/compound";
import { formatUsd } from "@/lib/money";
import { cn } from "@/lib/utils";

export type WizardPlan = {
  slug: string;
  name: string;
  tagline?: string;
  minCents: number;
  maxCents: number;
  durationDays: number;
  projectedPct: number;
  dailyPct?: number;
  badge?: string;
  featured?: boolean;
};

const STEPS = ["Plan", "Amount", "Review"];
const rate = (p: WizardPlan) => effectiveDaily(p).toFixed(2);
const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-2" aria-label="Investment steps">
      {STEPS.map((label, i) => {
        const num = i + 1;
        const done = step > num;
        const current = step === num;
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              aria-current={current ? "step" : undefined}
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                done && "bg-brand border-brand text-primary-foreground",
                current && "border-brand text-brand ring-brand/20 ring-4",
                !done && !current && "text-muted-foreground",
              )}
            >
              {done ? <Check className="size-3.5" aria-hidden="true" /> : num}
            </span>
            <span
              className={cn(
                "text-sm font-medium",
                current ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <span
                aria-hidden="true"
                className={cn("h-px flex-1", done ? "bg-brand" : "bg-border")}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function Line({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-right tabular-nums",
          strong ? "font-semibold" : "font-medium",
        )}
      >
        {value}
      </span>
    </div>
  );
}

/** Three steps: choose a plan, set the amount, review and confirm. Then opens the new investment. */
function Wizard({
  plans,
  initial,
  available,
}: {
  plans: WizardPlan[];
  initial?: string;
  available: number;
}) {
  const router = useRouter();
  const start = plans.find((p) => p.slug === initial);
  const [step, setStep] = useState(start ? 2 : 1);
  const [slug, setSlug] = useState(start?.slug ?? plans[0]?.slug ?? "");
  const [amount, setAmount] = useState("");
  const [auto, setAuto] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [now] = useState(() => Date.now());
  const [, startTx] = useTransition();
  const [state, action, working] = useActionState(investAction, { ok: false });
  const keyRef = useRef("");

  const plan = plans.find((p) => p.slug === slug) ?? plans[0];
  const cents = Math.round(Number(amount) * 100);
  const hasAmount = Number.isFinite(cents) && cents > 0;
  const daily = plan ? effectiveDaily(plan) : 0;
  const profit =
    plan && hasAmount ? profitCents(cents, daily, plan.durationDays) : 0;
  const ends = plan ? new Date(now + plan.durationDays * 86_400_000) : null;

  let problem: string | null = null;
  if (plan && hasAmount) {
    if (cents < plan.minCents)
      problem = `The minimum for ${plan.name} is ${formatUsd(plan.minCents)}.`;
    else if (cents > plan.maxCents)
      problem = `The maximum for ${plan.name} is ${formatUsd(plan.maxCents)}.`;
    else if (cents > available)
      problem = "That is more than your available balance.";
  }
  const valid = hasAmount && !problem;
  const shortBy = plan ? Math.max(0, plan.minCents - available) : 0;

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.ok && state.id) {
      keyRef.current = "";
      toast.success("Investment started.");
      router.push(`/dashboard/investments/${state.id}`);
    }
  }, [state, router]);

  function confirm() {
    if (!plan || !valid) return;
    if (!keyRef.current) keyRef.current = crypto.randomUUID();
    const fd = new FormData();
    fd.set("plan", plan.slug);
    fd.set("amount", (cents / 100).toFixed(2));
    if (auto) fd.set("autoCompound", "on");
    fd.set("idemKey", keyRef.current);
    startTx(() => action(fd));
  }

  // Quick amounts are shares of what this plan allows and the user can afford.
  const top = plan ? Math.min(plan.maxCents, available) : 0;
  const quick =
    plan && top >= plan.minCents
      ? Array.from(
          new Set(
            [0, 0.25, 0.5, 1].map(
              (f) =>
                Math.floor((plan.minCents + (top - plan.minCents) * f) / 100) *
                100,
            ),
          ),
        )
      : [];

  return (
    <div className="w-full space-y-5">
      <Stepper step={step} />

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Choose a plan</h2>
            <p className="text-muted-foreground text-sm">
              Pick the term and daily return that suits you.
            </p>
          </div>
          <div
            role="radiogroup"
            aria-label="Plan"
            className="grid grid-cols-1 gap-2.5 sm:grid-cols-2"
          >
            {plans.map((p) => {
              const on = p.slug === slug;
              return (
                <div
                  key={p.slug}
                  role="radio"
                  aria-checked={on}
                  tabIndex={0}
                  onClick={() => setSlug(p.slug)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSlug(p.slug);
                    }
                  }}
                  className={cn(
                    "hover:bg-accent/40 focus-visible:ring-ring relative flex cursor-pointer flex-col gap-2 rounded-xl border px-4 py-3.5 transition-colors outline-none focus-visible:ring-2",
                    on && "border-brand bg-brand/5 ring-brand/20 ring-2",
                  )}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold">{p.name}</span>
                    {on ? (
                      <span className="bg-brand text-primary-foreground flex size-5 items-center justify-center rounded-full">
                        <Check className="size-3" aria-hidden="true" />
                      </span>
                    ) : (
                      p.badge && (
                        <span className="border-gold/60 bg-gold/10 text-gold-foreground rounded-md border px-1.5 py-0.5 text-[10px] font-medium">
                          {p.badge}
                        </span>
                      )
                    )}
                  </span>
                  <span className="text-brand text-xl font-semibold tabular-nums">
                    {rate(p)}%
                    <span className="text-muted-foreground ml-1 text-xs font-normal">
                      a day, compounded
                    </span>
                  </span>
                  <span className="text-muted-foreground space-y-0.5 text-xs">
                    <span className="block tabular-nums">
                      {formatUsd(p.minCents)} to {formatUsd(p.maxCents)}
                    </span>
                    <span className="block">
                      {p.durationDays} days · about {p.projectedPct}% projected
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
          <Button
            size="lg"
            className="w-full"
            onClick={() => setStep(2)}
            disabled={!plan}
          >
            Continue with {plan?.name} <ArrowRight />
          </Button>
        </div>
      )}

      {step === 2 && plan && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">How much for {plan.name}?</h2>
            <p className="text-muted-foreground text-sm">
              {formatUsd(plan.minCents)} to {formatUsd(plan.maxCents)} ·
              available {formatUsd(available)}
            </p>
          </div>
          <div className="space-y-3">
            <label htmlFor="inv-amount" className="sr-only">
              Amount in USD
            </label>
            <div className="focus-within:border-ring focus-within:ring-ring/40 flex items-center gap-2 rounded-xl border px-4 py-3 focus-within:ring-[3px]">
              <span className="text-muted-foreground text-2xl font-semibold">
                $
              </span>
              <input
                id="inv-amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full min-w-0 bg-transparent text-3xl font-semibold tabular-nums outline-none placeholder:opacity-40"
                autoFocus
              />
              <span className="text-muted-foreground text-sm font-medium">
                USD
              </span>
            </div>
            {quick.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {quick.map((v, i) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAmount((v / 100).toFixed(2))}
                    className={cn(
                      "hover:bg-accent/60 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                      cents === v && "border-brand bg-brand/10 text-brand",
                    )}
                  >
                    {i === 0 ? "Min " : i === quick.length - 1 ? "Max " : ""}
                    {formatUsd(v).replace(".00", "")}
                  </button>
                ))}
              </div>
            )}
            {problem && (
              <p className="text-destructive-foreground text-xs" role="alert">
                {problem}
              </p>
            )}
            {shortBy > 0 && (
              <p className="border-gold/50 bg-gold/10 rounded-lg border p-3 text-xs">
                You need {formatUsd(shortBy)} more to start {plan.name}.{" "}
                <Link
                  href="/dashboard/deposit?new=1"
                  className="text-brand font-medium underline underline-offset-2"
                >
                  Add funds
                </Link>
              </p>
            )}
          </div>
          {valid && (
            <div className="bg-muted/40 divide-y rounded-xl border px-4">
              <Line label="Projected profit" value={formatUsd(profit)} strong />
              <Line
                label="You would receive"
                value={formatUsd(cents + profit)}
                strong
              />
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="lg" onClick={() => setStep(1)}>
              <ArrowLeft /> Back
            </Button>
            <Button
              size="lg"
              className="flex-1"
              disabled={!valid}
              onClick={() => setStep(3)}
            >
              Review <ArrowRight />
            </Button>
          </div>
        </div>
      )}

      {step === 3 && plan && ends && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Review and confirm</h2>
            <p className="text-muted-foreground text-sm">
              Check the terms. Nothing is taken until you confirm.
            </p>
          </div>
          <div className="bg-muted/40 divide-y rounded-xl border px-4">
            <Line label="Plan" value={plan.name} />
            <Line label="Invest now" value={formatUsd(cents)} strong />
            <Line label="Term" value={`${plan.durationDays} days`} />
            <Line
              label="Daily return (illustrative)"
              value={`${rate(plan)}%, compounded`}
            />
            <Line label="Projected profit" value={formatUsd(profit)} />
            <Line
              label="Projected payout"
              value={formatUsd(cents + profit)}
              strong
            />
            <Line label="Locked until" value={fmtDate(ends)} />
            <Line label="Balance after" value={formatUsd(available - cents)} />
          </div>
          <label className="flex cursor-pointer items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={auto}
              onChange={(e) => setAuto(e.target.checked)}
              className="mt-0.5 size-4"
            />
            <span>
              <span className="font-medium">Reinvest automatically</span>
              <span className="text-muted-foreground block text-xs">
                When the plan ends, principal and profit roll into a new plan.
                Turn it off any time.
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 size-4"
            />
            <span className="text-muted-foreground text-xs">
              <ShieldAlert
                className="text-gold-foreground mr-1 inline size-4 align-text-bottom"
                aria-hidden="true"
              />
              I understand principal and profit are locked until the end date,
              projected returns are illustrative and not guaranteed, and my
              capital is at risk.
            </span>
          </label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setStep(2)}
              disabled={working}
            >
              <ArrowLeft /> Back
            </Button>
            <Button
              size="lg"
              className="flex-1"
              disabled={!agreed || working}
              onClick={confirm}
            >
              {working ? (
                <>
                  <Loader2 className="animate-spin" /> Investing…
                </>
              ) : (
                `Confirm ${formatUsd(cents)}`
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** The investment flow as a modal, opened from the page header or any plan card. */
export function InvestWizard({
  plans,
  available,
  defaultPlan,
  defaultOpen = false,
}: {
  plans: WizardPlan[];
  available: number;
  defaultPlan?: string;
  defaultOpen?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [pick, setPick] = useState<string | undefined>(defaultPlan);
  const [run, setRun] = useState(0);

  // Plan cards on the page open the flow at the amount step through this event.
  useEffect(() => {
    const on = (e: Event) => {
      setPick((e as CustomEvent<string | undefined>).detail);
      setRun((n) => n + 1);
      setOpen(true);
    };
    window.addEventListener("apx:invest", on);
    return () => window.removeEventListener("apx:invest", on);
  }, []);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o && defaultOpen)
          router.replace("/dashboard/investments", { scroll: false });
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="lg"
          onClick={() => {
            setPick(undefined);
            setRun((n) => n + 1);
          }}
        >
          <Plus /> New investment
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[94svh] overflow-y-auto sm:max-w-xl"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>New investment</DialogTitle>
          <DialogDescription>
            Choose a plan, set an amount and confirm.
          </DialogDescription>
        </DialogHeader>
        <Wizard key={run} plans={plans} initial={pick} available={available} />
      </DialogContent>
    </Dialog>
  );
}

/** Opens the investment flow, optionally on a given plan. Works from anywhere on the page. */
export function openInvest(slug?: string) {
  window.dispatchEvent(new CustomEvent("apx:invest", { detail: slug }));
}
