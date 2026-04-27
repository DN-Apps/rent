import "server-only";
import { z } from "zod";

const nonEmptyTrimmed = z.string().trim().min(1);
const optionalTrimmed = z.string().trim().optional().default("");
const mailPortSchema = z
  .string()
  .trim()
  .regex(/^\d+$/, "MAIL_PORT must be numeric")
  .refine((value) => {
    const port = Number(value);
    return Number.isInteger(port) && port >= 1 && port <= 65535;
  }, "MAIL_PORT must be between 1 and 65535");

const publicEnvSchema = z.object({
  NEXT_PUBLIC_BASE_URL: z.string().trim().url(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z
    .string()
    .trim()
    .min(1, "NEXT_PUBLIC_TURNSTILE_SITE_KEY is required"),
});

const serverEnvSchema = z.object({
  DIRECTUS_URL: z.string().trim().url("DIRECTUS_URL must be a valid URL"),
  DIRECTUS_TOKEN: optionalTrimmed,
  TURNSTILE_SECRET_KEY: nonEmptyTrimmed,
  MAIL_HOST: nonEmptyTrimmed,
  MAIL_PORT: mailPortSchema,
  MAIL_USER: nonEmptyTrimmed,
  MAIL_PASS: nonEmptyTrimmed,
  MAIL_FROM: nonEmptyTrimmed,
  MAIL_CONTACT_FROM: optionalTrimmed,
  MAIL_TO: nonEmptyTrimmed,
  MAIL_BOOKING_TO: optionalTrimmed,
  MAIL_CONTACT_TO: optionalTrimmed,
});

const publicParsed = publicEnvSchema.safeParse({
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
});

if (!publicParsed.success) {
  throw new Error(
    `Invalid public environment variables: ${publicParsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ")}`,
  );
}

const serverParsed = serverEnvSchema.safeParse({
  DIRECTUS_URL: process.env.DIRECTUS_URL,
  DIRECTUS_TOKEN: process.env.DIRECTUS_TOKEN,
  TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
  MAIL_HOST: process.env.MAIL_HOST,
  MAIL_PORT: process.env.MAIL_PORT,
  MAIL_USER: process.env.MAIL_USER,
  MAIL_PASS: process.env.MAIL_PASS,
  MAIL_FROM: process.env.MAIL_FROM,
  MAIL_CONTACT_FROM: process.env.MAIL_CONTACT_FROM,
  MAIL_TO: process.env.MAIL_TO,
  MAIL_BOOKING_TO: process.env.MAIL_BOOKING_TO,
  MAIL_CONTACT_TO: process.env.MAIL_CONTACT_TO,
});

if (!serverParsed.success) {
  throw new Error(
    `Invalid server environment variables: ${serverParsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ")}`,
  );
}

export const publicEnv = publicParsed.data;
export const env = serverParsed.data;
