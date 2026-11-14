"use client";

import { cn } from "@/lib/utils";

export interface RadioOption {
  value: string;
  label: string;
  sub?: string;
  logo?: React.ReactNode;
}

/** Accessible card-style radio group (native radios, visually hidden). */
export function RadioCards({
  name,
  legend,
  options,
  value,
  onChange,
  columns = 2,
}: {
  name: string;
  legend: string;
  options: RadioOption[];
  value: string;
  onChange: (v: string) => void;
  columns?: 1 | 2;
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-medium">{legend}</legend>
      <div
        className={cn(
          "grid gap-2",
          columns === 2 ? "grid-cols-2" : "grid-cols-1",
        )}
      >
        {options.map((o) => (
          <label key={o.value} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="peer sr-only"
            />
            <span className="peer-checked:border-brand peer-checked:bg-brand/5 peer-checked:ring-brand/20 hover:bg-accent/50 peer-focus-visible:ring-ring flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors peer-checked:ring-2 peer-focus-visible:ring-2">
              {o.logo}
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">
                  {o.label}
                </span>
                {o.sub && (
                  <span className="text-muted-foreground block truncate text-xs">
                    {o.sub}
                  </span>
                )}
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
