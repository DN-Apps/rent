import { NextRequest } from "next/server";
import { parseAndValidateJson } from "@/lib/api-validation";
import { apiError, apiSuccess } from "@/lib/api-response";
import { verifyTurnstile } from "@/lib/turnstile";
import { contactSchema } from "@/utils/validation";
import {
  hasMailConfig,
  sendContactConfirmation,
  sendContactMail,
} from "@/lib/mail";

export async function POST(req: NextRequest) {
  const parsed = await parseAndValidateJson(
    req,
    contactSchema,
    "Invalid contact data",
  );

  if (!parsed.success) {
    return apiError(parsed.error, parsed.status);
  }

  const turnstileOk = await verifyTurnstile(parsed.data.turnstileToken);
  if (!turnstileOk) {
    return apiError(
      "Captcha-Verifizierung fehlgeschlagen. Bitte erneut versuchen.",
      403,
    );
  }

  if (!hasMailConfig()) {
    return apiError("Mail configuration is incomplete", 503);
  }

  try {
    // Beide E-Mails parallel senden und bei einem Fehler die Anfrage fehlschlagen lassen.
    await Promise.all([
      sendContactMail(parsed.data),
      sendContactConfirmation(parsed.data),
    ]);

    return apiSuccess();
  } catch {
    return apiError("Message could not be sent", 500);
  }
}
