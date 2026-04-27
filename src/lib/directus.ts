import { z } from "zod";
import { createDirectus, rest, staticToken } from "@directus/sdk";

const directusEnvSchema = z.object({
  DIRECTUS_URL: z.string().url(),
  DIRECTUS_TOKEN: z.string().optional().default(""),
});

const directusEnv = directusEnvSchema.parse({
  DIRECTUS_URL: process.env.DIRECTUS_URL,
  DIRECTUS_TOKEN: process.env.DIRECTUS_TOKEN,
});

// CMS-Umgebungswerte werden beim Modulladen validiert, um bei Fehlkonfiguration frueh zu scheitern.

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
  pages: Page[];
  faqs: Faq[];
  amenities: Amenity[];
  bookings: Booking[];
  booking_rooms: BookingRoom[];
}

const directusBaseClient = createDirectus<DirectusSchema>(
  directusEnv.DIRECTUS_URL,
).with(rest());

// Token ist optional, damit Public-Read-Setups ohne Auth laufen koennen.
export const directus = directusEnv.DIRECTUS_TOKEN
  ? directusBaseClient.with(staticToken(directusEnv.DIRECTUS_TOKEN))
  : directusBaseClient;
