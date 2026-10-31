import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { blockingDevCssPlugin } from "./vite/blockingDevCssPlugin.ts";
import { dataStorePlugin } from "./vite/dataStorePlugin.ts";
import { paymentsPlugin } from "./vite/paymentsPlugin.ts";

export default defineConfig({
  plugins: [react(), tailwindcss(), blockingDevCssPlugin(), paymentsPlugin(), dataStorePlugin()],
  build: { sourcemap: false },
  test: { environment: "jsdom", setupFiles: "./src/test-setup.ts" },
});
