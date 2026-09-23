import { expect, test } from "vitest";
import { firstInvalidStep } from "./canSubmit";
import { emptyDraft } from "./emptyDraft";

test("empty draft blocked at step 1", () => {
  expect(firstInvalidStep(emptyDraft("u1"))).toBe(1);
});
