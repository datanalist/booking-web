import type { Plugin } from "vite";
import { loadServerEnv } from "./loadServerEnv.ts";
import { createPaymentsMiddleware } from "./paymentsMiddleware.ts";

/** Dev и preview: создание платежа ЮKassa на том же origin, что и кабинет. */
export function paymentsPlugin(): Plugin {
  return {
    name: "payments",
    configureServer(server) {
      loadServerEnv();
      server.middlewares.use(createPaymentsMiddleware());
    },
    configurePreviewServer(server) {
      loadServerEnv();
      server.middlewares.use(createPaymentsMiddleware());
    },
  };
}
