import { describe, expect, test, vi } from "vitest";
import { compressWizardPhotoFiles } from "./compressWizardPhotoFiles";

describe("compressWizardPhotoFiles", () => {
  test("keeps successful uploads when one file fails", async () => {
    const compress = vi.fn(async (file: File) => {
      if (file.name === "bad.jpg") {
        throw new Error("boom");
      }
      return new Blob([file.name], { type: "image/jpeg" });
    });
    const upload = vi.fn(async (blob: Blob) => {
      const text = await blob.text();
      return `/data/550e8400-e29b-41d4-a716-44665544000${text === "a.jpg" ? "1" : "2"}.jpg`;
    });

    const result = await compressWizardPhotoFiles(
      [
        new File(["a"], "a.jpg", { type: "image/jpeg" }),
        new File(["b"], "bad.jpg", { type: "image/jpeg" }),
        new File(["c"], "c.jpg", { type: "image/jpeg" }),
      ],
      compress,
      upload,
    );

    expect(result.photos).toEqual([
      "/data/550e8400-e29b-41d4-a716-446655440001.jpg",
      "/data/550e8400-e29b-41d4-a716-446655440002.jpg",
    ]);
    expect(result.failedCount).toBe(1);
    expect(upload).toHaveBeenCalledTimes(2);
  });
});
