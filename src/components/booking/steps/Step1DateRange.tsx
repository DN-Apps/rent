"use client";

import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import type { BookingFormData } from "@/utils/validation";
import {
  formatBookingCurrency,
  formatBookingDate,
  formatPeriodLabel,
} from "@/utils/booking-display";
import type { PriceBreakdown } from "@/utils/pricing";

type Step1DateRangeProps = {
  form: UseFormReturn<BookingFormData>;
  dateRange: { from: Date; to: Date };
  nights: number;
  perRoomBreakdown: PriceBreakdown;
};

export default function Step1DateRange({
  form,
  dateRange,
  nights,
  perRoomBreakdown,
}: Step1DateRangeProps) {
  const t = useTranslations("booking");
  const periodLabel = formatPeriodLabel(perRoomBreakdown);
  // Merkt sich, welche Grenze (von/bis) der naechste Kalenderklick aktualisiert.
  const [nextPickerTarget, setNextPickerTarget] = useState<"from" | "to">(
    "from",
  );
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function addDays(value: Date, days: number): Date {
    const next = new Date(value);
    next.setDate(next.getDate() + days);
    return next;
  }

  function normalizeDate(value: Date): Date {
    const normalized = new Date(value);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }

  function toLocalCalendarDate(value: Date): Date {
    const base = value instanceof Date ? value : new Date(value);
    return new Date(base.getFullYear(), base.getMonth(), base.getDate());
  }

  const selectedFrom = normalizeDate(
    toLocalCalendarDate(new Date(dateRange.from)),
  );
  const selectedTo = normalizeDate(toLocalCalendarDate(new Date(dateRange.to)));
  const selectedRange =
    selectedTo > selectedFrom
      ? { from: selectedFrom, to: selectedTo }
      : // Gueltigen Mindestzeitraum von 1 Nacht sichern, falls Datumswerte gleich/ungueltig werden.
        { from: selectedFrom, to: addDays(selectedFrom, 1) };

  function setFromDate(fromDate: Date) {
    const normalizedFrom = normalizeDate(fromDate);
    const currentTo = selectedRange.to;
    const nextTo =
      currentTo > normalizedFrom ? currentTo : addDays(normalizedFrom, 1);

    form.setValue("checkIn", normalizedFrom, { shouldValidate: true });
    form.setValue("checkOut", nextTo, { shouldValidate: true });
  }

  function setToDate(toDate: Date) {
    const normalizedTo = normalizeDate(toDate);
    const currentFrom = selectedRange.from;

    // Wenn "bis" vor/gleich "von" liegt, den Zeitraum um 1 Nacht nach vorn schieben.
    if (normalizedTo > currentFrom) {
      form.setValue("checkOut", normalizedTo, { shouldValidate: true });
      return;
    }

    form.setValue("checkIn", normalizedTo, { shouldValidate: true });
    form.setValue("checkOut", addDays(normalizedTo, 1), {
      shouldValidate: true,
    });
  }

  function formatDateForInput(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function parseInputDate(value: string): Date | null {
    if (!value) return null;
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-900">{t("step1")}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <label className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
          <p className="text-zinc-500 mb-2">{t("from")}</p>
          <input
            type="date"
            value={formatDateForInput(selectedRange.from)}
            min={formatDateForInput(today)}
            onChange={(event) => {
              const parsed = parseInputDate(event.target.value);
              if (!parsed) return;
              setFromDate(parsed);
              setNextPickerTarget("to");
            }}
            className="block w-full max-w-full min-w-0 box-border appearance-none rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
          <p className="text-zinc-500 mb-2">{t("to")}</p>
          <input
            type="date"
            value={formatDateForInput(selectedRange.to)}
            min={formatDateForInput(addDays(selectedRange.from, 1))}
            onChange={(event) => {
              const parsed = parseInputDate(event.target.value);
              if (!parsed) return;
              setToDate(parsed);
              setNextPickerTarget("from");
            }}
            className="block w-full max-w-full min-w-0 box-border appearance-none rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
          <p className="text-zinc-500">{t("from")}</p>
          <p className="font-semibold text-zinc-900">
            {formatBookingDate(selectedRange.from)}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
          <p className="text-zinc-500">{t("to")}</p>
          <p className="font-semibold text-zinc-900">
            {formatBookingDate(selectedRange.to)}
          </p>
        </div>
      </div>

      <DayPicker
        mode="single"
        weekStartsOn={1}
        onDayClick={(selectedDate) => {
          const pickedDate = normalizeDate(selectedDate);
          if (pickedDate < today) return;

          // Klickziel zwischen Start- und Enddatum abwechseln fuer schnelle Bereichsauswahl.
          if (nextPickerTarget === "from") {
            setFromDate(pickedDate);
            setNextPickerTarget("to");
            return;
          }

          setToDate(pickedDate);
          setNextPickerTarget("from");
        }}
        disabled={{ before: today }}
        modifiers={{
          rangeStart: selectedRange.from,
          rangeEnd: selectedRange.to,
          rangeMiddle: {
            after: selectedRange.from,
            before: selectedRange.to,
          },
        }}
        modifiersStyles={{
          rangeStart: {
            backgroundColor: "#1d4ed8",
            color: "#ffffff",
            borderRadius: "9999px",
            fontWeight: 700,
          },
          rangeEnd: {
            backgroundColor: "#1d4ed8",
            color: "#ffffff",
            borderRadius: "9999px",
            fontWeight: 700,
          },
          rangeMiddle: {
            backgroundColor: "#e0e7ff",
            color: "#111827",
          },
          today: {
            backgroundColor: "transparent",
            color: "inherit",
            fontWeight: 400,
          },
        }}
        className="w-full max-w-full overflow-hidden rounded-xl border border-zinc-200 p-2 sm:p-4 [--rdp-day-width:2.15rem] [--rdp-day-height:2.15rem] [--rdp-day_button-width:2.15rem] [--rdp-day_button-height:2.15rem] sm:[--rdp-day-width:2.45rem] sm:[--rdp-day-height:2.45rem] sm:[--rdp-day_button-width:2.45rem] sm:[--rdp-day_button-height:2.45rem]"
      />
      <p className="text-xs text-zinc-500">
        {t("next_calendar_target", {
          target: nextPickerTarget === "from" ? t("from") : t("to"),
        })}
      </p>
      {form.formState.errors.checkOut && (
        <p className="text-sm text-red-600">
          {form.formState.errors.checkOut.message}
        </p>
      )}

      <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4 text-sm text-zinc-700">
        <p>{t("nights", { count: nights })}</p>
        <p>
          {t("price_per_room")}: {formatBookingCurrency(perRoomBreakdown.total)}{" "}
          ({periodLabel})
        </p>
      </div>
    </div>
  );
}
