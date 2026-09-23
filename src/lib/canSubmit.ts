import { validateStep } from "./wizardValidation";
import type { ListingDraft } from "../api/types";

export function firstInvalidStep(draft: ListingDraft): 1 | 2 | 3 | 4 | 5 | 6 | null {
  for (const step of [1, 2, 3, 4, 5, 6] as const) {
    if (Object.keys(validateStep(step, draft)).length > 0) {
      return step;
    }
  }
  return null;
}
