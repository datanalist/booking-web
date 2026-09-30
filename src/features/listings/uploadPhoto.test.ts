import { afterEach, describe, expect, test, vi } from "vitest";
import { parsePhotoUrl } from "./PhotoUrl";
import { uploadPhoto, PhotoUploadError } from "./uploadPhoto";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("uploadPhoto", () => {
  test("posts blob and returns branded PhotoUrl", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json(
        { url: "/data/550e8400-e29b-41d4-a716-446655440000.jpg" },
        { status: 201 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: "image/jpeg" });
    const url = await uploadPhoto(blob);

    expect(parsePhotoUrl(url)).toBe(url);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/files",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "image/jpeg" },
        body: blob,
      }),
    );
  });

  test("throws on non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 500 })),
    );

    await expect(
      uploadPhoto(new Blob(["x"], { type: "image/png" })),
    ).rejects.toBeInstanceOf(PhotoUploadError);
  });

  test("throws on invalid JSON body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ url: "http://evil.example/x.jpg" }, { status: 201 }),
      ),
    );

    await expect(
      uploadPhoto(new Blob(["x"], { type: "image/jpeg" })),
    ).rejects.toBeInstanceOf(PhotoUploadError);
  });
});
