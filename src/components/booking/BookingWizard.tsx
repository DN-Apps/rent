"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import "react-day-picker/dist/style.css";
import { useTranslations } from "next-intl";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import type { Room } from "@/lib/directus";
import { lookupCityByZip } from "@/lib/geolocation";
import {
  bookingSchema,
  type BookingFormData,
  type BookingRoomFormData,
} from "@/utils/validation";
import {
  calculateNightCount,
  calculateStayPrice,
  PRICE_PER_NIGHT,
} from "@/utils/pricing";
import Step1DateRange from "@/components/booking/steps/Step1DateRange";
import Step2Rooms from "@/components/booking/steps/Step2Rooms";
import Step3GuestDetails from "@/components/booking/steps/Step3GuestDetails";
import Step4Summary from "@/components/booking/steps/Step4Summary";

type BookingWizardProps = {
  rooms: Room[];
  preselectedRoomId?: string;
};

const STEPS = [1, 2, 3, 4] as const;

function getInitialSelectedRooms(
  rooms: Room[],
  preselectedRoomId?: string,
): BookingRoomFormData[] {
  const availableRooms = rooms.filter((room) => room.available);
  const selectedRoom =
    availableRooms.find((room) => room.id === preselectedRoomId) ??
    availableRooms[0] ??
    null;

  if (!selectedRoom) {
    return [];
  }

  return [
    {
      roomId: selectedRoom.id,
      roomName: selectedRoom.name,
      pricePerNight: Number(selectedRoom.price_per_night) || PRICE_PER_NIGHT,
      numberOfGuests: 1,
    },
  ];
}

export default function BookingWizard({
  rooms,
  preselectedRoomId,
}: BookingWizardProps) {
  const t = useTranslations("booking");
  const tCommon = useTranslations("common");
  const [step, setStep] = useState<(typeof STEPS)[number]>(1);
  const [includeInvoiceAddress, setIncludeInvoiceAddress] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [submitMessage, setSubmitMessage] = useState<string>("");
  const [submitWarning, setSubmitWarning] = useState<string>("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const turnstileRef = useRef<TurnstileInstance>(null);
  const [showTurnstile, setShowTurnstile] = useState(false);

  useEffect(() => {
    // Turnstile erst nach dem Rendern einbinden, damit die Containergroesse stabil gemessen wird.
    if (step === 4 && !isSubmitted) {
      const raf = requestAnimationFrame(() => setShowTurnstile(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setShowTurnstile(false);
    }
  }, [step, isSubmitted]);

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      checkIn: new Date(),
      checkOut: new Date(Date.now() + 1000 * 60 * 60 * 24),
      rooms: getInitialSelectedRooms(rooms, preselectedRoomId),
      company: "",
      guestName: "",
      guestEmail: "",
      guestPhone: "",
      message: "",
      guestAddress: {
        street: "",
        zip: "",
        city: "",
        country: "Deutschland",
      },
    },
    mode: "onBlur",
  });

  const checkIn = form.watch("checkIn");
  const checkOut = form.watch("checkOut");
  const selectedRooms = form.watch("rooms");
  const guestZip = form.watch("guestAddress.zip");
  const guestCountry = form.watch("guestAddress.country");

  const nights = useMemo(
    () => calculateNightCount(new Date(checkIn), new Date(checkOut)),
    [checkIn, checkOut],
  );

  const perRoomBreakdown = useMemo(() => calculateStayPrice(nights), [nights]);
  const totalPrice = perRoomBreakdown.total * selectedRooms.length;

  const dateRange = {
    from: checkIn,
    to: checkOut,
  };

  function toggleRoom(room: Room) {
    if (!room.available) {
      return;
    }

    const exists = selectedRooms.some((r) => r.roomId === room.id);

    if (exists) {
      form.setValue(
        "rooms",
        selectedRooms.filter((r) => r.roomId !== room.id),
        { shouldValidate: true },
      );
      return;
    }

    if (selectedRooms.length >= 3) {
      return;
    }

    form.setValue(
      "rooms",
      [
        ...selectedRooms,
        {
          roomId: room.id,
          roomName: room.name,
          pricePerNight: Number(room.price_per_night) || PRICE_PER_NIGHT,
          numberOfGuests: 1,
        },
      ],
      { shouldValidate: true },
    );
  }

  async function autofillCity() {
    if (!guestZip || !guestCountry) return;
    const city = await lookupCityByZip(guestZip, guestCountry);
    if (city) {
      form.setValue("guestAddress.city", city, { shouldValidate: true });
    }
  }

  async function nextStep() {
    if (step === 1) {
      const valid = await form.trigger(["checkIn", "checkOut"]);
      if (!valid) return;
      setStep(2);
      return;
    }

    if (step === 2) {
      if (selectedRooms.length === 0) {
        form.setError("rooms", {
          message: t("select_at_least_one_room"),
        });
        return;
      }
      form.clearErrors("rooms");
      setStep(3);
      return;
    }

    if (step === 3) {
      const baseFields: Array<
        | "company"
        | "guestName"
        | "guestEmail"
        | "guestPhone"
        | "message"
        | "guestAddress.street"
        | "guestAddress.zip"
        | "guestAddress.city"
        | "guestAddress.country"
      > = [
        "company",
        "guestName",
        "guestEmail",
        "guestPhone",
        "message",
        "guestAddress.street",
        "guestAddress.zip",
        "guestAddress.city",
        "guestAddress.country",
      ];

      const invoiceFields: Array<
        | "invoiceAddress.street"
        | "invoiceAddress.zip"
        | "invoiceAddress.city"
        | "invoiceAddress.country"
      > = [
        "invoiceAddress.street",
        "invoiceAddress.zip",
        "invoiceAddress.city",
        "invoiceAddress.country",
      ];

      const valid = await form.trigger(
        includeInvoiceAddress ? [...baseFields, ...invoiceFields] : baseFields,
      );
      if (!valid) return;
      setStep(4);
    }
  }

  function prevStep() {
    if (step > 1) {
      setStep((s) => (s - 1) as (typeof STEPS)[number]);
    }
  }

  function toggleInvoiceAddress(checked: boolean) {
    setIncludeInvoiceAddress(checked);
    if (!checked) {
      form.setValue("invoiceAddress", undefined, {
        shouldValidate: false,
      });
      return;
    }

    form.setValue(
      "invoiceAddress",
      {
        street: "",
        zip: "",
        city: "",
        country: "Deutschland",
      },
      { shouldValidate: false },
    );
  }

  function onSubmit(values: BookingFormData) {
    if (isSubmitted) {
      return;
    }

    setSubmitMessage("");
    setSubmitWarning("");

    if (!turnstileToken) {
      setSubmitMessage(t("captcha_required"));
      return;
    }

    const payload = {
      ...(includeInvoiceAddress
        ? values
        : { ...values, invoiceAddress: undefined }),
      turnstileToken,
    };

    startTransition(async () => {
      try {
        const res = await fetch("/api/booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const contentType = res.headers.get("content-type") ?? "";
        if (!contentType.includes("application/json")) {
          setSubmitMessage(t("request_failed"));
          return;
        }

        const result = (await res.json()) as
          | { success: true; bookingId: string; warning?: string }
          | { success: false; error: string };

        if (!res.ok) {
          setSubmitMessage(
            "error" in result ? result.error : t("request_failed"),
          );
          return;
        }

        if (result.success) {
          setIsSubmitted(true);
          setSubmitMessage(
            `${t("success_title")} (#${result.bookingId.slice(0, 8)})`,
          );
          setSubmitWarning(result.warning ?? "");
          return;
        }

        setSubmitMessage(result.error);
        turnstileRef.current?.reset();
        setTurnstileToken("");
      } catch {
        setSubmitMessage(t("request_failed"));
        turnstileRef.current?.reset();
        setTurnstileToken("");
      }
    });
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (step < 4) {
      void nextStep();
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm">
      <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 mb-6">
        {t("title")}
      </h1>

      <div className="mb-8">
        <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
          <div
            className="h-full bg-zinc-900 transition-all"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-zinc-500">
          {t("step_progress", { current: step, total: 4 })}
        </p>
      </div>

      {isSubmitted && submitMessage && (
        <div className="mb-8 rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-50 to-white px-5 py-5 shadow-sm ring-1 ring-emerald-100 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-lg font-bold text-white">
              ?
            </div>
            <div className="space-y-2">
              <p className="text-lg font-semibold text-emerald-950">
                {t("booking_sent_title")}
              </p>
              <p className="text-sm leading-6 text-emerald-900">
                {submitMessage}
              </p>
              <p className="text-sm leading-6 text-emerald-800">
                {t("booking_sent_copy")}
              </p>
              {submitWarning && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900">
                  {submitWarning}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-8">
        {step === 1 && (
          <Step1DateRange
            form={form}
            dateRange={dateRange}
            nights={nights}
            perRoomBreakdown={perRoomBreakdown}
          />
        )}

        {step === 2 && (
          <Step2Rooms
            rooms={rooms}
            selectedRooms={selectedRooms}
            checkIn={checkIn}
            checkOut={checkOut}
            nights={nights}
            perRoomBreakdown={perRoomBreakdown}
            totalPrice={totalPrice}
            roomsError={
              typeof form.formState.errors.rooms?.message === "string"
                ? form.formState.errors.rooms.message
                : undefined
            }
            toggleRoom={toggleRoom}
          />
        )}

        {step === 3 && (
          <Step3GuestDetails
            form={form}
            checkIn={checkIn}
            checkOut={checkOut}
            nights={nights}
            perRoomBreakdown={perRoomBreakdown}
            selectedRooms={selectedRooms}
            totalPrice={totalPrice}
            includeInvoiceAddress={includeInvoiceAddress}
            onInvoiceAddressToggle={toggleInvoiceAddress}
            autofillCity={autofillCity}
          />
        )}

        {step === 4 && (
          <Step4Summary
            checkIn={checkIn}
            checkOut={checkOut}
            nights={nights}
            perRoomBreakdown={perRoomBreakdown}
            totalPrice={totalPrice}
            selectedRooms={selectedRooms}
            form={form}
          />
        )}

        {showTurnstile && (
          <div className="pt-2 w-full">
            <Turnstile
              ref={turnstileRef}
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
              onSuccess={(token) => setTurnstileToken(token)}
              onExpire={() => setTurnstileToken("")}
              onError={() => setTurnstileToken("")}
              options={{ theme: "light", size: "flexible" }}
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-2">
          <div className="text-sm text-zinc-500 min-h-5">
            {isSubmitted ? t("booking_received") : submitMessage}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 1 || isPending}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 disabled:opacity-40"
            >
              {tCommon("back")}
            </button>

            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={isPending}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50"
              >
                {tCommon("next")}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  void form.handleSubmit(onSubmit)();
                }}
                disabled={isPending || isSubmitted}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50"
              >
                {isPending
                  ? tCommon("loading")
                  : isSubmitted
                    ? t("sent_successfully")
                    : t("submit")}
              </button>
            )}
          </div>
        </div>
      </form>
    </section>
  );
}
