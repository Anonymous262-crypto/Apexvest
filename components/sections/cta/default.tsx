import { appLinks, cta } from "@/content/site";

import { Button } from "../../ui/button";
import Glow from "../../ui/glow";
import { Section } from "../../ui/section";

export default function CTA() {
  return (
    <Section
      aria-labelledby="cta-title"
      className="group reveal relative overflow-hidden"
    >
      <div className="max-w-container relative z-10 mx-auto flex flex-col items-center gap-6 text-center sm:gap-8">
        <h2
          id="cta-title"
          className="max-w-[640px] text-[clamp(1.625rem,3vw,2.25rem)] leading-tight font-semibold tracking-tight text-balance"
        >
          {cta.title}
        </h2>
        <p className="text-muted-foreground max-w-[520px] text-base font-medium sm:text-xl">
          {cta.description}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button size="lg" asChild>
            <a href={appLinks.register}>{cta.primary}</a>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href={appLinks.login}>{cta.secondary}</a>
          </Button>
        </div>
      </div>
      <div className="absolute top-0 left-0 h-full w-full translate-y-[1rem] opacity-80 transition-all duration-500 ease-in-out group-hover:translate-y-[-2rem] group-hover:opacity-100">
        <Glow variant="bottom" />
      </div>
    </Section>
  );
}
