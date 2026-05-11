"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { HiX } from "react-icons/hi";
import type { ImprintData } from "@/lib/imprint";

type FooterProps = {
  imprintData: ImprintData | null;
};

export default function Footer({ imprintData }: FooterProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("footer");

  const cityLine = [imprintData?.zip, imprintData?.city]
    .filter((value): value is string => Boolean(value))
    .join(" ");

  const imprintLines = [
    imprintData?.name,
    imprintData?.streetNumber,
    cityLine,
    imprintData?.phone
      ? `${t("imprint_phone_label")}: ${imprintData.phone}`
      : null,
    imprintData?.mail
      ? `${t("imprint_email_label")}: ${imprintData.mail}`
      : null,
  ].filter((line): line is string => Boolean(line && line.trim().length > 0));

  const imprintText =
    imprintLines.length > 0
      ? imprintLines.join("\n")
      : t("imprint_unavailable");

  return (
    <>
      <footer className="border-t border-zinc-200 bg-white mt-auto">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-zinc-500">
          <p>{t("copyright", { year: new Date().getFullYear() })}</p>
          <button
            onClick={() => setOpen(true)}
            className="underline hover:text-zinc-800 transition-colors"
          >
            {t("imprint_link")}
          </button>
        </div>
      </footer>

      {/* Impressum-Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-700 transition-colors"
              aria-label={t("close")}
            >
              <HiX size={20} />
            </button>
            <h2 className="text-xl font-bold text-zinc-900 mb-4">
              {t("imprint_title")}
            </h2>
            <pre className="whitespace-pre-wrap text-sm text-zinc-700 font-sans leading-relaxed">
              {imprintText}
            </pre>
          </div>
        </div>
      )}
    </>
  );
}
