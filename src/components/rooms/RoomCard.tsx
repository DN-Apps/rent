import Link from "next/link";
import Image from "next/image";
import type { StaticImageData } from "next/image";
import { useTranslations } from "next-intl";
import type { Room } from "@/lib/directus";
import room1 from "@/images/room1.jpg";
import room2 from "@/images/room2.jpg";
import room3 from "@/images/room3.jpg";

interface RoomCardProps {
  room: Room;
  locale: string;
}

const ROOM_IMAGES: StaticImageData[] = [room1, room2, room3];

function getRoomImage(room: Room): StaticImageData {
  if (typeof room.sort === "number" && room.sort >= 1 && room.sort <= 3) {
    return ROOM_IMAGES[room.sort - 1];
  }

  const normalizedName = room.name.toLowerCase();
  if (normalizedName.includes("1")) return room1;
  if (normalizedName.includes("2")) return room2;
  if (normalizedName.includes("3")) return room3;

  return room1;
}

export default function RoomCard({ room, locale }: RoomCardProps) {
  const t = useTranslations("rooms");
  const imageSrc = getRoomImage(room);

  return (
    <article className="flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
      <div className="relative aspect-[16/9] bg-zinc-100">
        <Image
          src={imageSrc}
          alt={room.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
        />
      </div>

      <div className="flex flex-col flex-1 p-6">
        {/* Kopfbereich: Name + Verfuegbarkeits-Badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 className="text-xl font-bold text-zinc-900">{room.name}</h2>
          <span
            className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              room.available
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {room.available ? "Verfügbar" : "Belegt"}
          </span>
        </div>

        {/* Beschreibung */}
        <p className="text-sm text-zinc-600 leading-relaxed mb-5">
          {room.description}
        </p>

        {/* Preistabelle */}
        <div className="mt-auto">
          <div className="grid grid-cols-3 divide-x divide-zinc-100 rounded-xl border border-zinc-100 bg-zinc-50 text-center text-sm mb-4">
            {[
              { label: "/ Nacht", price: room.price_per_night },
              { label: "/ Woche", price: room.price_per_week },
              { label: "/ Monat", price: room.price_per_month },
            ].map(({ label, price }) => (
              <div key={label} className="py-3 px-2">
                <p className="font-bold text-zinc-900 text-base">
                  {Number(price).toLocaleString("de-DE", {
                    style: "currency",
                    currency: "EUR",
                    minimumFractionDigits: 0,
                  })}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <Link
            href={`/${locale}/booking?room=${room.id}`}
            className={`block w-full text-center rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
              room.available
                ? "bg-zinc-900 text-white hover:bg-zinc-700"
                : "bg-zinc-200 text-zinc-400 pointer-events-none cursor-not-allowed"
            }`}
            aria-disabled={!room.available}
          >
            {t("book_now")}
          </Link>
        </div>
      </div>
    </article>
  );
}
