import { ArrowDownToLine, ArrowUpFromLine, TrendingUp } from "lucide-react";

import type { ActivityItem } from "@/lib/services/activity";

const VERB: Record<
  ActivityItem["kind"],
  { text: string; icon: typeof TrendingUp }
> = {
  withdrawal: { text: "withdrew", icon: ArrowUpFromLine },
  profit: { text: "earned", icon: TrendingUp },
  deposit: { text: "deposited", icon: ArrowDownToLine },
};

function Group({ items, hidden }: { items: ActivityItem[]; hidden?: boolean }) {
  return (
    <ul
      aria-hidden={hidden || undefined}
      className={`flex shrink-0 items-center gap-8 pr-8 ${hidden ? "motion-reduce:hidden" : ""}`}
    >
      {items.map((i) => {
        const v = VERB[i.kind];
        return (
          <li
            key={i.id}
            className="flex items-center gap-2 text-xs whitespace-nowrap"
          >
            <v.icon
              className={
                i.kind === "profit"
                  ? "text-success size-3.5"
                  : "text-brand size-3.5"
              }
              aria-hidden="true"
            />
            <span className="text-muted-foreground">
              <span className="text-foreground font-medium">{i.who}</span>{" "}
              {v.text}{" "}
              <span className="text-foreground font-semibold tabular-nums">
                {i.amount}
              </span>
              {i.kind === "profit" ? " in profit" : ""}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** A slim, scrolling strip of real recent platform activity (masked names). Pauses on hover. */
export function ActivityTicker({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) return null;
  return (
    <div
      role="region"
      aria-label="Recent platform activity"
      className="bg-muted/40 relative flex h-9 items-center overflow-hidden border-b [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] motion-reduce:[mask-image:none] print:hidden"
    >
      <div className="flex w-max animate-[marquee_70s_linear_infinite] hover:[animation-play-state:paused] motion-reduce:w-full motion-reduce:animate-none motion-reduce:flex-wrap motion-reduce:justify-center">
        <Group items={items} />
        <Group items={items} hidden />
      </div>
    </div>
  );
}
