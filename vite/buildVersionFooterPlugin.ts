/** Единая причина изменения: футер берёт version из package.json и при dev, и при сборке. */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";
import { injectBuildVersionFooter } from "./buildVersionFooter.ts";

export function readPackageVersion(packageJsonPath: string): string {
  const parsed = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
    version?: unknown;
  };
  if (typeof parsed.version !== "string" || parsed.version.trim() === "") {
    throw new Error("В package.json нет version");
  }
  return parsed.version.trim();
}

export function buildVersionFooterPlugin(
  packageJsonPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../package.json",
  ),
): Plugin {
  return {
    name: "build-version-footer",
    transformIndexHtml: {
      order: "post",
      handler(html) {
        return injectBuildVersionFooter(html, readPackageVersion(packageJsonPath));
      },
    },
  };
}
