import React from "react";

import { cn } from "@/lib/utils";

type As = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";

type KineticTextProps = React.HTMLAttributes<HTMLElement> & {
  text: string;
  as?: As;
  /** Resting weight, and the weights of the hovered letter and its neighbours. */
  base?: number;
  peak?: number;
  near?: number;
  far?: number;
};

/**
 * Letters swell in weight as the pointer passes over them (Magic UI "Kinetic Text").
 * Adapted: words never break mid-word, weights are configurable, and the resting weight
 * matches a bold headline instead of a light one.
 */
export function KineticText({
  text,
  as: Tag = "span",
  className,
  style,
  base = 700,
  peak = 900,
  near = 800,
  far = 750,
  ...rest
}: KineticTextProps) {
  const mergedStyle = {
    "--hover-padding": "calc(1em / 40)",
    "--kw-base": base,
    "--kw-peak": peak,
    "--kw-near": near,
    "--kw-far": far,
    ...(style as React.CSSProperties | undefined),
  } as React.CSSProperties;

  return (
    <Tag
      {...rest}
      className={cn("flex flex-wrap justify-center gap-x-[0.28em]", className)}
      style={mergedStyle}
    >
      {text.split(" ").map((word, w) => (
        <span
          key={w}
          aria-hidden="true"
          className="inline-flex whitespace-nowrap"
        >
          {word.split("").map((letter, i) => (
            <span
              key={i}
              className="[font-weight:var(--kw-base)] [will-change:font-weight] [transition:font-weight_0.35s,padding_0.35s] hover:[padding-inline:var(--hover-padding)] hover:[font-weight:var(--kw-peak)] has-[+span+span:hover]:[font-weight:var(--kw-far)] has-[+span:hover]:[padding-inline:var(--hover-padding)] has-[+span:hover]:[font-weight:var(--kw-near)] [:hover+&]:[padding-inline:var(--hover-padding)] [:hover+&]:[font-weight:var(--kw-near)] [:hover+span+&]:[font-weight:var(--kw-far)]"
            >
              {letter}
            </span>
          ))}
        </span>
      ))}
      <span className="sr-only">{text}</span>
    </Tag>
  );
}
