import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import ContactForm from "@/components/contact/ContactForm";
import FAQ from "@/components/contact/FAQ";

type ContactPageProps = {
  params: {
    locale: string;
  };
};

export async function generateMetadata({
  params,
}: ContactPageProps): Promise<Metadata> {
  const t = await getTranslations({
    locale: params.locale,
    namespace: "contact",
  });

  return {
    title: t("title"),
    description: t("seo_description"),
  };
}

export default async function ContactPage({ params }: ContactPageProps) {
  const t = await getTranslations({
    locale: params.locale,
    namespace: "contact",
  });

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-14 space-y-8">
      <header>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900">
          {t("title")}
        </h1>
        <p className="text-zinc-500 mt-2">
          Fragen zur Unterkunft oder zur Verfuegbarkeit? Schreiben Sie uns
          direkt.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <ContactForm />
        <FAQ />
      </div>
    </main>
  );
}
