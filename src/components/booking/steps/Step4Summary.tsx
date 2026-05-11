"use client";

import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import type { BookingFormData, BookingRoomFormData } from "@/utils/validation";
import {
  formatBookingCurrency,
  formatBookingDate,
  formatPeriodLabel,
} from "@/utils/booking-display";
import type { PriceBreakdown } from "@/utils/pricing";

type Step4SummaryProps = {
  checkIn: Date;
  checkOut: Date;
  nights: number;
  perRoomBreakdown: PriceBreakdown;
  totalPrice: number;
  selectedRooms: BookingRoomFormData[];
  form: UseFormReturn<BookingFormData>;
};

// Finale Read-only-Pruefung vor dem Absenden; alle Werte stammen aus validiertem Formularzustand.
export default function Step4Summary({
  checkIn,
  checkOut,
  nights,
  perRoomBreakdown,
  totalPrice,
  selectedRooms,
  form,
}: Step4SummaryProps) {
  const t = useTranslations("booking");
  const periodLabel = formatPeriodLabel(perRoomBreakdown);

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-zinc-900">{t("step4")}</h2>

      <div className="rounded-xl border border-zinc-200 p-4 space-y-2 text-sm text-zinc-700">
        <p>
          {t("check_in")}:{" "}
          <span className="font-medium">{formatBookingDate(checkIn)}</span>
        </p>
        <p>
          {t("check_out")}:{" "}
          <span className="font-medium">{formatBookingDate(checkOut)}</span>
        </p>
        <p>
          {t("nights", { count: nights })} ({periodLabel})
        </p>
        <p>
          {t("total_rooms")}: {selectedRooms.length}
        </p>
        <p>
          {t("total")}:{" "}
          <span className="font-semibold">
            {formatBookingCurrency(totalPrice)}
          </span>
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 p-4">
        <h3 className="font-semibold text-zinc-900 mb-3">
          {t("rooms_and_prices")}
        </h3>
        <ul className="space-y-3 text-sm text-zinc-700">
          {selectedRooms.map((room) => (
            <li
              key={room.roomId}
              className="rounded-lg border border-zinc-200 bg-zinc-50 p-3"
            >
              <p className="font-semibold text-zinc-900">{room.roomName}</p>
              <p>{t("guests_count", { count: room.numberOfGuests })}</p>
              <p>
                {t("price_per_night_label")}:{" "}
                {formatBookingCurrency(room.pricePerNight)}
              </p>
              <p>
                {t("price_for_period")} ({periodLabel}):{" "}
                {/* Der Zeitraumpreis pro Zimmer wird fuer jedes ausgewaehlte Zimmer einheitlich angezeigt. */}
                {formatBookingCurrency(perRoomBreakdown.total)}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-zinc-200 p-4 text-sm text-zinc-700 space-y-2">
        {/* getValues liest einen Snapshot fuer die Zusammenfassung ohne zusaetzliche Subscriptions. */}
        <h3 className="font-semibold text-zinc-900">
          {t("price_breakdown_period")}
        </h3>
        <p>
          {t("months_label")}: {perRoomBreakdown.months}
        </p>
        <p>
          {t("weeks_label")}: {perRoomBreakdown.weeks}
        </p>
        <p>
          {t("nights_label")}: {perRoomBreakdown.nights}
        </p>
        <p>
          {t("price_per_room_total")}:{" "}
          {formatBookingCurrency(perRoomBreakdown.total)}
        </p>
        <p className="font-semibold">
          {t("total")}: {formatBookingCurrency(totalPrice)}
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 p-4 text-sm text-zinc-700 space-y-1">
        <p>
          {t("company")}:{" "}
          <span className="font-medium">{form.getValues("company")}</span>
        </p>
        <p>
          {t("contact_person")}:{" "}
          <span className="font-medium">{form.getValues("guestName")}</span>
        </p>
        <p>
          {t("guest_email")}:{" "}
          <span className="font-medium">{form.getValues("guestEmail")}</span>
        </p>
        <p>
          {t("guest_phone")}:{" "}
          <span className="font-medium">{form.getValues("guestPhone")}</span>
        </p>
        {form.getValues("message") && (
          <div className="pt-2">
            <p className="font-medium text-zinc-900">{t("message")}</p>
            <p className="mt-1 whitespace-pre-wrap">
              {form.getValues("message")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
