// Re-Exports fuer Rueckwaertskompatibilitaet – massgeblich ist @/utils/validation
export {
  bookingSchema,
  bookingApiSchema,
  contactSchema,
} from "@/utils/validation";
export type {
  BookingFormData,
  BookingApiData,
  BookingRoomFormData,
  AddressFormData,
  ContactFormData,
} from "@/utils/validation";
