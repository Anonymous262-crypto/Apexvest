import { type PlanContent, plans } from "@/content/site";

import { Section } from "../../ui/section";
import { Pricing } from "./pricing";

export default function Plans({ plans: live }: { plans: PlanContent[] }) {
  return (
    <Section id={plans.id} aria-labelledby="plans-title" className="reveal">
      <div className="max-w-container mx-auto flex flex-col items-center gap-10 sm:gap-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <h2
            id="plans-title"
            className="max-w-[640px] text-[clamp(1.625rem,3vw,2.25rem)] leading-tight font-semibold tracking-tight text-balance"
          >
            {plans.title}
          </h2>
          <p className="text-muted-foreground max-w-[600px] text-base font-medium sm:text-lg">
            {plans.description}
          </p>
        </div>
        <Pricing initial={live} />
        <p className="text-muted-foreground max-w-[640px] text-center text-sm font-medium text-pretty">
          {plans.lockNote}
        </p>
        <p className="text-muted-foreground max-w-[640px] text-center text-sm text-pretty">
          {plans.footnote}
        </p>
      </div>
    </Section>
  );
}
