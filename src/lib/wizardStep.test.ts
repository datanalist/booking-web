import { expect, test } from "vitest";
import { parseStep } from "./wizardStep";

test("clamps step", () => {
  expect(parseStep("3")).toBe(3);
  expect(parseStep("9")).toBe(1);
  expect(parseStep(null)).toBe(1);
});
