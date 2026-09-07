import { z } from "zod";

const trimmedString = () => z.string().trim();

const requiredTrimmedString = (minimumLength: number, message: string) =>
  trimmedString().min(minimumLength, message);

const normalizedEmail = (message: string) =>
  trimmedString()
    .email(message)
    // E-Mail normalisieren, damit keine Duplikate mit unterschiedlicher Gross-/Kleinschreibung entstehen.
    .transform((value) => value.toLowerCase());

const optionalTrimmedString = () =>
  z
    .string()
    .trim()
    .optional()
    .transform((value) => {
      // Leere optionale Eingaben auf undefined normalisieren fuer sauberere Payloads.
      if (!value || value.length === 0) {
        return undefined;
      }

      return value;
    });

const addressSchema = z.object({
  street: requiredTrimmedString(2, "Street is required"),
  zip: requiredTrimmedString(4, "ZIP is required"),
  city: requiredTrimmedString(2, "City is required"),
  country: requiredTrimmedString(2, "Country is required"),
});

const bookingRoomSchema = z.object({
  roomId: requiredTrimmedString(1, "Room is required"),
  roomName: requiredTrimmedString(1, "Room name is required"),
  pricePerNight: z.number().min(0),
  numberOfGuests: z.number().int().min(1).max(1),
});

export const bookingSchema = z
  .object({
    checkIn: z.date(),
    checkOut: z.date(),
    rooms: z
      .array(bookingRoomSchema)
      .min(1, "Bitte mindestens ein Zimmer auswählen.")
      .max(3),
    company: requiredTrimmedString(2, "Company is required"),
    guestName: requiredTrimmedString(2, "Name is required"),
    guestEmail: normalizedEmail("Valid email is required"),
    guestPhone: requiredTrimmedString(6, "Phone is required"),
    message: trimmedString().max(
      500,
      "Nachricht darf maximal 500 Zeichen haben",
    ),
    guestAddress: addressSchema,
    invoiceAddress: addressSchema.optional(),
  })
  .refine((data) => data.checkOut > data.checkIn, {
    path: ["checkOut"],
    message: "Check-out must be after check-in",
  });

// Schema fuer die API-Route: akzeptiert ISO-Datumsstrings aus JSON
export const bookingApiSchema = z
  .object({
    // Die API erhaelt Datumswerte als ISO-Strings, anders als das UI-Formularschema.
    checkIn: z.string().datetime(),
    checkOut: z.string().datetime(),
    rooms: z
      .array(bookingRoomSchema)
      .min(1, "Please select at least one room")
      .max(3),
    company: requiredTrimmedString(2, "Company is required"),
    guestName: requiredTrimmedString(2, "Name is required"),
    guestEmail: normalizedEmail("Valid email is required"),
    guestPhone: requiredTrimmedString(6, "Phone is required"),
    message: trimmedString().max(500, "Message must be 500 characters or less"),
    guestAddress: addressSchema,
    invoiceAddress: addressSchema.optional(),
    turnstileToken: requiredTrimmedString(1, "Captcha token is required"),
  })
  .refine((data) => new Date(data.checkOut) > new Date(data.checkIn), {
    path: ["checkOut"],
    message: "Check-out must be after check-in",
  });

export const contactSchema = z.object({
  name: requiredTrimmedString(2, "String must contain at least 2 character(s)"),
  email: normalizedEmail("Invalid email"),
  phone: optionalTrimmedString(),
  street: requiredTrimmedString(
    2,
    "String must contain at least 2 character(s)",
  ),
  zip: requiredTrimmedString(4, "String must contain at least 4 character(s)"),
  city: requiredTrimmedString(2, "String must contain at least 2 character(s)"),
  message: trimmedString().min(5).max(500),
  turnstileToken: requiredTrimmedString(1, "Bitte das Captcha ausfuellen."),
});

export type BookingFormData = z.infer<typeof bookingSchema>;
export type BookingApiData = z.infer<typeof bookingApiSchema>;
export type BookingRoomFormData = z.infer<typeof bookingRoomSchema>;
export type AddressFormData = z.infer<typeof addressSchema>;
export type ContactFormInputData = z.input<typeof contactSchema>;
export type ContactFormData = z.infer<typeof contactSchema>;
export type MietvertragApiData = z.infer<typeof mietvertragApiSchema>;

export const mietvertragApiSchema = z.object({
  tenant_id: z.string().min(1),
  vermieter_name: z.string().min(1),
  vermieter_adresse: z.string().min(1),
  mieter_name: z.string().min(1),
  mieter_adresse: z.string().min(1),
  mietobjekt_adresse: z.string().min(1),
  miethoehe_cent: z.number().int().min(0),
  wohnflaeche_qm: z.number().finite().positive(),
  nebenkosten_cent: z.number().int().min(0),
  kaution_cent: z.number().int().min(0),
  vertragstyp: z.enum([
    "UNBEFRISTET",
    "BEFRISTET",
    "STAFFEL",
    "INDEX",
    "UNTERMIETE",
  ]),
  befristungsgrund: z.string().trim().optional().default(""),
  hauptmieter_name: z.string().trim().optional().default(""),
  vermieter_zustimmung: z.boolean().default(false),
  mietbeginn: z.string().min(1),
  laufzeit_monate: z.number().int().min(1),
  status: z.enum(["DRAFT", "PENDING_REVIEW", "APPROVED", "REJECTED"]).optional(),
}).superRefine((data, context) => {
  if (data.vertragstyp === "BEFRISTET" && !data.befristungsgrund) {
    context.addIssue({
      code: "custom",
      path: ["befristungsgrund"],
      message: "Ein Befristungsgrund ist erforderlich.",
    });
  }

  if (data.vertragstyp === "UNTERMIETE" && !data.hauptmieter_name) {
    context.addIssue({
      code: "custom",
      path: ["hauptmieter_name"],
      message: "Der Name des Hauptmieters ist erforderlich.",
    });
  }
});



