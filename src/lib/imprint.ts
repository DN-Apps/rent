export type ImprintData = {
  name: string;
  streetNumber: string;
  zip: string;
  city: string;
  phone: string;
  mail: string;
};

type DirectusImprintItem = {
  id?: number | string;
  name?: string | null;
  street_number?: string | null;
  zip?: string | null;
  city?: string | null;
  phone?: string | null;
  mail?: string | null;
};

type DirectusItemsResponse<T> = {
  data?: T[];
};

function normalize(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function getImprintData(): Promise<ImprintData | null> {
  const baseUrl = process.env.DIRECTUS_URL?.replace(/\/$/, "");
  if (!baseUrl) return null;

  const headers: HeadersInit = {};
  if (process.env.DIRECTUS_TOKEN) {
    headers.Authorization = `Bearer ${process.env.DIRECTUS_TOKEN}`;
  }

  const response = await fetch(`${baseUrl}/items/imprint`, {
    cache: "no-store",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to load imprint data (${response.status})`);
  }

  const payload =
    (await response.json()) as DirectusItemsResponse<DirectusImprintItem>;
  const item = payload.data?.[0];

  if (!item) return null;

  return {
    name: normalize(item.name),
    streetNumber: normalize(item.street_number),
    zip: normalize(item.zip),
    city: normalize(item.city),
    phone: normalize(item.phone),
    mail: normalize(item.mail),
  };
}
