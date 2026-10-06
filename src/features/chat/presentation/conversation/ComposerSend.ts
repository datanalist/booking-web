import type { ChatPhoto } from "../../domain/ChatPhoto";

/** Что композер отдаёт в ленту после отправки. */
export type ComposerSend =
  | { readonly kind: "text"; readonly body: string }
  | { readonly kind: "photo"; readonly photo: ChatPhoto };
