"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "privacyAccepted";

export default function PrivacyBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-900 text-white px-4 py-4 shadow-lg">
      <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-sm text-zinc-300 leading-snug">
          Diese Website verwendet keine Tracking-Cookies. Durch die weitere
          Nutzung stimmen Sie unseren{" "}
          <a href="#" className="underline hover:text-white">
            Datenschutzhinweisen
          </a>{" "}
          zu.
        </p>
        <button
          onClick={accept}
          className="shrink-0 rounded-lg bg-white text-zinc-900 px-4 py-2 text-sm font-semibold hover:bg-zinc-100 transition-colors"
        >
          Akzeptieren
        </button>
      </div>
    </div>
  );
}
