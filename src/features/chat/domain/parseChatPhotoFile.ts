export const CHAT_PHOTO_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export type ChatPhotoMime = (typeof CHAT_PHOTO_MIMES)[number];

/** Верхняя граница вложения, 10 МиБ. */
export const CHAT_PHOTO_MAX_BYTES = 10 * 1024 * 1024;

export type ChatPhotoRejectReason = "unsupported-type" | "empty" | "too-large";

export type ChatPhotoFileInput = {
  readonly mime: string;
  readonly byteSize: number;
};

export type ParsedChatPhotoFile =
  | { readonly kind: "accepted"; readonly mime: ChatPhotoMime }
  | { readonly kind: "rejected"; readonly reason: ChatPhotoRejectReason };

function isChatPhotoMime(mime: string): mime is ChatPhotoMime {
  return (CHAT_PHOTO_MIMES as readonly string[]).includes(mime);
}

/** Разбирает метаданные файла. Успех несёт проверенный MIME, отказ — причину. */
export function parseChatPhotoFile(input: ChatPhotoFileInput): ParsedChatPhotoFile {
  if (input.byteSize <= 0) {
    return { kind: "rejected", reason: "empty" };
  }
  if (!isChatPhotoMime(input.mime)) {
    return { kind: "rejected", reason: "unsupported-type" };
  }
  if (input.byteSize > CHAT_PHOTO_MAX_BYTES) {
    return { kind: "rejected", reason: "too-large" };
  }
  return { kind: "accepted", mime: input.mime };
}
