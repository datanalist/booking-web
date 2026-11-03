/** Единая причина изменения: dev и preview принимают генерацию обложки на том же origin, что и кабинет. */
import type { Plugin } from "vite";
import { createGenerateCoverMiddleware } from "./generateCoverMiddleware.ts";
import { loadServerEnv } from "./loadServerEnv.ts";

export function generateCoverPlugin(): Plugin {
  return {
    name: "generate-cover",
    configureServer(server) {
      loadServerEnv();
      server.middlewares.use(createGenerateCoverMiddleware());
    },
    configurePreviewServer(server) {
      loadServerEnv();
      server.middlewares.use(createGenerateCoverMiddleware());
    },
  };
}
