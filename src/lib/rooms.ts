import { directus } from "./directus";
import type { Room, Amenity } from "./directus";
import { readItems } from "@directus/sdk";
import { unstable_noStore as noStore } from "next/cache";

type RoomLocale = "de" | "en";

function getDirectusImageId(room: Room): string | null {
  const image = room.image;
  if (!image) return null;
  if (typeof image === "string") return image;
  if (typeof image === "object" && typeof image.id === "string") {
    return image.id;
  }
  return null;
}

export async function getRooms(locale?: RoomLocale): Promise<Room[]> {
  noStore();

  const rooms = await directus.request(
    readItems("rooms", {
      fields: [
        "id",
        "locale",
        "name",
        "description",
        "square_meters",
        "beds",
        "additional_info",
        "price_per_night",
        "price_per_week",
        "price_per_month",
        "available",
        "detail_text",
        "sort",
        "image",
      ],
      ...(locale
        ? {
            filter: {
              locale: { _eq: locale },
            },
          }
        : {}),
      sort: ["sort"],
      // Buchungsverfuegbarkeit soll immer den aktuellen Backend-Stand widerspiegeln.
      fetchOptions: { cache: "no-store" },
    }),
  );

  const baseUrl = (
    process.env.DIRECTUS_ASSET_BASE_URL || process.env.DIRECTUS_URL
  )?.replace(/\/$/, "");

  return rooms.map((room) => {
    const imageId = getDirectusImageId(room);
    return {
      ...room,
      image_url: imageId && baseUrl ? `${baseUrl}/assets/${imageId}` : null,
    };
  });
}

export async function getAmenities(): Promise<Amenity[]> {
  noStore();

  return directus.request(
    readItems("amenities", {
      sort: ["sort"],
      // Amenity-Inhalte mit CMS-Aenderungen synchron halten.
      fetchOptions: { cache: "no-store" },
    }),
  );
}
