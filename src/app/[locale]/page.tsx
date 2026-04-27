import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getAmenities } from "@/lib/rooms";
import Slideshow from "@/components/ui/Slideshow";
import AmenityIcon from "@/components/ui/AmenityIcon";
import { HiLocationMarker } from "react-icons/hi";
import Link from "next/link";

// Kontaktinfos – mit echten Werten ersetzen oder aus env/Directus laden
const CONTACT = {
  name: "Monteurzimmer Nedic",
  address: "Kirchgasse 8, 74831 Gundelsheim",
  phone: "+49 1701071715",
  email: "daniel-nedic@hotmail.de",
  mapsEmbedUrl:
    "https://www.openstreetmap.org/export/embed.html?bbox=9.1520569,49.2792402,9.1640569,49.2912402&layer=mapnik&marker=49.2852402,9.1580569",
  mapsUrl:
    "https://www.openstreetmap.org/?mlat=49.2852402&mlon=9.1580569#map=19/49.2852402/9.1580569",
};

type HomePageProps = {
  params: {
    locale: string;
  };
};

export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "home" });

  return {
    title: t("title"),
    description: t("seo_description"),
  };
}

export default async function HomePage({ params }: HomePageProps) {
  const t = await getTranslations({ locale: params.locale, namespace: "home" });

  let amenities: Awaited<ReturnType<typeof getAmenities>> = [];
  try {
    amenities = await getAmenities();
  } catch {
    // Directus kann beim Build nicht verfuegbar sein – ohne Ausstattungen rendern
  }

  return (
    <main>
      {/* Hero-Bereich / Slideshow */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-10 pb-12">
        <Slideshow />
        <div className="mt-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-3 text-lg text-zinc-500 max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/${params.locale}/rooms`}
              className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-700 transition-colors"
            >
              Zimmer ansehen
            </Link>
            <Link
              href={`/${params.locale}/booking`}
              className="rounded-lg border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 transition-colors"
            >
              Jetzt buchen
            </Link>
          </div>
        </div>
      </section>

      {/* Ausstattungen */}
      {amenities.length > 0 && (
        <section className="bg-zinc-50 border-y border-zinc-200 py-12">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-zinc-900 text-center mb-8">
              {t("amenities_title")}
            </h2>
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {amenities.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-3 rounded-xl bg-white border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700"
                >
                  <AmenityIcon icon={a.icon} label={a.label} />
                  {a.label}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Preisübersicht */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-14">
        <h2 className="text-2xl font-bold text-zinc-900 text-center mb-8">
          Unsere Preise
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {[
            { label: "pro Nacht", price: "20 €" },
            { label: "pro Woche", price: "140 €" },
            { label: "pro Monat", price: "400 €" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-zinc-200 bg-white px-6 py-8 shadow-sm"
            >
              <p className="text-4xl font-bold text-zinc-900">{item.price}</p>
              <p className="mt-1 text-sm text-zinc-500">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Kontakt & Karte */}
      <section className="bg-zinc-50 border-y border-zinc-200 py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Kontaktinfos */}
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-5">
              Lage &amp; Anfahrt
            </h2>
            <address className="not-italic text-sm text-zinc-600 space-y-2 mb-6">
              <p className="font-semibold text-zinc-900">{CONTACT.name}</p>
              <p>{CONTACT.address}</p>
              <p>
                <a
                  href={`tel:${CONTACT.phone}`}
                  className="hover:text-zinc-900"
                >
                  {CONTACT.phone}
                </a>
              </p>
              <p>
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="hover:text-zinc-900 underline"
                >
                  {CONTACT.email}
                </a>
              </p>
            </address>
            {/* Verkehrsanbindung – für Monteure relevante Infos */}
            <div className="rounded-xl bg-white border border-zinc-200 p-4 text-sm text-zinc-700 space-y-2">
              <h3 className="font-semibold text-zinc-900 text-base mb-2">
                Verkehrsanbindung
              </h3>
              <p>🛣️ Autobahn Bad Rappenau – kurze Anfahrt</p>
              <p>🛣️ Autobahn Neckarsulm – kurze Anfahrt</p>
              <p>🛣️ Autobahn Neuenstadt – kurze Anfahrt</p>
              <p>🚂 Bahnhof Gundelsheim – 4 Minuten zu Fuß</p>
              <p>
                🍕 Bar/Café, Bäcker, italienische Pizzeria, Edeka und Lidl in
                der Nähe
              </p>
              <p>🅿️ Kostenfreie Parkplätze direkt am Haus</p>
            </div>
          </div>

          {/* Karte */}
          <div>
            <div className="rounded-2xl overflow-hidden border border-zinc-200 shadow-sm aspect-[4/3] w-full">
              <iframe
                src={CONTACT.mapsEmbedUrl}
                width="100%"
                height="100%"
                loading="lazy"
                title="Standort auf Karte"
                className="w-full h-full border-0"
              />
            </div>
            <a
              href={CONTACT.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition-colors hover:bg-zinc-100"
            >
              <HiLocationMarker className="h-4 w-4" aria-hidden="true" />
              {t("open_map")}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
