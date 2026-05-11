import { readItems } from "@directus/sdk";
import { directus } from "@/lib/directus";
import type { Faq } from "@/lib/directus";
import FAQAccordion from "@/components/contact/FAQAccordion";

export default async function FAQ() {
  let items: Faq[] = [];

  try {
    items = await directus.request(
      readItems("faqs", {
        sort: ["sort"],
        fields: ["id", "question", "answer", "sort"],
        fetchOptions: { cache: "no-store" },
      }),
    );
  } catch {
    items = [];
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
      <h2 className="text-xl font-bold text-zinc-900 mb-4">FAQ</h2>
      <FAQAccordion items={items} />
    </section>
  );
}
