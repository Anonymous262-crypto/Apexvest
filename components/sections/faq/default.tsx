import { faq } from "@/content/site";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../ui/accordion";
import { Section } from "../../ui/section";

export default function FAQ() {
  return (
    <Section id={faq.id} aria-labelledby="faq-title" className="reveal">
      <div className="max-w-container mx-auto flex flex-col items-center gap-8 sm:gap-12">
        <h2
          id="faq-title"
          className="text-center text-[clamp(1.625rem,3vw,2.25rem)] leading-tight font-semibold tracking-tight text-balance"
        >
          {faq.title}
        </h2>
        <Accordion
          type="single"
          collapsible
          defaultValue="item-1"
          className="w-full max-w-[800px]"
        >
          {faq.items.map((item, i) => (
            <AccordionItem key={item.q} value={`item-${i + 1}`}>
              <AccordionTrigger className="min-h-10 text-sm sm:text-base">
                {item.q}
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground max-w-[640px] text-base text-pretty">
                  {item.a}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}
