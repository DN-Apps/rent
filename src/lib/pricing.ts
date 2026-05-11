// Re-Exports fuer Rueckwaertskompatibilitaet – massgeblich ist @/utils/pricing
export {
  PRICE_PER_NIGHT,
  PRICE_PER_WEEK,
  PRICE_PER_MONTH,
  calculateNightCount,
  calculateStayPrice,
} from "@/utils/pricing";
export type { PriceBreakdown } from "@/utils/pricing";
