import { SERVICE_COMMISSION_RATE } from "../config";

export function commissionOf(base: number): number {
  return Math.round(base * SERVICE_COMMISSION_RATE);
}

export function clientPriceOf(base: number): number {
  return base + commissionOf(base);
}
