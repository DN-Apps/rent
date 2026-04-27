"use client";

import { useState } from "react";
import { HiX } from "react-icons/hi";

const impressum = `
Angaben gemäß § 5 TMG

Mustermann GmbH
Musterstraße 1
12345 Musterstadt

Telefon: +49 123 456789
E-Mail: info@example.de

Handelsregister: HRB 12345
Registergericht: Amtsgericht Musterstadt

Umsatzsteuer-ID: DE123456789
`.trim();

export default function Footer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <footer className="border-t border-zinc-200 bg-white mt-auto">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-zinc-500">
          <p>
            © {new Date().getFullYear()} Monteurzimmer. Alle Rechte vorbehalten.
          </p>
          <button
            onClick={() => setOpen(true)}
            className="underline hover:text-zinc-800 transition-colors"
          >
            Impressum
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
              aria-label="Schließen"
            >
              <HiX size={20} />
            </button>
            <h2 className="text-xl font-bold text-zinc-900 mb-4">Impressum</h2>
            <pre className="whitespace-pre-wrap text-sm text-zinc-700 font-sans leading-relaxed">
              {impressum}
            </pre>
          </div>
        </div>
      )}
    </>
  );
}
