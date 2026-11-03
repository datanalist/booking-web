/** Единая причина изменения: апскейл фото в dev и preview на том же origin, что и кабинет. */
import type { Plugin } from "vite";
import { loadServerEnv } from "./loadServerEnv.ts";
import { createUpscalePhotoMiddleware } from "./upscalePhotoMiddleware.ts";

export function upscalePhotoPlugin(): Plugin {
  return {
    name: "upscale-photo",
    configureServer(server) {
      loadServerEnv();
      server.middlewares.use(createUpscalePhotoMiddleware());
    },
    configurePreviewServer(server) {
      loadServerEnv();
      server.middlewares.use(createUpscalePhotoMiddleware());
    },
  };
}
