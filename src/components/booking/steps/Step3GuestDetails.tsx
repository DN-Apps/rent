"use client";

import { useTranslations } from "next-intl";
import BookingSelectionSummary from "@/components/booking/BookingSelectionSummary";
import type { UseFormReturn } from "react-hook-form";
import type { BookingFormData, BookingRoomFormData } from "@/utils/validation";
import type { PriceBreakdown } from "@/utils/pricing";

type Step3GuestDetailsProps = {
  form: UseFormReturn<BookingFormData>;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  perRoomBreakdown: PriceBreakdown;
  selectedRooms: BookingRoomFormData[];
  totalPrice: number;
  includeInvoiceAddress: boolean;
  onInvoiceAddressToggle: (checked: boolean) => void;
  autofillCity: () => void | Promise<void>;
};

export default function Step3GuestDetails({
  form,
  checkIn,
  checkOut,
  nights,
  perRoomBreakdown,
  selectedRooms,
  totalPrice,
  includeInvoiceAddress,
  onInvoiceAddressToggle,
  autofillCity,
}: Step3GuestDetailsProps) {
  const t = useTranslations("booking");
  // Live-Watch versorgt den Nachrichten-Laengenzaehler.
  const message = form.watch("message");

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-zinc-900">{t("step3")}</h2>

      <BookingSelectionSummary
        checkIn={checkIn}
        checkOut={checkOut}
        nights={nights}
        perRoomBreakdown={perRoomBreakdown}
        selectedRooms={selectedRooms}
        totalPrice={totalPrice}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-zinc-600 mb-1">
            {t("company")}
          </label>
          <input
            {...form.register("company")}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <p className="text-xs text-red-600 mt-1">
            {form.formState.errors.company?.message}
          </p>
        </div>
        <div>
          <label className="block text-sm text-zinc-600 mb-1">
            {t("guest_name")}
          </label>
          <input
            {...form.register("guestName")}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <p className="text-xs text-red-600 mt-1">
            {form.formState.errors.guestName?.message}
          </p>
        </div>
        <div>
          <label className="block text-sm text-zinc-600 mb-1">
            {t("guest_email")}
          </label>
          <input
            type="email"
            {...form.register("guestEmail")}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <p className="text-xs text-red-600 mt-1">
            {form.formState.errors.guestEmail?.message}
          </p>
        </div>
        <div>
          <label className="block text-sm text-zinc-600 mb-1">
            {t("guest_phone")}
          </label>
          <input
            {...form.register("guestPhone")}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <p className="text-xs text-red-600 mt-1">
            {form.formState.errors.guestPhone?.message}
          </p>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm text-zinc-600 mb-1">
            {t("message")}
          </label>
          <textarea
            {...form.register("message")}
            rows={5}
            maxLength={500}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <div className="mt-1 flex items-center justify-between text-xs">
            <p className="text-red-600">
              {form.formState.errors.message?.message}
            </p>
            <p className="text-zinc-500">{message?.length ?? 0}/500</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 p-4">
        <h3 className="font-semibold text-zinc-900 mb-3">
          {t("guest_address")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm text-zinc-600 mb-1">
              {t("street")}
            </label>
            <input
              {...form.register("guestAddress.street")}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-600 mb-1">
              {t("zip")}
            </label>
            <input
              {...form.register("guestAddress.zip")}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-sm text-zinc-600 mb-1">
                {t("city")}
              </label>
              <input
                {...form.register("guestAddress.city")}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={autofillCity}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-medium hover:bg-zinc-50"
            >
              {t("zip_autofill")}
            </button>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm text-zinc-600 mb-1">
              {t("country")}
            </label>
            <input
              {...form.register("guestAddress.country")}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={includeInvoiceAddress}
            onChange={(event) => onInvoiceAddressToggle(event.target.checked)}
          />
          {t("invoice_address")}
        </label>
      </div>

      {/* Rechnungsfelder nur rendern, wenn eine separate Rechnungsadresse gewuenscht ist. */}
      {includeInvoiceAddress && (
        <div className="rounded-xl border border-zinc-200 p-4">
          <h3 className="font-semibold text-zinc-900 mb-3">
            {t("invoice_address_heading")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm text-zinc-600 mb-1">
                {t("street")}
              </label>
              <input
                {...form.register("invoiceAddress.street")}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-600 mb-1">
                {t("zip")}
              </label>
              <input
                {...form.register("invoiceAddress.zip")}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-600 mb-1">
                {t("city")}
              </label>
              <input
                {...form.register("invoiceAddress.city")}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm text-zinc-600 mb-1">
                {t("country")}
              </label>
              <input
                {...form.register("invoiceAddress.country")}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
