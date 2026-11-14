"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

/** A labelled value with a one-tap copy button, like the fields on a payment page. */
export function CopyField({
  label,
  value,
  mono = false,
  emphasis = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  emphasis?: boolean;
}) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch {}
  }
  return (
    <div className="space-y-1.5">
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <div className="bg-muted/40 flex items-center gap-2 rounded-xl border px-3 py-2.5">
        <p
          className={cn(
            "min-w-0 flex-1 break-all",
            mono && "font-mono text-sm",
            emphasis
              ? "text-lg font-semibold tabular-nums"
              : "text-sm font-medium",
          )}
        >
          {value}
        </p>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${label}`}
          className="hover:bg-accent text-muted-foreground hover:text-foreground flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors"
        >
          {done ? <Check className="size-4" /> : <Copy className="size-4" />}
          {done ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
