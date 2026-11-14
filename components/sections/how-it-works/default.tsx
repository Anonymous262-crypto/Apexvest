import { howItWorks } from "@/content/site";

import { Section } from "../../ui/section";

export default function HowItWorks() {
  return (
    <Section id={howItWorks.id} aria-labelledby="how-title" className="reveal">
      <div className="max-w-container mx-auto flex flex-col items-center gap-10 sm:gap-16">
        <h2
          id="how-title"
          className="max-w-[640px] text-center text-[clamp(1.625rem,3vw,2.25rem)] leading-tight font-semibold tracking-tight text-balance"
        >
          {howItWorks.title}
        </h2>
        <ol className="relative grid w-full grid-cols-1 gap-8 lg:grid-cols-4 lg:gap-6">
          {/* dashed connector, desktop only */}
          <div
            aria-hidden="true"
            className="border-border dark:border-border/25 absolute top-5 right-[12.5%] left-[12.5%] hidden border-t border-dashed lg:block"
          />
          {howItWorks.steps.map((step, i) => (
            <li
              key={step.title}
              className="relative flex gap-4 lg:flex-col lg:items-center lg:text-center"
            >
              {i < howItWorks.steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className="border-border dark:border-border/25 absolute top-10 bottom-[-2rem] left-5 border-l border-dashed lg:hidden"
                />
              )}
              <span
                aria-hidden="true"
                className="bg-background border-gold text-gold-foreground relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold shadow-md"
              >
                {i + 1}
              </span>
              <div className="flex flex-col gap-2">
                <h3 className="text-base font-semibold">{step.title}</h3>
                <p className="text-muted-foreground text-sm text-pretty">
                  {step.copy}
                </p>
                {"note" in step && step.note && (
                  <p className="text-muted-foreground/90 text-xs">
                    {step.note}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
