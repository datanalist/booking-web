/** Единая причина изменения: dev-сервер отдаёт хуки улучшения фото и генерации обложки. */
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { blockingDevCssPlugin } from "./vite/blockingDevCssPlugin.ts";
import { dataStorePlugin } from "./vite/dataStorePlugin.ts";
import { generateCoverPlugin } from "./vite/generateCoverPlugin.ts";
import { paymentsPlugin } from "./vite/paymentsPlugin.ts";
import { upscalePhotoPlugin } from "./vite/upscalePhotoPlugin.ts";

export default defineConfig({
  plugins: [react(), tailwindcss(), blockingDevCssPlugin(), generateCoverPlugin(), paymentsPlugin(), upscalePhotoPlugin(), dataStorePlugin()],
  build: { sourcemap: false },
  test: { environment: "jsdom", setupFiles: "./src/test-setup.ts" },
});
