import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import BookingWizard from "@/components/booking/BookingWizard";
import { getRooms } from "@/lib/rooms";

type BookingPageProps = {
  params: {
    locale: string;
  };
  searchParams?: {
    room?: string;
  };
};

export async function generateMetadata({
  params,
}: BookingPageProps): Promise<Metadata> {
  const t = await getTranslations({
    locale: params.locale,
    namespace: "booking",
  });

  return {
    title: t("title"),
    description: t("seo_description"),
  };
}

export default async function BookingPage({ searchParams }: BookingPageProps) {
  const t = await getTranslations("booking");

  let rooms: Awaited<ReturnType<typeof getRooms>> = [];
  try {
    rooms = await getRooms();
  } catch {
    rooms = [];
  }

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-14">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900">
          {t("title")}
        </h1>
        <p className="text-zinc-500 mt-2">{t("intro_4_steps")}</p>
      </div>

      {rooms.length === 0 ? (
        <p className="text-zinc-500">{t("load_error")}</p>
      ) : (
        <BookingWizard rooms={rooms} preselectedRoomId={searchParams?.room} />
      )}
    </main>
  );
}
