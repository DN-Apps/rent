import { readItems } from "@directus/sdk";
import { directus } from "./directus";
import type { GallerySlide } from "./directus";

export interface GallerySlideViewModel {
  src: string;
  alt: string;
}

function getAssetId(image: GallerySlide["image"]): string | null {
  if (!image) return null;
  if (typeof image === "string") return image;
  if (typeof image === "object" && typeof image.id === "string")
    return image.id;
  return null;
}

function getAssetUrl(fileId: string): string | null {
  const baseUrl = (
    process.env.DIRECTUS_ASSET_BASE_URL || process.env.DIRECTUS_URL
  )?.replace(/\/$/, "");
  if (!baseUrl) return null;
  return `${baseUrl}/assets/${fileId}`;
}

export async function getGallerySlides(): Promise<GallerySlideViewModel[]> {
  const items = await directus.request(
    readItems("gallery_slides", {
      fields: [
        "id",
        "title",
        "image",
        "alt_text",
        "sort",
        "active",
        "category",
      ],
      filter: {
        active: { _eq: true },
      },
      sort: ["sort"],
      fetchOptions: { cache: "no-store" },
    }),
  );

  return items
    .map((item) => {
      const fileId = getAssetId(item.image);
      const src = fileId ? getAssetUrl(fileId) : null;

      if (!src) return null;

      return {
        src,
        alt: item.alt_text?.trim() || item.title?.trim() || "Galeriebild",
      } satisfies GallerySlideViewModel;
    })
    .filter((item): item is GallerySlideViewModel => item !== null);
}
