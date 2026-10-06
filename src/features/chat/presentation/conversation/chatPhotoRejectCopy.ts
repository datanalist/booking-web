import type { ChatPhotoRejectReason } from "../../domain/parseChatPhotoFile";

/** Текст отказа прикрепления — по причине разбора файла. */
export function chatPhotoRejectCopy(reason: ChatPhotoRejectReason): string {
  switch (reason) {
    case "unsupported-type":
      return "Можно прикрепить только изображение JPEG, PNG, WEBP или GIF";
    case "empty":
      return "Файл пустой";
    case "too-large":
      return "Изображение больше 10 МБ";
  }
}
