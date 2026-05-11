export const PRICE_PER_NIGHT = 20;
export const PRICE_PER_WEEK = 140;
export const PRICE_PER_MONTH = 400;

export type PriceBreakdown = {
  months: number;
  weeks: number;
  nights: number;
  total: number;
};

export function calculateNightCount(checkIn: Date, checkOut: Date): number {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  // Ceil behandelt Teil-Tages-Zeitstempel und rechnet trotzdem volle Naechte ab.
  const diff = Math.ceil((checkOut.getTime() - checkIn.getTime()) / MS_PER_DAY);
  return Math.max(0, diff);
}

export function calculateStayPrice(nightsCount: number): PriceBreakdown {
  // Preisberechnung nutzt greedy Zerlegung: Monate -> Wochen -> Restnaechte.
  const months = Math.floor(nightsCount / 30);
  const afterMonths = nightsCount % 30;
  const weeks = Math.floor(afterMonths / 7);
  const nights = afterMonths % 7;

  const total =
    months * PRICE_PER_MONTH +
    weeks * PRICE_PER_WEEK +
    nights * PRICE_PER_NIGHT;

  return { months, weeks, nights, total };
}
