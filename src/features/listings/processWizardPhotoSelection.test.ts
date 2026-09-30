import { describe, expect, test, vi } from "vitest";
import { processWizardPhotoSelection } from "./processWizardPhotoSelection";

describe("processWizardPhotoSelection", () => {
  test("returns idle when all files compress and upload", async () => {
    const compress = vi.fn(async (file: File) => new Blob([file.name]));
    const upload = vi.fn(async (blob: Blob) => {
      const name = await blob.text();
      return `/data/ok-${name}`;
    });
    const result = await processWizardPhotoSelection(
      [
        new File(["1"], "1.jpg", { type: "image/jpeg" }),
        new File(["2"], "2.jpg", { type: "image/jpeg" }),
      ],
      0,
      compress,
      upload,
    );

    expect(result.addedPhotos).toEqual(["/data/ok-1.jpg", "/data/ok-2.jpg"]);
    expect(result.status).toEqual({ kind: "idle" });
  });

  test("returns error status but keeps good photos when one fails", async () => {
    const compress = vi.fn(async (file: File) => {
      if (file.name === "bad.jpg") {
        throw new Error("fail");
      }
      return new Blob([file.name]);
    });
    const upload = vi.fn(async (blob: Blob) => `/data/${await blob.text()}`);

    const result = await processWizardPhotoSelection(
      [
        new File(["1"], "good.jpg", { type: "image/jpeg" }),
        new File(["2"], "bad.jpg", { type: "image/jpeg" }),
        new File(["3"], "also.jpg", { type: "image/jpeg" }),
      ],
      0,
      compress,
      upload,
    );

    expect(result.addedPhotos).toEqual([
      "/data/good.jpg",
      "/data/also.jpg",
    ]);
    expect(result.status.kind).toBe("error");
    if (result.status.kind === "error") {
      expect(result.status.message).toContain("1 из 3");
    }
  });
});
