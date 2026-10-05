import { describe, expect, test } from "vitest";
import { parsePhotoUrl } from "./PhotoUrl";

describe("parsePhotoUrl", () => {
  test("accepts /data/uuid.ext", () => {
    const url = parsePhotoUrl(
      "/data/550e8400-e29b-41d4-a716-446655440000.webp",
    );
    expect(url).toBe("/data/550e8400-e29b-41d4-a716-446655440000.webp");
  });

  test("rejects data-URL and foreign paths", () => {
    expect(parsePhotoUrl("data:image/jpeg;base64,aaa")).toBeNull();
    expect(parsePhotoUrl("/listings/cover.jpg")).toBeNull();
    expect(parsePhotoUrl("/data/../x.jpg")).toBeNull();
  });
});
