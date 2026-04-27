// Alle gemeinsamen Typen zentral re-exportieren
export type {
  BookingFormData,
  BookingApiData,
  BookingRoomFormData,
  AddressFormData,
  ContactFormData,
} from "@/utils/validation";

export type { PriceBreakdown } from "@/utils/pricing";

// Zimmertyp aus Directus
export type { Room, Amenity, Page, Faq } from "@/lib/directus";
