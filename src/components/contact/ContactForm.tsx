"use client";

import { useState, useRef, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { lookupCityByZip } from "@/lib/geolocation";
import {
  contactSchema,
  type ContactFormData,
  type ContactFormInputData,
} from "@/utils/validation";

export default function ContactForm() {
  const t = useTranslations("contact");
  const tCommon = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string>("");
  const [feedbackType, setFeedbackType] = useState<"success" | "error" | null>(
    null,
  );
  const turnstileRef = useRef<TurnstileInstance>(null);

  const form = useForm<ContactFormInputData, undefined, ContactFormData>({
    resolver: zodResolver(contactSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      street: "",
      zip: "",
      city: "",
      message: "",
      turnstileToken: "",
    },
  });

  // Live-Watcher steuern dynamische UI-Hinweise ohne zusaetzlichen lokalen State.
  const zip = form.watch("zip");
  const message = form.watch("message");

  async function autofillCity() {
    if (!zip) return;
    const city = await lookupCityByZip(zip);
    if (city) {
      form.setValue("city", city, { shouldValidate: true });
    }
  }

  function onSubmit(values: ContactFormData) {
    setFeedback("");
    setFeedbackType(null);

    // Submit responsiv halten, waehrend asynchroner Request und Captcha-Reset laufen.
    startTransition(async () => {
      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });

        const contentType = res.headers.get("content-type") ?? "";
        // Defensiver Schutz gegen Nicht-JSON-Antworten vom Upstream.
        if (!contentType.includes("application/json")) {
          setFeedback("Request failed");
          setFeedbackType("error");
          turnstileRef.current?.reset();
          return;
        }

        const result = (await res.json()) as
          | { success: true }
          | { success: false; error: string };

        if (!res.ok) {
          // Backend-Fehlertext bevorzugen, wenn verfuegbar.
          setFeedback("error" in result ? result.error : "Request failed");
          setFeedbackType("error");
          turnstileRef.current?.reset();
          return;
        }

        if (result.success) {
          setFeedback(t("success"));
          setFeedbackType("success");
          // Formular und Captcha gemeinsam zuruecksetzen, um veraltete Tokens zu vermeiden.
          form.reset();
          turnstileRef.current?.reset();
          return;
        }

        setFeedback(result.error);
        setFeedbackType("error");
        turnstileRef.current?.reset();
      } catch {
        setFeedback("Request failed");
        setFeedbackType("error");
        turnstileRef.current?.reset();
      }
    });
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6">
      <h2 className="text-xl font-bold text-zinc-900 mb-4">{t("title")}</h2>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm text-zinc-600 mb-1">
            {t("name")}
          </label>
          <input
            {...form.register("name")}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <p className="text-xs text-red-600 mt-1">
            {form.formState.errors.name?.message}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-zinc-600 mb-1">
              {t("email")}
            </label>
            <input
              type="email"
              {...form.register("email")}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
            <p className="text-xs text-red-600 mt-1">
              {form.formState.errors.email?.message}
            </p>
          </div>
          <div>
            <label className="block text-sm text-zinc-600 mb-1">
              {t("phone")}
            </label>
            <input
              {...form.register("phone")}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
            <p className="text-xs text-red-600 mt-1">
              {form.formState.errors.phone?.message}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm text-zinc-600 mb-1">
            {t("street")}
          </label>
          <input
            {...form.register("street")}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <p className="text-xs text-red-600 mt-1">
            {form.formState.errors.street?.message}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-zinc-600 mb-1">
              {t("zip")}
            </label>
            <input
              {...form.register("zip")}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
            <p className="text-xs text-red-600 mt-1">
              {form.formState.errors.zip?.message}
            </p>
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-sm text-zinc-600 mb-1">
                {t("city")}
              </label>
              <input
                {...form.register("city")}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={autofillCity}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-medium hover:bg-zinc-50"
            >
              PLZ Autofill
            </button>
          </div>
        </div>
        <p className="text-xs text-red-600 -mt-2">
          {form.formState.errors.city?.message}
        </p>

        <div>
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

        <div className="w-full">
          <Turnstile
            ref={turnstileRef}
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
            onSuccess={(token) => {
              form.setValue("turnstileToken", token, { shouldValidate: true });
            }}
            onExpire={() => {
              form.setValue("turnstileToken", "", { shouldValidate: true });
            }}
            onError={() => {
              form.setValue("turnstileToken", "", { shouldValidate: true });
            }}
            options={{ theme: "light", size: "flexible" }}
          />
          {/* Validierungsfeedback spiegelt den Token-Status aus den Turnstile-Callbacks wider. */}
          {form.formState.errors.turnstileToken && (
            <p className="text-xs text-red-600 mt-1">
              {form.formState.errors.turnstileToken.message}
            </p>
          )}
        </div>

        <div className="space-y-3 pt-2">
          {feedbackType === "success" && feedback && (
            <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-emerald-900">
              <p className="text-sm font-semibold">{t("success_title")}</p>
              <p className="text-sm mt-1">{feedback}</p>
            </div>
          )}
          {feedbackType === "error" && feedback && (
            <p className="text-sm font-medium text-red-600">{feedback}</p>
          )}

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50"
            >
              {isPending ? tCommon("loading") : t("submit")}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
