import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { blockingDevCssPlugin } from "./vite/blockingDevCssPlugin.ts";
import { dataStorePlugin } from "./vite/dataStorePlugin.ts";

export default defineConfig({
  plugins: [react(), tailwindcss(), blockingDevCssPlugin(), dataStorePlugin()],
  build: { sourcemap: false },
  test: { environment: "jsdom", setupFiles: "./src/test-setup.ts" },
});
