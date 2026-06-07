"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { LandingDict } from "@/lib/i18n/en";

export function FaqSection({ t }: { t: LandingDict["faq"] }) {
  return (
    <section id="faq" className="bg-zinc-900/40 px-4 py-24">
      <div className="mx-auto max-w-3xl">
        {/* Heading */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">{t.title}</h2>
          <p className="text-zinc-400">{t.subtitle}</p>
        </div>

        {/* Accordion */}
        <Accordion multiple={false} className="space-y-2">
          {t.items.map((item, i) => (
            <AccordionItem
              key={i}
              value={i}
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-5 open:border-zinc-700"
            >
              <AccordionTrigger className="py-4 text-sm font-medium text-white hover:text-amber-400 hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-sm leading-relaxed text-zinc-400">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
