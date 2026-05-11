import { directus } from "./directus";
import type { Room, Amenity } from "./directus";
import { readItems } from "@directus/sdk";

export async function getRooms(): Promise<Room[]> {
  return directus.request(
    readItems("rooms", {
      fields: [
        "id",
        "name",
        "description",
        "price_per_night",
        "price_per_week",
        "price_per_month",
        "available",
        "detail_text",
        "sort",
        "image",
      ],
      sort: ["sort"],
      // Buchungsverfuegbarkeit soll immer den aktuellen Backend-Stand widerspiegeln.
      fetchOptions: { cache: "no-store" },
    }),
  );
}

export async function getAmenities(): Promise<Amenity[]> {
  return directus.request(
    readItems("amenities", {
      sort: ["sort"],
      // Amenity-Inhalte mit CMS-Aenderungen synchron halten.
      fetchOptions: { cache: "no-store" },
    }),
  );
}
