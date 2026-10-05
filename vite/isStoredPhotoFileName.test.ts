import { describe, expect, test } from "vitest";
import { isStoredPhotoFileName } from "./isStoredPhotoFileName.ts";

describe("isStoredPhotoFileName", () => {
  test("accepts uuid with jpg/png/webp", () => {
    expect(
      isStoredPhotoFileName("550e8400-e29b-41d4-a716-446655440000.jpg"),
    ).toBe(true);
    expect(
      isStoredPhotoFileName("550e8400-e29b-41d4-a716-446655440000.png"),
    ).toBe(true);
    expect(
      isStoredPhotoFileName("550e8400-e29b-41d4-a716-446655440000.webp"),
    ).toBe(true);
  });

  test("rejects path traversal and nested paths", () => {
    expect(isStoredPhotoFileName("../x.jpg")).toBe(false);
    expect(isStoredPhotoFileName("a/b.jpg")).toBe(false);
    expect(isStoredPhotoFileName("a\\b.jpg")).toBe(false);
    expect(
      isStoredPhotoFileName("550e8400-e29b-41d4-a716-446655440000/../x.jpg"),
    ).toBe(false);
  });

  test("rejects non-uuid names", () => {
    expect(isStoredPhotoFileName("photo.jpg")).toBe(false);
    expect(isStoredPhotoFileName("not-a-uuid.png")).toBe(false);
    expect(isStoredPhotoFileName("550e8400-e29b-41d4-a716-446655440000.gif")).toBe(
      false,
    );
  });
});
