import { rub, type Rub } from "../../../../lib/money";

/** Reads the amount from a display label such as "15 460 ₽" (digits only; no digits → 0). */
export function parseRubLabel(label: string): Rub {
  const digits = label.replace(/\D/g, "");
  return rub(digits === "" ? 0 : Number(digits));
}
