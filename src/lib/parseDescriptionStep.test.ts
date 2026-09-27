import { expect, test } from "vitest";
import {
  isDescriptionStepComplete,
  parseDescriptionStep,
} from "./parseDescriptionStep";

const complete = {
  title: "Уютная студия в центре Москвы",
  address: "Москва, ул. Невская 48",
  housingType: "apartment",
  housingChosen: true,
  description: "Уютная студия в центре города.",
};

test("parseDescriptionStep returns values when complete", () => {
  const result = parseDescriptionStep(complete);
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.value.housingType).toBe("apartment");
    expect(result.value.title).toBe(complete.title);
  }
});

test("parseDescriptionStep requires housingChosen", () => {
  const result = parseDescriptionStep({ ...complete, housingChosen: false });
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.errors.housingType).toBeTruthy();
  }
});

test("isDescriptionStepComplete mirrors parse", () => {
  expect(isDescriptionStepComplete(complete)).toBe(true);
  expect(isDescriptionStepComplete({ ...complete, title: "  " })).toBe(false);
});
