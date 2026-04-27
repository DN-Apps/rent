import { useTranslations } from "next-intl";
import type { BookingRoomFormData } from "@/utils/validation";
import type { PriceBreakdown } from "@/utils/pricing";
import {
  formatBookingCurrency,
  formatBookingDate,
} from "@/utils/booking-display";

type BookingSelectionSummaryProps = {
  checkIn: Date;
  checkOut: Date;
  nights: number;
  perRoomBreakdown: PriceBreakdown;
  selectedRooms: BookingRoomFormData[];
  totalPrice: number;
};

export default function BookingSelectionSummary({
  checkIn,
  checkOut,
  nights,
  perRoomBreakdown,
  selectedRooms,
  totalPrice,
}: BookingSelectionSummaryProps) {
  const t = useTranslations("booking");

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700 space-y-2">
      <p>
        {t("period")}: <span className="font-semibold">{t("from")}</span>{" "}
        {formatBookingDate(checkIn)}{" "}
        <span className="font-semibold">{t("to")}</span>{" "}
        {formatBookingDate(checkOut)}
      </p>
      <p>{t("nights", { count: nights })}</p>
      <p>
        {t("rooms")}: {selectedRooms.length}
      </p>
      {/* Zimmerzeilen nur bei Auswahl anzeigen, damit die Zusammenfassung kompakt bleibt. */}
      {selectedRooms.length > 0 && (
        <ul className="space-y-1">
          {selectedRooms.map((room) => (
            <li
              key={room.roomId}
              className="flex items-center justify-between gap-3"
            >
              <span>
                {room.roomName} (
                {t("guests_count", { count: room.numberOfGuests })})
              </span>
              <span className="font-medium">
                {/* Der Zeitraumpreis pro Zimmer ist fuer alle ausgewaehlten Zimmer identisch. */}
                {formatBookingCurrency(perRoomBreakdown.total)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p>
        {t("total")}:{" "}
        <span className="font-semibold">
          {formatBookingCurrency(totalPrice)}
        </span>
      </p>
    </div>
  );
}
