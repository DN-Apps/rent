import { NextRequest } from "next/server";
import { createItem, readItems } from "@directus/sdk";
import { parseAndValidateJson } from "@/lib/api-validation";
import { apiError, apiSuccess } from "@/lib/api-response";
import { directus, type BookingStatus } from "@/lib/directus";
import { bookingApiSchema } from "@/utils/validation";
import { calculateNightCount, calculateStayPrice } from "@/utils/pricing";
import { verifyTurnstile } from "@/lib/turnstile";
import {
  hasMailConfig,
  sendBookingConfirmation,
  sendBookingNotification,
  type BookingData,
} from "@/lib/mail";

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const directusError = error as {
      errors?: Array<{ message?: string }>;
      message?: string;
    };

    return (
      directusError.errors?.[0]?.message ??
      directusError.message ??
      "Booking could not be saved"
    );
  }

  return "Booking could not be saved";
}

function getErrorStatus(error: unknown): number {
  if (typeof error === "object" && error !== null) {
    const directusError = error as {
      status?: number;
      response?: { status?: number };
      errors?: Array<{ extensions?: { code?: string } }>;
    };

    // Expliziten Transport-Status bevorzugen, bevor auf Anbieter-Fehlercodes zurueckgefallen wird.
    const statusFromObject =
      directusError.status ?? directusError.response?.status;
    if (typeof statusFromObject === "number") {
      return statusFromObject;
    }

    const code = directusError.errors?.[0]?.extensions?.code;
    if (code === "FORBIDDEN") {
      return 403;
    }
    if (code === "INVALID_PAYLOAD") {
      return 422;
    }
  }

  return 500;
}

export async function POST(req: NextRequest) {
  const parsed = await parseAndValidateJson(
    req,
    bookingApiSchema,
    "Invalid booking data",
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

  const payload = parsed.data;
  const checkIn = new Date(payload.checkIn);
  const checkOut = new Date(payload.checkOut);
  const nights = calculateNightCount(checkIn, checkOut);
  // Zimmer-IDs deduplizieren, um doppelte Relations-Insertions und fehlerhafte Checks zu vermeiden.
  const selectedRoomIds = [
    ...new Set(payload.rooms.map((room) => room.roomId)),
  ];

  if (!hasMailConfig()) {
    return apiError(
      "Mail configuration is incomplete. Please set MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS and MAIL_FROM in .env.local.",
      503,
    );
  }

  if (nights < 1) {
    return apiError("Stay must be at least 1 night", 422);
  }

  // Zimmerverfuegbarkeit serverseitig erneut pruefen, um veraltete Client-Auswahlen zu verhindern.
  const availableRooms = await directus.request(
    readItems("rooms", {
      fields: ["id"],
      filter: {
        id: { _in: selectedRoomIds },
        available: { _eq: true },
      },
      limit: selectedRoomIds.length,
      fetchOptions: { cache: "no-store" },
    }),
  );

  if (availableRooms.length !== selectedRoomIds.length) {
    return apiError(
      "Mindestens eines der ausgewaehlten Zimmer ist nicht verfuegbar.",
      409,
    );
  }

  const perRoomStay = calculateStayPrice(nights);
  const totalPrice = perRoomStay.total * payload.rooms.length;

  try {
    const status: BookingStatus = "PENDING";

    const createdBooking = await directus.request(
      createItem(
        "bookings",
        {
          check_in: checkIn.toISOString(),
          check_out: checkOut.toISOString(),
          total_price: totalPrice.toFixed(2),
          status,
          guest_name: payload.guestName,
          guest_email: payload.guestEmail,
          guest_phone: payload.guestPhone,
          guest_address: JSON.stringify(payload.guestAddress),
          company: payload.company,
          invoice_address: payload.invoiceAddress
            ? JSON.stringify(payload.invoiceAddress)
            : null,
          message: payload.message || null,
        },
        {
          fields: ["id"],
        },
      ),
    );

    if (!createdBooking?.id) {
      return apiError(
        "Booking was created but booking id is not readable. Grant read access to bookings.id for the active Directus role.",
        403,
      );
    }

    const bookingId = createdBooking.id;

    await Promise.all(
      payload.rooms.map((room) =>
        directus.request(
          createItem("booking_rooms", {
            booking_id: bookingId,
            room_id: room.roomId,
            room_name: room.roomName,
            price_per_night: room.pricePerNight.toFixed(2),
            number_of_guests: room.numberOfGuests,
          }),
        ),
      ),
    );

    const bookingMailData: BookingData = {
      bookingId,
      checkIn,
      checkOut,
      totalPrice,
      company: payload.company,
      guestName: payload.guestName,
      guestEmail: payload.guestEmail,
      guestPhone: payload.guestPhone,
      message: payload.message,
      guestAddress: payload.guestAddress,
      invoiceAddress: payload.invoiceAddress,
      rooms: payload.rooms,
    };

    try {
      await Promise.all([
        sendBookingConfirmation(bookingMailData),
        sendBookingNotification(bookingMailData),
      ]);
    } catch (error) {
      return apiSuccess(
        {
          bookingId,
          warning: `Booking was saved, but emails could not be sent: ${getErrorMessage(error)}`,
        },
        200,
      );
    }

    return apiSuccess({ bookingId });
  } catch (error) {
    const status = getErrorStatus(error);
    return apiError(getErrorMessage(error), status);
  }
}
