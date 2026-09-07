import type { Metadata } from "next";
import MietvertragForm from "@/components/mietvertrag/MietvertragForm";

export const revalidate = 0;

type MietvertraegePageProps = {
  params: {
    locale: string;
  };
};

export async function generateMetadata({
  params,
}: MietvertraegePageProps): Promise<Metadata> {
  return {
    title: params.locale === "en" ? "Rental contract draft" : "Mietvertragsentwurf",
    description:
      params.locale === "en"
        ? "Create a rental contract draft."
        : "Mietvertragsentwurf erstellen.",
  };
}

export default function MietvertraegePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
          Mietvertragsentwurf
        </h1>
        <p className="mt-2 text-zinc-500">
          Vertragsdaten eingeben, Entwurf erzeugen und in Directus speichern.
        </p>
      </div>
      <MietvertragForm />
    </main>
  );
}
