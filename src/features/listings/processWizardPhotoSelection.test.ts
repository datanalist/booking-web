import { describe, expect, test, vi } from "vitest";
import { processWizardPhotoSelection } from "./processWizardPhotoSelection";

describe("processWizardPhotoSelection", () => {
  test("returns idle when all files compress", async () => {
    const compress = vi.fn(async (file: File) => `ok:${file.name}`);
    const result = await processWizardPhotoSelection(
      [
        new File(["1"], "1.jpg", { type: "image/jpeg" }),
        new File(["2"], "2.jpg", { type: "image/jpeg" }),
      ],
      0,
      compress,
    );

    expect(result.addedPhotos).toEqual(["ok:1.jpg", "ok:2.jpg"]);
    expect(result.status).toEqual({ kind: "idle" });
  });

  test("returns error status but keeps good photos when one fails", async () => {
    const compress = vi.fn(async (file: File) => {
      if (file.name === "bad.jpg") {
        throw new Error("fail");
      }
      return `ok:${file.name}`;
    });

    const result = await processWizardPhotoSelection(
      [
        new File(["1"], "good.jpg", { type: "image/jpeg" }),
        new File(["2"], "bad.jpg", { type: "image/jpeg" }),
        new File(["3"], "also.jpg", { type: "image/jpeg" }),
      ],
      0,
      compress,
    );

    expect(result.addedPhotos).toEqual(["ok:good.jpg", "ok:also.jpg"]);
    expect(result.status.kind).toBe("error");
    if (result.status.kind === "error") {
      expect(result.status.message).toContain("1 из 3");
    }
  });
});
