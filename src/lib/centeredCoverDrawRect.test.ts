import { expect, test } from "vitest";
import { centeredCoverDrawRect } from "./centeredCoverDrawRect";

test("square image at scale 1 fills the output", () => {
  expect(centeredCoverDrawRect({ width: 100, height: 100 }, 50, 1)).toEqual({
    dx: 0,
    dy: 0,
    dw: 50,
    dh: 50,
  });
});

test("wide image covers height and centers horizontally", () => {
  expect(centeredCoverDrawRect({ width: 200, height: 100 }, 100, 1)).toEqual({
    dx: -50,
    dy: 0,
    dw: 200,
    dh: 100,
  });
});

test("scale 2 zooms around the center", () => {
  expect(centeredCoverDrawRect({ width: 100, height: 100 }, 50, 2)).toEqual({
    dx: -25,
    dy: -25,
    dw: 100,
    dh: 100,
  });
});

test("offset shifts the draw rect within cover bounds", () => {
  expect(
    centeredCoverDrawRect({ width: 100, height: 100 }, 50, 2, { x: 10, y: -5 }),
  ).toEqual({
    dx: -15,
    dy: -30,
    dw: 100,
    dh: 100,
  });
});

test("offset beyond max is clamped", () => {
  expect(
    centeredCoverDrawRect({ width: 100, height: 100 }, 50, 2, {
      x: 100,
      y: -100,
    }),
  ).toEqual({
    dx: 0,
    dy: -50,
    dw: 100,
    dh: 100,
  });
});
