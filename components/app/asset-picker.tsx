"use client";

import { Check, ChevronsUpDown, Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { CoinLogo } from "./coin-logo";

export type PickerAsset = { symbol: string; name: string };

const POPULAR = ["BTC", "ETH", "USDT", "USDC", "SOL", "BNB", "XRP", "TRX"];

/** A searchable asset dropdown with quick picks, for long lists of coins. */
export function AssetPicker({
  name,
  legend,
  assets,
  value,
  onChange,
}: {
  name: string;
  legend: string;
  assets: PickerAsset[];
  value: string;
  onChange: (symbol: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = assets.find((a) => a.symbol === value) ?? assets[0];
  const quick = POPULAR.map((s) => assets.find((a) => a.symbol === s)).filter(
    (a): a is PickerAsset => Boolean(a),
  );

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t
      ? assets.filter(
          (a) =>
            a.symbol.toLowerCase().includes(t) ||
            a.name.toLowerCase().includes(t),
        )
      : assets;
  }, [assets, q]);

  function pick(s: string) {
    onChange(s);
    setOpen(false);
    setQ("");
  }

  return (
    <div ref={root} className="relative flex flex-col gap-1.5">
      <p className="text-sm font-medium">{legend}</p>
      <input type="hidden" name={name} value={selected?.symbol ?? ""} />
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
        className="hover:bg-accent/50 focus-visible:ring-ring flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        {selected && <CoinLogo symbol={selected.symbol} />}
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{selected?.symbol}</span>
          <span className="text-muted-foreground block truncate text-xs">
            {selected?.name}
          </span>
        </span>
        <ChevronsUpDown
          className="text-muted-foreground size-4 shrink-0"
          aria-hidden="true"
        />
      </button>

      {quick.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {quick.map((a) => (
            <button
              key={a.symbol}
              type="button"
              onClick={() => pick(a.symbol)}
              className={cn(
                "hover:bg-accent flex items-center gap-1.5 rounded-full border py-1 pr-3 pl-1.5 text-xs font-medium transition-colors",
                a.symbol === selected?.symbol &&
                  "border-brand bg-brand/5 text-brand",
              )}
            >
              <CoinLogo symbol={a.symbol} className="size-4" />
              {a.symbol}
            </button>
          ))}
        </div>
      )}

      {open && (
        <div className="bg-popover absolute top-full z-30 mt-1.5 w-full overflow-hidden rounded-xl border shadow-lg">
          <div className="flex items-center gap-2 border-b px-3">
            <Search
              className="text-muted-foreground size-4"
              aria-hidden="true"
            />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or ticker"
              aria-label="Search assets"
              className="h-10 w-full bg-transparent text-sm outline-none"
            />
          </div>
          <ul
            id={listId}
            role="listbox"
            className="max-h-64 overflow-y-auto p-1"
          >
            {shown.length === 0 && (
              <li className="text-muted-foreground px-3 py-6 text-center text-sm">
                No asset matches “{q}”.
              </li>
            )}
            {shown.map((a) => (
              <li
                key={a.symbol}
                role="option"
                aria-selected={a.symbol === selected?.symbol}
              >
                <button
                  type="button"
                  onClick={() => pick(a.symbol)}
                  className="hover:bg-accent flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left"
                >
                  <CoinLogo symbol={a.symbol} className="size-7" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">
                      {a.symbol}
                    </span>
                    <span className="text-muted-foreground block truncate text-xs">
                      {a.name}
                    </span>
                  </span>
                  {a.symbol === selected?.symbol && (
                    <Check className="text-brand size-4" aria-hidden="true" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
