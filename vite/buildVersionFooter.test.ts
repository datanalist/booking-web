import { expect, test } from "vitest";
import { injectBuildVersionFooter } from "./buildVersionFooter.ts";

const html = `<!doctype html><html><body><div id="root"></div></body></html>`;

test("inserts the package version into the site footer", () => {
  const next = injectBuildVersionFooter(html, "0.0.2");

  expect(next).toContain('data-build-version="0.0.2"');
  expect(next).toContain("Сборка 0.0.2");
  expect(next.indexOf("data-build-version")).toBeLessThan(next.indexOf("</body>"));
});

test("does not duplicate the footer when the transform runs twice", () => {
  const once = injectBuildVersionFooter(html, "0.0.2");
  const twice = injectBuildVersionFooter(once, "0.0.3");

  expect(twice.match(/data-build-version/g)).toHaveLength(1);
  expect(twice).toContain("Сборка 0.0.2");
  expect(twice).not.toContain("0.0.3");
});
