import { security } from "@/content/site";

import { FeatureGrid } from "../../ui/feature-grid";
import { Section } from "../../ui/section";

export default function Security() {
  return (
    <Section
      id={security.id}
      aria-labelledby="security-title"
      className="reveal"
    >
      <div className="max-w-container mx-auto flex flex-col items-center gap-10 sm:gap-16">
        <h2
          id="security-title"
          className="max-w-[640px] text-center text-[clamp(1.625rem,3vw,2.25rem)] leading-tight font-semibold tracking-tight text-balance"
        >
          {security.title}
        </h2>
        <FeatureGrid items={security.items} />
      </div>
    </Section>
  );
}
