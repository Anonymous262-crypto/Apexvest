"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface Option<T extends string> {
  value: T;
  label: string;
}

interface Pos {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Two or more options with a sliding indicator (Efferd pricing block style).
 * The indicator is plain CSS (position + transition) so it cannot fail to render. Until it is measured,
 * the active option paints its own background, so the selected label is never invisible.
 */
export function SegmentedToggle<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Option<T>[];
  label: string;
  className?: string;
}) {
  const refs = useRef<Partial<Record<T, HTMLButtonElement>>>({});
  const [pos, setPos] = useState<Pos | null>(null);
  const [animate, setAnimate] = useState(false);

  const measure = useCallback(() => {
    const el = refs.current[value];
    if (el && el.offsetWidth > 0) {
      setPos({
        left: el.offsetLeft,
        top: el.offsetTop,
        width: el.offsetWidth,
        height: el.offsetHeight,
      });
    }
  }, [value]);

  useLayoutEffect(() => {
    measure();
  }, [measure, options.length]);

  // Re-measure when fonts load or the container resizes, and only animate after the first paint.
  useLayoutEffect(() => {
    const ro = new ResizeObserver(measure);
    Object.values<HTMLButtonElement | undefined>(refs.current).forEach(
      (el) => el && ro.observe(el),
    );
    const t = requestAnimationFrame(() => setAnimate(true));
    return () => {
      ro.disconnect();
      cancelAnimationFrame(t);
    };
  }, [measure, options.length]);

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "bg-card relative mx-auto flex w-fit max-w-full rounded-lg border p-1 shadow-xs",
        className,
      )}
    >
      {pos && (
        <span
          aria-hidden="true"
          style={{
            left: pos.left,
            top: pos.top,
            width: pos.width,
            height: pos.height,
          }}
          className={cn(
            "from-primary to-primary/85 pointer-events-none absolute z-0 rounded-md bg-linear-to-b shadow-sm motion-reduce:transition-none",
            animate && "transition-[left,width] duration-300 ease-out",
          )}
        />
      )}
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            ref={(el) => {
              if (el) refs.current[o.value] = el;
            }}
            className={cn(
              "relative z-10 h-9 shrink-0 rounded-md px-4 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
              active && !pos && "from-primary to-primary/85 bg-linear-to-b",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
