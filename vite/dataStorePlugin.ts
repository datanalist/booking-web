import type { Plugin } from "vite";
import {
  createDataStoreMiddleware,
  type DataStoreMiddlewareOptions,
} from "./createDataStoreMiddleware.ts";

/** Vite-плагин: файловое хранилище фото в ./data для dev и preview. */
export function dataStorePlugin(
  options: DataStoreMiddlewareOptions = {},
): Plugin {
  const middleware = createDataStoreMiddleware(options);

  return {
    name: "data-store",
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}
