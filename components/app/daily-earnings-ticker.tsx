"use client";

import { CircleCheck, X } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";

import type { DailyCredit } from "@/lib/services/daily-credit";

const KEY = "apx_daily_ticker";
const listeners = new Set<() => void>();
const read = () => {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
};
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
};

function Group({
  items,
  total,
  hidden,
}: {
  items: DailyCredit[];
  total: string;
  hidden?: boolean;
}) {
  // Repeat short lists so one group always fills the strip and the loop is seamless.
  const reps = Math.max(1, Math.ceil(6 / (items.length + 1)));
  return (
    <ul
      aria-hidden={hidden || undefined}
      className={`flex shrink-0 items-center gap-10 pr-10 ${hidden ? "motion-reduce:hidden" : ""}`}
    >
      {Array.from({ length: reps }).flatMap((_, r) => [
        <li
          key={`t${r}`}
          className="text-foreground flex items-center gap-2 text-xs font-semibold whitespace-nowrap"
        >
          <CircleCheck className="text-success size-4" aria-hidden="true" />
          Today&apos;s profit is added: {total}
        </li>,
        ...items.map((i) => (
          <li
            key={`${r}-${i.id}`}
            className="text-muted-foreground flex items-center gap-2 text-xs whitespace-nowrap"
          >
            <CircleCheck className="text-success size-3.5" aria-hidden="true" />
            <Link
              href={`/dashboard/investments/${i.id}`}
              className="text-foreground font-medium hover:underline"
            >
              {i.plan}
            </Link>
            <span className="text-success font-semibold tabular-nums">
              +{i.added}
            </span>
            <span>
              day {i.day} of {i.of}
            </span>
          </li>
        )),
      ])}
    </ul>
  );
}

/** A slim strip that confirms today's profit was added to each investment. Dismissible until tomorrow. */
export function DailyEarningsTicker({
  items,
  total,
  dayKey,
}: {
  items: DailyCredit[];
  total: string;
  dayKey: string;
}) {
  const dismissed =
    useSyncExternalStore(subscribe, read, () => dayKey) === dayKey;
  if (items.length === 0 || dismissed) return null;
  return (
    <div
      role="status"
      aria-label="Today's profit added"
      className="border-success/30 bg-success/5 relative flex h-9 items-center border-b print:hidden"
    >
      <div className="relative flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)] motion-reduce:[mask-image:none]">
        <div className="flex w-max animate-[marquee_45s_linear_infinite] hover:[animation-play-state:paused] motion-reduce:w-full motion-reduce:animate-none motion-reduce:flex-wrap motion-reduce:justify-center">
          <Group items={items} total={total} />
          <Group items={items} total={total} hidden />
        </div>
      </div>
      <button
        type="button"
        aria-label="Hide until tomorrow"
        title="Hide until tomorrow"
        onClick={() => {
          try {
            localStorage.setItem(KEY, dayKey);
          } catch {}
          listeners.forEach((l) => l());
        }}
        className="text-muted-foreground hover:text-foreground mr-1.5 flex size-7 shrink-0 items-center justify-center rounded-md"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
