"use client";

import { Timer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/** Live mm:ss until the payment window closes. Refreshes the page once when it reaches zero. */
export function PaymentCountdown({ expiresAt }: { expiresAt: string }) {
  const router = useRouter();
  const end = new Date(expiresAt).getTime();
  const [now, setNow] = useState(() => Date.now());
  const fired = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const left = Math.max(0, end - now);
  useEffect(() => {
    if (left === 0 && !fired.current) {
      fired.current = true;
      router.refresh();
    }
  }, [left, router]);

  const m = Math.floor(left / 60_000);
  const s = Math.floor((left % 60_000) / 1000);
  const low = left < 5 * 60_000;
  return (
    <span
      role="timer"
      aria-label={`Time left to pay: ${m} minutes ${s} seconds`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold tabular-nums",
        low
          ? "border-destructive-foreground/40 text-destructive-foreground"
          : "text-muted-foreground",
      )}
    >
      <Timer className="size-4" aria-hidden="true" />
      {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}
