"use client";

import { Download, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { IconInput } from "./icon-input";

export interface FilterDef {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

/** Search, filters, date range and CSV export for an admin table. State lives in the URL. */
export function TableToolbar({
  placeholder = "Search",
  filters = [],
  dates = false,
  exportResource,
  fixed = {},
  className,
}: {
  placeholder?: string;
  filters?: FilterDef[];
  dates?: boolean;
  exportResource?: string;
  /** Extra fixed query (e.g. userId) carried into the export link. */
  fixed?: Record<string, string>;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, start] = useTransition();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function push(next: Record<string, string | null>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(next))
      v ? params.set(k, v) : params.delete(k);
    params.delete("page");
    start(() =>
      router.replace(`${pathname}?${params.toString()}`, { scroll: false }),
    );
  }

  const active = ["q", "from", "to", ...filters.map((f) => f.key)].some((k) =>
    sp.get(k),
  );
  const exportQs = new URLSearchParams({
    ...Object.fromEntries(sp.entries()),
    ...fixed,
  });
  exportQs.delete("page");
  exportQs.delete("tab");

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="min-w-48 flex-1">
        <IconInput
          icon={Search}
          name="table-search"
          placeholder={placeholder}
          aria-label={placeholder}
          value={q}
          autoComplete="off"
          onChange={(e) => {
            setQ(e.target.value);
            clearTimeout(timer.current);
            const v = e.target.value.trim();
            timer.current = setTimeout(() => push({ q: v || null }), 350);
          }}
        />
      </div>
      {filters.map((f) => (
        <select
          key={f.key}
          aria-label={f.label}
          value={sp.get(f.key) ?? ""}
          onChange={(e) => push({ [f.key]: e.target.value || null })}
          className="border-input bg-background dark:bg-input/30 h-10 rounded-md border px-3 text-sm shadow-xs"
        >
          <option value="">{f.label}: all</option>
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ))}
      {dates && (
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            aria-label="From date"
            value={sp.get("from") ?? ""}
            onChange={(e) => push({ from: e.target.value || null })}
            className="border-input bg-background dark:bg-input/30 h-10 rounded-md border px-2 text-sm shadow-xs"
          />
          <span className="text-muted-foreground text-xs">to</span>
          <input
            type="date"
            aria-label="To date"
            value={sp.get("to") ?? ""}
            onChange={(e) => push({ to: e.target.value || null })}
            className="border-input bg-background dark:bg-input/30 h-10 rounded-md border px-2 text-sm shadow-xs"
          />
        </div>
      )}
      {active && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setQ("");
            const tab = sp.get("tab");
            start(() =>
              router.replace(tab ? `${pathname}?tab=${tab}` : pathname, {
                scroll: false,
              }),
            );
          }}
        >
          <X /> Clear
        </Button>
      )}
      {exportResource && (
        <Button asChild variant="outline" size="sm">
          <Link
            href={`/admin/export/${exportResource}?${exportQs.toString()}`}
            prefetch={false}
          >
            <Download /> Export CSV
          </Link>
        </Button>
      )}
    </div>
  );
}
