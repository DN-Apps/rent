"use client";

import { useEffect } from "react";

type LocaleErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function LocaleError({ error, reset }: LocaleErrorProps) {
  useEffect(() => {
    // Fehler fuer Debugging in der Konsole sichtbar halten und zugleich eine freundliche UI anzeigen.
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-red-900">
          Etwas ist schiefgelaufen
        </h1>
        <p className="mt-3 text-sm text-red-800">
          Die Seite konnte nicht korrekt geladen werden. Bitte versuchen Sie es
          erneut.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-lg bg-red-900 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
        >
          Erneut versuchen
        </button>
      </div>
    </main>
  );
}
