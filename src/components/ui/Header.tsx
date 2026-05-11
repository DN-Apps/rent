"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { HiMenu, HiX } from "react-icons/hi";

const locales = ["de", "en"] as const;

export default function Header() {
  const t = useTranslations("nav");
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Aktuelle Locale aus dem Pfad ermitteln
  const currentLocale =
    locales.find((l) => pathname.startsWith(`/${l}`)) ?? "de";

  function switchLocale(locale: string) {
    // Locale-Segment am Anfang des Pfads ersetzen
    const segments = pathname.split("/");
    segments[1] = locale;
    router.push(segments.join("/") || "/");
  }

  const navLinks = [
    { href: "/", label: t("home") },
    { href: "/rooms", label: t("rooms") },
    { href: "/booking", label: t("booking") },
    { href: "/contact", label: t("contact") },
  ];

  function localePath(path: string) {
    return `/${currentLocale}${path === "/" ? "" : path}`;
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-zinc-200 shadow-sm">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        {/* Logo */}
        <Link
          href={localePath("/")}
          className="text-lg font-bold text-zinc-900 tracking-tight"
        >
          Monteurzimmer
        </Link>

        {/* Desktop-Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={localePath(link.href)}
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Sprachumschalter + Burger */}
        <div className="flex items-center gap-3">
          {/* Sprachumschalter */}
          <div className="flex items-center gap-1 text-sm font-medium">
            {locales.map((locale) => (
              <button
                key={locale}
                onClick={() => switchLocale(locale)}
                className={`px-2 py-1 rounded transition-colors ${
                  currentLocale === locale
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {locale.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Mobiler Burger */}
          <button
            className="md:hidden p-2 text-zinc-600 hover:text-zinc-900"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menü öffnen"
          >
            {menuOpen ? <HiX size={22} /> : <HiMenu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobiles Menue */}
      {menuOpen && (
        <nav className="md:hidden border-t border-zinc-100 bg-white px-4 pb-4 pt-2 flex flex-col gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={localePath(link.href)}
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-sm font-medium text-zinc-700 hover:text-zinc-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
