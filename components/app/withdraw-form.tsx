"use client";

import { ShieldAlert } from "lucide-react";
import { useState } from "react";

import { withdrawAction } from "@/app/actions/user";
import { checkAddress } from "@/lib/coins";
import { formatUsd } from "@/lib/money";
import { cn } from "@/lib/utils";

import { AssetPicker } from "./asset-picker";
import { NetworkLogo } from "./coin-logo";
import { ActionForm, SubmitButton, TextField } from "./form";
import { RadioCards } from "./radio-cards";

type Asset = { symbol: string; name: string; networks: { name: string }[] };

export function WithdrawForm({
  assets,
  available,
  minCents,
  onDone,
}: {
  assets: Asset[];
  available: number;
  minCents: number;
  onDone?: (id: string) => void;
}) {
  const [symbol, setSymbol] = useState(assets[0]?.symbol ?? "");
  const asset = assets.find((a) => a.symbol === symbol) ?? assets[0];
  const [network, setNetwork] = useState(asset?.networks[0]?.name ?? "");
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const net =
    asset?.networks.find((n) => n.name === network)?.name ??
    asset?.networks[0]?.name ??
    "";
  const cents = Math.round(Number(amount) * 100);
  const validAmount = Number.isFinite(cents) && cents > 0;
  const addressProblem =
    address.trim().length >= 6 ? checkAddress(net, address) : null;
  let amountProblem: string | null = null;
  if (validAmount && cents < minCents)
    amountProblem = `The minimum is ${formatUsd(minCents)}.`;
  else if (validAmount && cents > available)
    amountProblem = "That is more than your available balance.";
  const ready =
    validAmount &&
    !amountProblem &&
    address.trim().length >= 10 &&
    !addressProblem &&
    confirmed &&
    Boolean(net);

  return (
    <ActionForm
      action={withdrawAction}
      className="space-y-6"
      resetOnSuccess={false}
      onSuccess={(s) => s.id && onDone?.(s.id)}
    >
      <div className="space-y-5">
        <AssetPicker
          name="asset"
          legend="1. Choose the asset"
          assets={assets}
          value={asset?.symbol ?? ""}
          onChange={(v) => {
            setSymbol(v);
            setNetwork(
              assets.find((a) => a.symbol === v)?.networks[0]?.name ?? "",
            );
          }}
        />
        {asset && asset.networks.length > 1 && (
          <RadioCards
            key={asset.symbol}
            name="network"
            legend="Network"
            columns={asset.networks.length > 2 ? 1 : 2}
            value={net}
            onChange={setNetwork}
            options={asset.networks.map((n) => ({
              value: n.name,
              label: n.name,
              logo: <NetworkLogo network={n.name} className="size-5" />,
            }))}
          />
        )}
        {asset && asset.networks.length === 1 && (
          <div className="bg-muted/40 flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm">
            <input
              type="hidden"
              name="network"
              value={asset.networks[0].name}
            />
            <NetworkLogo network={asset.networks[0].name} className="size-5" />
            <span>
              <span className="text-muted-foreground block text-xs">
                Network
              </span>
              <span className="font-medium">{asset.networks[0].name}</span>
            </span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <TextField
          name="address"
          label="2. Your wallet address"
          required
          autoComplete="off"
          spellCheck={false}
          placeholder={`Paste your ${asset?.symbol ?? ""} address`}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          aria-invalid={Boolean(addressProblem)}
        />
        {addressProblem ? (
          <p className="text-destructive-foreground text-xs" role="alert">
            {addressProblem}
          </p>
        ) : (
          <p className="text-muted-foreground text-xs">
            Only paste an address on {net || "the network above"} that you
            control.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <TextField
          name="amount"
          label="3. Amount (USD)"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          required
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-invalid={Boolean(amountProblem)}
        />
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">
            Available {formatUsd(available)}
          </span>
          <span className="ml-auto flex gap-1.5">
            {[25, 50, 100].map((p) => (
              <button
                key={p}
                type="button"
                disabled={available <= 0}
                onClick={() =>
                  setAmount(
                    (Math.floor((available * p) / 100) / 100).toFixed(2),
                  )
                }
                className="hover:bg-accent rounded-md border px-2 py-1 font-medium transition-colors disabled:opacity-50"
              >
                {p === 100 ? "Max" : `${p}%`}
              </button>
            ))}
          </span>
        </div>
        {amountProblem && (
          <p className="text-destructive-foreground text-xs" role="alert">
            {amountProblem}
          </p>
        )}
      </div>

      <div
        className={cn(
          "bg-muted/40 space-y-1.5 rounded-xl border p-4 text-sm",
          !validAmount && "opacity-60",
        )}
      >
        <div className="flex justify-between">
          <span className="text-muted-foreground">Withdrawing</span>
          <span className="font-medium tabular-nums">
            {validAmount ? formatUsd(cents) : "-"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Paid as</span>
          <span className="font-medium">
            {asset?.symbol} on {net}
          </span>
        </div>
        <div className="flex justify-between border-t pt-1.5">
          <span className="text-muted-foreground">Balance after hold</span>
          <span className="font-medium tabular-nums">
            {validAmount && cents <= available
              ? formatUsd(available - cents)
              : formatUsd(available)}
          </span>
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5 size-4"
        />
        <span>
          <span className="inline-flex items-center gap-1.5 font-medium">
            <ShieldAlert
              className="text-gold-foreground size-4"
              aria-hidden="true"
            />
            I checked the address and network
          </span>
          <span className="text-muted-foreground block text-xs">
            Crypto payouts cannot be reversed. Funds sent to a wrong address or
            network may be lost.
          </span>
        </span>
      </label>

      <SubmitButton
        pending="Requesting…"
        disabled={!ready}
        className="w-full sm:w-auto"
      >
        Request withdrawal
      </SubmitButton>
    </ActionForm>
  );
}
