import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";
import { injectBlockingDevCss } from "../vite/blockingDevCss.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("app stylesheet does not wait on a remote import", () => {
  const css = readFileSync(resolve(root, "src/index.css"), "utf8");
  expect(css).not.toMatch(/@import\s+url\s*\(/);
});

test("source html does not link app css, dev server injects a blocking sheet", () => {
  const html = readFileSync(resolve(root, "index.html"), "utf8");

  expect(html).not.toContain('href="/src/index.css"');
  expect(html).toContain("fonts.googleapis.com/css2?family=Noto+Sans");
  expect(html).toContain('media="print"');

  const devHtml = injectBlockingDevCss(html);
  expect(devHtml).toContain('<link rel="stylesheet" href="/src/index.css" />');
  expect(injectBlockingDevCss(devHtml)).toBe(devHtml);
});
