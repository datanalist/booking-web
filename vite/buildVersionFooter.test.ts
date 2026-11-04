import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "vitest";
import { injectBuildVersionFooter } from "./buildVersionFooter.ts";
import { readPackageVersion } from "./buildVersionFooterPlugin.ts";

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

test("escapes <, quotes and ampersands in the version", () => {
  const next = injectBuildVersionFooter(html, `1<2>"3&`);

  expect(next).toContain("1&lt;2&gt;&quot;3&amp;");
  expect(next).not.toContain(`1<2>`);
  expect(next).not.toContain("position:fixed");
});

test("does not treat $& and $' in the version as replace patterns", () => {
  const next = injectBuildVersionFooter(html, "1.2.3 $& $' $$");

  expect(next).toContain("data-build-version=\"1.2.3 $&amp; $' $$\"");
  expect(next).toContain("Сборка 1.2.3 $&amp; $' $$");
  expect(next.match(/<\/body>/g)).toHaveLength(1);
  expect(next).not.toContain("</body>amp;");
  expect(next).not.toContain("$'</html>");
});

test("throws when the page has no body", () => {
  expect(() => injectBuildVersionFooter("<html></html>", "0.0.2")).toThrow(/<\/body>/);
});

test("readPackageVersion rejects an empty or invalid version", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "booking-version-"));
  const file = path.join(dir, "package.json");
  try {
    writeFileSync(file, JSON.stringify({ version: "" }));
    expect(() => readPackageVersion(file)).toThrow(/version/);
    writeFileSync(file, JSON.stringify({ version: "   " }));
    expect(() => readPackageVersion(file)).toThrow(/version/);
    writeFileSync(file, JSON.stringify({ version: 1 }));
    expect(() => readPackageVersion(file)).toThrow(/version/);
    writeFileSync(file, JSON.stringify({ name: "booking-web" }));
    expect(() => readPackageVersion(file)).toThrow(/version/);
    writeFileSync(file, JSON.stringify({ version: " 0.0.2 " }));
    expect(readPackageVersion(file)).toBe("0.0.2");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
