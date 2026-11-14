import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

/** Prev/next links that keep every other query parameter. */
export function Pagination({
  basePath,
  query,
  page,
  pages,
  total,
  pageSize,
}: {
  basePath: string;
  query: Record<string, string | undefined>;
  page: number;
  pages: number;
  total: number;
  pageSize: number;
}) {
  const href = (p: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query))
      if (v && k !== "page") qs.set(k, v);
    if (p > 1) qs.set("page", String(p));
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const btn =
    "inline-flex h-9 items-center gap-1 rounded-md border px-3 text-sm transition-colors";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-sm">
      <p className="text-muted-foreground">
        {total === 0
          ? "No results"
          : `Showing ${from}–${to} of ${total.toLocaleString()}`}
      </p>
      {pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center gap-2">
          {page > 1 ? (
            <Link
              href={href(page - 1)}
              className={cn(btn, "hover:bg-accent")}
              scroll={false}
            >
              <ChevronLeft className="size-4" /> Previous
            </Link>
          ) : (
            <span className={cn(btn, "text-muted-foreground opacity-50")}>
              <ChevronLeft className="size-4" /> Previous
            </span>
          )}
          <span className="text-muted-foreground tabular-nums">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link
              href={href(page + 1)}
              className={cn(btn, "hover:bg-accent")}
              scroll={false}
            >
              Next <ChevronRight className="size-4" />
            </Link>
          ) : (
            <span className={cn(btn, "text-muted-foreground opacity-50")}>
              Next <ChevronRight className="size-4" />
            </span>
          )}
        </nav>
      )}
    </div>
  );
}
