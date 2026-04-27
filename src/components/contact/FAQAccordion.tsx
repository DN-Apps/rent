"use client";

import { useState } from "react";
import type { Faq } from "@/lib/directus";

type FAQAccordionProps = {
  items: Faq[];
};

export default function FAQAccordion({ items }: FAQAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  if (items.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Aktuell sind keine FAQ-Eintraege vorhanden.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isOpen = openId === item.id;

        return (
          <article
            key={item.id}
            className="rounded-xl border border-zinc-200 bg-white overflow-hidden"
          >
            <button
              type="button"
              onClick={() =>
                setOpenId((current) => (current === item.id ? null : item.id))
              }
              className="w-full px-4 py-3 text-left flex items-center justify-between gap-3"
            >
              <span className="font-medium text-zinc-900">{item.question}</span>
              <span className="text-zinc-500 text-sm">
                {isOpen ? "-" : "+"}
              </span>
            </button>
            {isOpen && (
              <div className="px-4 pb-4 text-sm text-zinc-600 leading-relaxed">
                {item.answer}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
