"use client";

import { useTranslations } from "next-intl";
import BookingSelectionSummary from "@/components/booking/BookingSelectionSummary";
import type { Room } from "@/lib/directus";
import type { BookingRoomFormData } from "@/utils/validation";
import { formatBookingCurrency } from "@/utils/booking-display";
import type { PriceBreakdown } from "@/utils/pricing";

type Step2RoomsProps = {
  rooms: Room[];
  selectedRooms: BookingRoomFormData[];
  checkIn: Date;
  checkOut: Date;
  nights: number;
  perRoomBreakdown: PriceBreakdown;
  totalPrice: number;
  roomsError?: string;
  toggleRoom: (room: Room) => void;
};

export default function Step2Rooms({
  rooms,
  selectedRooms,
  checkIn,
  checkOut,
  nights,
  perRoomBreakdown,
  totalPrice,
  roomsError,
  toggleRoom,
}: Step2RoomsProps) {
  const t = useTranslations("booking");

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-900">{t("step2")}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {rooms.map((room) => {
          const selected = selectedRooms.find((r) => r.roomId === room.id);
          // Verfuegbarkeitsstatus steuert sowohl Badge-Text als auch Button-Interaktivitaet.
          const isUnavailable = !room.available;
          return (
            <article
              key={room.id}
              className={`rounded-xl border p-4 ${
                selected
                  ? "border-zinc-900 bg-zinc-50"
                  : "border-zinc-200 bg-white"
              }`}
            >
              <h3 className="font-semibold text-zinc-900">{room.name}</h3>
              <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                {room.description}
              </p>
              <p className="mt-3 text-sm font-medium text-zinc-700">
                {formatBookingCurrency(Number(room.price_per_night))}{" "}
                {t("price_per_night_suffix")}
              </p>
              {isUnavailable && (
                <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  {t("currently_unavailable")}
                </p>
              )}
              <button
                type="button"
                onClick={() => toggleRoom(room)}
                disabled={isUnavailable}
                className={`mt-3 w-full rounded-lg px-3 py-2 text-sm font-semibold ${
                  isUnavailable
                    ? "cursor-not-allowed bg-zinc-200 text-zinc-500"
                    : selected
                      ? "bg-zinc-900 text-white"
                      : "border border-zinc-300 text-zinc-800 hover:bg-zinc-50"
                }`}
              >
                {isUnavailable
                  ? t("currently_unavailable")
                  : selected
                    ? t("selected")
                    : t("choose_room")}
              </button>

              {selected && (
                <div className="mt-3">
                  <label className="block text-xs text-zinc-500 mb-1">
                    {t("number_of_guests")}
                  </label>
                  {/* Die Gaesteanzahl ist per Business-Regel fest auf 1 gesetzt. */}
                  <input
                    type="number"
                    min={1}
                    max={1}
                    value={selected.numberOfGuests}
                    readOnly
                    disabled
                    className="w-full rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-2 text-sm text-zinc-500"
                  />
                </div>
              )}
            </article>
          );
        })}
      </div>

      {roomsError && <p className="text-sm text-red-600">{roomsError}</p>}

      <BookingSelectionSummary
        checkIn={checkIn}
        checkOut={checkOut}
        nights={nights}
        perRoomBreakdown={perRoomBreakdown}
        selectedRooms={selectedRooms}
        totalPrice={totalPrice}
      />
    </div>
  );
}
