import { describe, expect, test, vi } from "vitest";
import { compressWizardPhotoFiles } from "./compressWizardPhotoFiles";

describe("compressWizardPhotoFiles", () => {
  test("keeps successful files when one compress fails", async () => {
    const compress = vi.fn(async (file: File) => {
      if (file.name === "bad.jpg") {
        throw new Error("boom");
      }
      return `data:image/jpeg;base64,${file.name}`;
    });

    const result = await compressWizardPhotoFiles(
      [
        new File(["a"], "a.jpg", { type: "image/jpeg" }),
        new File(["b"], "bad.jpg", { type: "image/jpeg" }),
        new File(["c"], "c.jpg", { type: "image/jpeg" }),
      ],
      compress,
    );

    expect(result.photos).toEqual([
      "data:image/jpeg;base64,a.jpg",
      "data:image/jpeg;base64,c.jpg",
    ]);
    expect(result.failedCount).toBe(1);
  });
});
