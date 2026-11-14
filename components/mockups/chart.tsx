import { useId } from "react";

import { cn } from "@/lib/utils";

interface GrowthChartProps {
  points: number[];
  className?: string;
}

/** Decorative SVG line chart with a soft electric-blue area fill and a gold end marker. */
export function GrowthChart({ points, className }: GrowthChartProps) {
  const id = useId();
  const w = 400;
  const h = 140;
  const pad = 8;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const step = (w - pad * 2) / (points.length - 1);
  const coords = points.map((p, i) => [
    pad + i * step,
    h - pad - ((p - min) / (max - min || 1)) * (h - pad * 2),
  ]);
  const line = coords.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");
  const area = `${line} L${coords[coords.length - 1][0]},${h} L${coords[0][0]},${h} Z`;
  const [lx, ly] = coords[coords.length - 1];

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={cn("h-full w-full", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1="0"
          x2={w}
          y1={h * f}
          y2={h * f}
          stroke="var(--border)"
          strokeOpacity="0.5"
          strokeDasharray="4 6"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      <path d={area} fill={`url(#${id})`} />
      <path
        d={line}
        fill="none"
        stroke="var(--brand)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={lx} cy={ly} r="4" fill="var(--gold)" />
    </svg>
  );
}
