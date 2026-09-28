import { expect, test } from "vitest";
import { listingPreviewGalleryTiles } from "./listingPreviewGalleryTiles";

test("empty photos yield null hero and no tiles", () => {
  expect(listingPreviewGalleryTiles([])).toEqual({ hero: null, tiles: [] });
});

test("single photo is hero only", () => {
  expect(listingPreviewGalleryTiles(["a.jpg"])).toEqual({
    hero: "a.jpg",
    tiles: [],
  });
});

test("two photos yield one thumb in the grid", () => {
  expect(listingPreviewGalleryTiles(["a.jpg", "b.jpg"])).toEqual({
    hero: "a.jpg",
    tiles: [{ kind: "photo", src: "b.jpg" }],
  });
});

test("four photos yield three thumbs without extra tile", () => {
  const result = listingPreviewGalleryTiles([
    "a.jpg",
    "b.jpg",
    "c.jpg",
    "d.jpg",
  ]);
  expect(result.tiles).toHaveLength(3);
  expect(result.tiles.every((tile) => tile.kind === "photo")).toBe(true);
});

test("five or more photos add +N overlay as fourth tile", () => {
  const result = listingPreviewGalleryTiles([
    "a.jpg",
    "b.jpg",
    "c.jpg",
    "d.jpg",
    "e.jpg",
    "f.jpg",
  ]);
  expect(result.tiles).toHaveLength(4);
  expect(result.tiles[3]).toEqual({
    kind: "extra",
    src: "e.jpg",
    count: 2,
  });
});
