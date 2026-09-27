import { describe, expect, test } from "vitest";
import { reorderPhotos } from "./reorderPhotos";

describe("reorderPhotos", () => {
  test("moves item forward and backward", () => {
    expect(reorderPhotos(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
    expect(reorderPhotos(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
  });

  test("returns copy when indices invalid or equal", () => {
    const photos = ["a", "b"];
    expect(reorderPhotos(photos, 1, 1)).toEqual(["a", "b"]);
    expect(reorderPhotos(photos, -1, 0)).toEqual(["a", "b"]);
    expect(reorderPhotos(photos, 0, 5)).toEqual(["a", "b"]);
  });
});
