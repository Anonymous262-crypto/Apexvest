"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";

import { createDepositAction, quoteAction } from "@/app/actions/user";
import { Button } from "@/components/ui/button";
import { formatCrypto } from "@/lib/format-crypto";
import { cn } from "@/lib/utils";

import { CoinLogo, NetworkLogo } from "./coin-logo";
import { RadioCards } from "./radio-cards";

type Asset = {
  symbol: string;
  name: string;
  networks: { name: string; address: string; memo?: string }[];
};
type Quote =
  { rate: number; cryptoAmount: number } | "loading" | "error" | null;

const QUICK = [50, 100, 500, 1000, 5000];
const MIN = 10;
const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
const STEPS = ["Amount", "Method", "Review"];

/** Three-step checkout: how much, how to pay, review. Creates a payment, then opens its payment page. */
export function DepositCheckout({
  assets,
  windowMin,
}: {
  assets: Asset[];
  windowMin: number;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState("");
  const [symbol, setSymbol] = useState(assets[0]?.symbol ?? "");
  const asset = assets.find((a) => a.symbol === symbol) ?? assets[0];
  const [network, setNetwork] = useState(asset?.networks[0]?.name ?? "");
  const net =
    asset?.networks.find((n) => n.name === network) ?? asset?.networks[0];
  const [quote, setQuote] = useState<Quote>(null);
  const [, startTx] = useTransition();
  const [state, action, creating] = useActionState(createDepositAction, {
    ok: false,
  });
  const keyRef = useRef("");

  const n = Number(amount);
  const valid = Number.isFinite(n) && n >= MIN && n <= 1_000_000;

  // Live rate for the chosen asset and amount.
  useEffect(() => {
    if (!valid || !asset) return;
    let live = true;
    const t = setTimeout(() => {
      quoteAction(asset.symbol, n)
        .then(
          (r) =>
            live &&
            setQuote(
              r.ok && r.rate && r.cryptoAmount
                ? { rate: r.rate, cryptoAmount: r.cryptoAmount }
                : "error",
            ),
        )
        .catch(() => live && setQuote("error"));
    }, 300);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [asset, n, valid]);

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.ok && state.id) {
      keyRef.current = "";
      router.push(`/dashboard/deposit/${state.id}`);
    }
  }, [state, router]);

  function create() {
    if (!keyRef.current) keyRef.current = crypto.randomUUID();
    const fd = new FormData();
    fd.set("asset", asset.symbol);
    fd.set("network", net?.name ?? network);
    fd.set("amount", String(n));
    fd.set("idemKey", keyRef.current);
    startTx(() => action(fd));
  }

  const q = typeof quote === "object" && quote ? quote : null;
  const quoteLine = !valid
    ? null
    : quote === "loading" || quote === null
      ? "Getting the live rate…"
      : quote === "error"
        ? "Live rate unavailable for this asset right now."
        : null;

  return (
    <div className="w-full space-y-5">
      {/* Stepper */}
      <ol className="flex items-center gap-2" aria-label="Deposit steps">
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

      <div className="space-y-5">
        {step === 1 && (
          <>
            <div>
              <h2 className="text-lg font-semibold">
                How much would you like to deposit?
              </h2>
              <p className="text-muted-foreground text-sm">
                Enter the amount in US dollars. You will choose how to pay next.
              </p>
            </div>
            <div className="space-y-3">
              <label htmlFor="amount" className="sr-only">
                Amount in USD
              </label>
              <div className="focus-within:border-ring focus-within:ring-ring/40 flex items-center gap-2 rounded-xl border px-4 py-3 focus-within:ring-[3px]">
                <span className="text-muted-foreground text-2xl font-semibold">
                  $
                </span>
                <input
                  id="amount"
                  inputMode="decimal"
                  type="number"
                  min={MIN}
                  step="0.01"
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
              <div className="flex flex-wrap gap-2">
                {QUICK.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAmount(String(v))}
                    className={cn(
                      "hover:bg-accent/60 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                      n === v && "border-brand bg-brand/10 text-brand",
                    )}
                  >
                    {usd.format(v).replace(".00", "")}
                  </button>
                ))}
              </div>
              <p
                className={cn(
                  "text-xs",
                  amount && !valid
                    ? "text-destructive-foreground"
                    : "text-muted-foreground",
                )}
              >
                Minimum deposit {usd.format(MIN).replace(".00", "")}.
              </p>
            </div>
            <Button
              size="lg"
              className="w-full"
              disabled={!valid}
              onClick={() => setStep(2)}
            >
              Continue <ArrowRight />
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <h2 className="text-lg font-semibold">
                How would you like to pay?
              </h2>
              <p className="text-muted-foreground text-sm">
                Pick the asset you hold. You will send it from your own wallet.
              </p>
            </div>
            <RadioCards
              name="asset"
              legend="Pay with"
              value={asset?.symbol ?? ""}
              onChange={(v) => {
                setSymbol(v);
                setNetwork(
                  assets.find((a) => a.symbol === v)?.networks[0]?.name ?? "",
                );
                setQuote("loading");
              }}
              options={assets.map((a) => ({
                value: a.symbol,
                label: a.symbol,
                sub: a.name,
                logo: <CoinLogo symbol={a.symbol} />,
              }))}
            />
            {asset && asset.networks.length > 1 && (
              <RadioCards
                key={asset.symbol}
                name="network"
                legend="Network"
                columns={asset.networks.length > 2 ? 1 : 2}
                value={net?.name ?? ""}
                onChange={setNetwork}
                options={asset.networks.map((x) => ({
                  value: x.name,
                  label: x.name,
                  logo: <NetworkLogo network={x.name} className="size-5" />,
                }))}
              />
            )}
            {asset && asset.networks.length === 1 && (
              <div className="bg-muted/40 flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm">
                <NetworkLogo
                  network={asset.networks[0].name}
                  className="size-5"
                />
                <span>
                  <span className="text-muted-foreground block text-xs">
                    Network
                  </span>
                  <span className="font-medium">{asset.networks[0].name}</span>
                </span>
              </div>
            )}
            <div
              className="bg-muted/40 rounded-xl border p-4 text-sm"
              aria-live="polite"
            >
              {q ? (
                <>
                  <p className="text-muted-foreground text-xs">
                    You will send about
                  </p>
                  <p className="text-xl font-semibold tabular-nums">
                    {formatCrypto(asset.symbol, q.cryptoAmount)}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    1 {asset.symbol} = {usd.format(q.rate)} · for{" "}
                    {usd.format(n)}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground flex items-center gap-2">
                  {quote === "error" ? null : (
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  )}
                  {quoteLine ?? "Getting the live rate…"}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="lg" onClick={() => setStep(1)}>
                <ArrowLeft /> Back
              </Button>
              <Button
                size="lg"
                className="flex-1"
                disabled={!q}
                onClick={() => setStep(3)}
              >
                Review <ArrowRight />
              </Button>
            </div>
          </>
        )}

        {step === 3 && asset && (
          <>
            <div>
              <h2 className="text-lg font-semibold">Review your payment</h2>
              <p className="text-muted-foreground text-sm">
                Check the details. Next you will get the address to send to.
              </p>
            </div>
            <dl className="divide-y rounded-xl border text-sm">
              {[
                ["Deposit amount", usd.format(n)],
                ["Pay with", `${asset.name} (${asset.symbol})`],
                ["Network", net?.name ?? ""],
                [
                  "You send",
                  q ? formatCrypto(asset.symbol, q.cryptoAmount) : "-",
                ],
                ["Rate", q ? `1 ${asset.symbol} = ${usd.format(q.rate)}` : "-"],
                ["Our fee", "None"],
              ].map(([l, v]) => (
                <div
                  key={l}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <dt className="text-muted-foreground">{l}</dt>
                  <dd className="text-right font-medium tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
            <ul className="text-muted-foreground space-y-2 text-xs">
              <li className="flex gap-2">
                <Clock
                  className="mt-0.5 size-3.5 shrink-0"
                  aria-hidden="true"
                />{" "}
                The rate is held for {windowMin} minutes once you continue.
              </li>
              <li className="flex gap-2">
                <ShieldCheck
                  className="mt-0.5 size-3.5 shrink-0"
                  aria-hidden="true"
                />{" "}
                Our team verifies each payment, usually within the hour, then
                credits your balance. Network fees are paid by you.
              </li>
            </ul>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                disabled={creating}
                onClick={() => setStep(2)}
              >
                <ArrowLeft /> Back
              </Button>
              <Button
                size="lg"
                className="flex-1"
                disabled={creating || !q}
                onClick={create}
              >
                {creating ? (
                  <>
                    <Loader2 className="animate-spin" /> Creating payment…
                  </>
                ) : (
                  <>
                    Continue to payment <ArrowRight />
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
