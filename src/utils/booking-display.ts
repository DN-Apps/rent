import type { PriceBreakdown } from "@/utils/pricing";

export function formatBookingDate(date: Date): string {
  // Festes Locale-Format haelt die UI-Ausgabe auf allen Clients konsistent.
  return new Date(date).toLocaleDateString("de-DE");
}

export function formatBookingCurrency(value: number): string {
  return `${value.toFixed(2)} EUR`;
}

export function formatPeriodLabel(breakdown: PriceBreakdown): string {
  // Kompaktes Label wird in Karten, Zusammenfassung und E-Mails wiederverwendet.
  return `${breakdown.months}M / ${breakdown.weeks}W / ${breakdown.nights}N`;
}
