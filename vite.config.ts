import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { dataStorePlugin } from "./vite/dataStorePlugin.ts";

export default defineConfig({
  plugins: [react(), tailwindcss(), dataStorePlugin()],
  build: { sourcemap: false },
  test: { environment: "jsdom", setupFiles: "./src/test-setup.ts" },
});
