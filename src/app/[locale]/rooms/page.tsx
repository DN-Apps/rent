import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getRooms } from "@/lib/rooms";
import RoomCard from "@/components/rooms/RoomCard";

type RoomsPageProps = {
  params: {
    locale: string;
  };
};

export async function generateMetadata({
  params,
}: RoomsPageProps): Promise<Metadata> {
  const t = await getTranslations({
    locale: params.locale,
    namespace: "rooms",
  });

  return {
    title: t("title"),
    description: t("seo_description"),
  };
}

export default async function RoomsPage({ params }: RoomsPageProps) {
  const t = await getTranslations({
    locale: params.locale,
    namespace: "rooms",
  });

  let rooms: Awaited<ReturnType<typeof getRooms>> = [];
  try {
    rooms = await getRooms();
  } catch {
    // Directus nicht verfuegbar – Fehlerzustand anzeigen
  }

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-14">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl mb-2">
        {t("title")}
      </h1>
      <p className="text-zinc-500 mb-10">{t("subtitle")}</p>

      {rooms.length === 0 ? (
        <p className="text-zinc-500">{t("load_error")}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} locale={params.locale} />
          ))}
        </div>
      )}
    </main>
  );
}
