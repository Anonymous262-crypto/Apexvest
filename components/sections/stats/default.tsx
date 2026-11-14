import { stats } from "@/content/site";

import { Section } from "../../ui/section";

export default function Stats() {
  return (
    <Section
      id={stats.id}
      aria-labelledby="stats-title"
      className="reveal py-12 sm:py-16 md:py-24"
    >
      <h2 id="stats-title" className="sr-only">
        {stats.title}
      </h2>
      <dl className="max-w-container mx-auto grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
        {stats.items.map((item) => (
          <div
            key={item.label}
            className="flex flex-col-reverse items-start gap-3 text-left"
          >
            <dt className="text-muted-foreground text-sm font-semibold text-pretty">
              {item.label}
            </dt>
            <dd className="from-foreground to-brand bg-linear-to-r bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl xl:text-5xl">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
