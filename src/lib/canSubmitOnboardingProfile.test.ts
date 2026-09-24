import { expect, test } from "vitest";
import { canSubmitOnboardingProfile } from "./canSubmitOnboardingProfile";

test("rejects short name and incomplete phone", () => {
  expect(canSubmitOnboardingProfile({ name: "А", phone: "+7" })).toBe(false);
  expect(canSubmitOnboardingProfile({ name: "Ан", phone: "+7 (900) 123-45" })).toBe(
    false,
  );
});

test("accepts trimmed name of 2+ and full local phone", () => {
  expect(
    canSubmitOnboardingProfile({ name: "  Анна  ", phone: "+7 (900) 123-45-67" }),
  ).toBe(true);
});

test("photo does not affect submit readiness", () => {
  expect(
    canSubmitOnboardingProfile({
      name: "Анна",
      phone: "+7 (900) 123-45-67",
      photo: undefined,
    }),
  ).toBe(true);
  expect(
    canSubmitOnboardingProfile({
      name: "Анна",
      phone: "+7 (900) 123-45-67",
      photo: "data:image/jpeg;base64,cropped",
    }),
  ).toBe(true);
});
