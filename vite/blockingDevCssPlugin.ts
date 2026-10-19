import type { Plugin } from "vite";
import { injectBlockingDevCss } from "./blockingDevCss.ts";

export function blockingDevCssPlugin(): Plugin {
  return {
    name: "blocking-dev-css",
    transformIndexHtml: {
      order: "post",
      handler(html, ctx) {
        if (!ctx.server) return html;
        return injectBlockingDevCss(html);
      },
    },
  };
}
