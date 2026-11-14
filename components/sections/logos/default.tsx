import { CoinLogo } from "@/components/app/coin-logo";
import { assets } from "@/content/site";

import { Section } from "../../ui/section";

function Item({ children, dashed }: { children: string; dashed?: boolean }) {
  return dashed ? (
    <li className="text-muted-foreground border-border dark:border-border/20 flex shrink-0 items-center rounded-full border border-dashed px-4 py-2 text-sm font-medium whitespace-nowrap">
      {children}
    </li>
  ) : (
    <li className="flex shrink-0 items-center gap-2.5 text-sm font-semibold">
      <CoinLogo symbol={children} className="size-10" />
      {children}
    </li>
  );
}

/** One full set of assets. Rendered twice so the loop is seamless. */
function Group({ hidden }: { hidden?: boolean }) {
  return (
    <ul
      aria-hidden={hidden || undefined}
      aria-label={hidden ? undefined : assets.scrollLabel}
      className={`flex shrink-0 items-center gap-10 pr-10 ${hidden ? "motion-reduce:hidden" : ""}`}
    >
      {assets.tickers.map((t) => (
        <Item key={t}>{t}</Item>
      ))}
      <Item dashed>{assets.more}</Item>
    </ul>
  );
}

export default function Logos() {
  return (
    <Section
      aria-labelledby="assets-title"
      className="reveal py-12 sm:py-16 md:py-20"
    >
      <div className="max-w-container mx-auto flex flex-col items-center gap-8 text-center">
        <h2 id="assets-title" className="text-md font-semibold sm:text-2xl">
          {assets.title}
        </h2>
        {/* Infinite marquee: pauses on hover or touch, fades at the edges, and becomes a static wrap for reduced motion. */}
        <div className="group w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] motion-reduce:[mask-image:none]">
          <div className="flex w-max animate-[marquee_60s_linear_infinite] hover:[animation-play-state:paused] active:[animation-play-state:paused] motion-reduce:w-full motion-reduce:animate-none motion-reduce:flex-wrap motion-reduce:justify-center">
            <Group />
            <Group hidden />
          </div>
        </div>
      </div>
    </Section>
  );
}
