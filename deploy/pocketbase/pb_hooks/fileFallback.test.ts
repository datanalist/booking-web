import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { describe, expect, test } from "vitest";

const source = fs.readFileSync(
  path.join(process.cwd(), "deploy/pocketbase/pb_hooks/fileFallback.js"),
  "utf8",
);
const sandbox: { module: { exports: Record<string, unknown> }; exports: Record<string, unknown> } = {
  module: { exports: {} },
  exports: {},
};
sandbox.exports = sandbox.module.exports;
vm.runInNewContext(source, sandbox);

const s3FallbackLocation = sandbox.module.exports.s3FallbackLocation as (
  baseUrl: string,
  key: string,
) => string;

const originalFileKey = sandbox.module.exports.originalFileKey as (servedPath: string) => string;

const BASE = "https://s3.example/bucket";

describe("originalFileKey", () => {
  test("обычный файл остаётся как есть", () => {
    expect(originalFileKey("pbc_1/rec1/cover.jpg")).toBe("pbc_1/rec1/cover.jpg");
  });

  test("миниатюра приводится к ключу оригинала", () => {
    expect(originalFileKey("pbc_1/rec1/thumbs_cover.jpg/100x100_cover.jpg")).toBe(
      "pbc_1/rec1/cover.jpg",
    );
  });

  test("неполный путь даёт пустую строку", () => {
    expect(originalFileKey("")).toBe("");
    expect(originalFileKey("pbc_1/rec1")).toBe("");
  });
});

describe("s3FallbackLocation", () => {
  test("собирает адрес из базы и ключа", () => {
    expect(s3FallbackLocation(BASE, "pbc_1/rec1/cover.jpg")).toBe(
      "https://s3.example/bucket/pbc_1/rec1/cover.jpg",
    );
  });

  test("убирает слэши в конце базы и кодирует имя файла", () => {
    expect(s3FallbackLocation(`${BASE}//`, "pbc_1/rec1/мой файл.jpg")).toBe(
      "https://s3.example/bucket/pbc_1/rec1/%D0%BC%D0%BE%D0%B9%20%D1%84%D0%B0%D0%B9%D0%BB.jpg",
    );
  });

  test("без базы или не http-адреса возвращает пустую строку", () => {
    expect(s3FallbackLocation("", "pbc_1/rec1/a.jpg")).toBe("");
    expect(s3FallbackLocation("ftp://x", "pbc_1/rec1/a.jpg")).toBe("");
  });

  test("отвергает неполный ключ и обход каталогов", () => {
    expect(s3FallbackLocation(BASE, "rec1/a.jpg")).toBe("");
    expect(s3FallbackLocation(BASE, "pbc_1/rec1/x/a.jpg")).toBe("");
    expect(s3FallbackLocation(BASE, "pbc_1/../a.jpg")).toBe("");
    expect(s3FallbackLocation(BASE, "pbc_1//a.jpg")).toBe("");
    expect(s3FallbackLocation(BASE, "pbc_1/rec1/a\\b.jpg")).toBe("");
  });
});
