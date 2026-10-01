import { describe, expect, test } from "vitest";
import { isWizardPhotosNextDisabled } from "./isWizardPhotosNextDisabled";

describe("isWizardPhotosNextDisabled", () => {
  test("blocks while save is pending", () => {
    expect(
      isWizardPhotosNextDisabled({
        photoCount: 6,
        minPhotos: 6,
        savePending: true,
      }),
    ).toBe(true);
  });

  test("blocks without minimum photos", () => {
    expect(
      isWizardPhotosNextDisabled({
        photoCount: 5,
        minPhotos: 6,
        savePending: false,
      }),
    ).toBe(true);
  });

  test("allows next when minimum photos already present", () => {
    expect(
      isWizardPhotosNextDisabled({
        photoCount: 6,
        minPhotos: 6,
        savePending: false,
      }),
    ).toBe(false);
  });
});
