/** Единая причина изменения: на обложку попадает только текст, который прислал сервер. */
import { describe, expect, test } from "vitest";
import { paintCoverBadges, type CoverPaintLine } from "./paintCoverBadges";

test("рисует переданные плашки и не добавляет своих надписей", () => {
  const texts: string[] = [];
  const ctx = {
    font: "",
    fillStyle: "",
    textBaseline: "alphabetic",
    textAlign: "start",
    measureText: (text: string) => ({ width: text.length * 10 }),
    fillText: (text: string) => {
      texts.push(text);
    },
    beginPath: () => undefined,
    moveTo: () => undefined,
    arcTo: () => undefined,
    closePath: () => undefined,
    fill: () => undefined,
  } as unknown as CanvasRenderingContext2D;

  const lines: CoverPaintLine[] = [
    { text: "СТУДИЯ", role: "title" },
    { text: "ДЛЯ 2 ГОСТЕЙ", role: "detail" },
  ];
  paintCoverBadges(ctx, 800, lines);
  expect(texts).toEqual(["СТУДИЯ", "ДЛЯ 2 ГОСТЕЙ"]);
});

test("пустой список плашек ничего не пишет", () => {
  const texts: string[] = [];
  const ctx = {
    fillText: (text: string) => {
      texts.push(text);
    },
  } as unknown as CanvasRenderingContext2D;
  paintCoverBadges(ctx, 800, []);
  expect(texts).toEqual([]);
});
