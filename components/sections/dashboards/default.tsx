import { dashboards } from "@/content/site";

import { InvestorDashboard } from "../../mockups/investor-dashboard";
import { Mockup, MockupFrame } from "../../ui/mockup";
import { Section } from "../../ui/section";

export default function Dashboards() {
  return (
    <Section
      id={dashboards.id}
      aria-labelledby="dashboards-title"
      className="reveal"
    >
      <div className="max-w-container mx-auto flex flex-col items-center gap-10 sm:gap-12">
        <h2
          id="dashboards-title"
          className="max-w-[640px] text-center text-[clamp(1.625rem,3vw,2.25rem)] leading-tight font-semibold tracking-tight text-balance"
        >
          {dashboards.title}
        </h2>
        <p className="sr-only">{dashboards.description}</p>
        <MockupFrame className="w-full" size="small">
          <Mockup
            type="responsive"
            className="w-full rounded-xl border-0"
            aria-hidden="true"
            inert
          >
            <InvestorDashboard />
          </Mockup>
        </MockupFrame>
        <p className="text-muted-foreground max-w-[640px] text-center text-sm text-pretty sm:text-base">
          {dashboards.caption}
        </p>
      </div>
    </Section>
  );
}
