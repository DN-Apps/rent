import {
  createDirectus,
  rest,
  staticToken,
  DirectusClient,
  RestClient,
} from "@directus/sdk";

export interface Room {
  id: string;
  name: string;
  description: string;
  price_per_night: string;
  price_per_week: string;
  price_per_month: string;
  available: boolean;
  detail_text: string;
  sort: number | null;
  image?: string | { id?: string | null } | null;
}

export interface Page {
  id: string;
  slug: string;
  content: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  sort: number | null;
}

export interface Amenity {
  id: string;
  label: string;
  icon:
    | string
    | {
        name?: string | null;
        icon?: string | null;
        value?: string | null;
      }
    | null;
  sort: number | null;
}

export interface GallerySlide {
  id: string;
  title?: string | null;
  image?: string | { id?: string | null } | null;
  alt_text?: string | null;
  sort: number | null;
  active?: boolean | null;
  category?: string | null;
}

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export interface Booking {
  id: string;
  created_at: string;
  check_in: string;
  check_out: string;
  total_price: string;
  status: BookingStatus;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  guest_address: string;
  company: string;
  invoice_address: string | null;
  message: string | null;
}

export interface BookingRoom {
  id: string;
  booking_id: string;
  room_id: string;
  room_name: string;
  price_per_night: string;
  number_of_guests: number;
}

export interface DirectusSchema {
  rooms: Room[];
  gallery_slides: GallerySlide[];
  pages: Page[];
  faqs: Faq[];
  amenities: Amenity[];
  bookings: Booking[];
  booking_rooms: BookingRoom[];
}

export type AppDirectusClient = DirectusClient<DirectusSchema> &
  RestClient<DirectusSchema>;

let _client: AppDirectusClient | null = null;

export function getDirectus(): AppDirectusClient {
  if (_client) return _client;

  const url = process.env.DIRECTUS_URL;
  const token = process.env.DIRECTUS_TOKEN;

  if (!url) {
    throw new Error("DIRECTUS_URL is not set");
  }

  const baseClient = createDirectus<DirectusSchema>(url).with(rest());
  _client = (token
    ? baseClient.with(staticToken(token))
    : baseClient) as unknown as AppDirectusClient;

  return _client;
}

export const directus = new Proxy({} as AppDirectusClient, {
  get(_target, prop) {
    return (getDirectus() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
