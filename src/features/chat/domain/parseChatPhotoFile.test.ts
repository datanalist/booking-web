import { describe, expect, test } from "vitest";
import {
  CHAT_PHOTO_MAX_BYTES,
  parseChatPhotoFile,
} from "./parseChatPhotoFile";

describe("parseChatPhotoFile", () => {
  test("принимает png в пределах лимита и возвращает проверенный mime", () => {
    const parsed = parseChatPhotoFile({ mime: "image/png", byteSize: 128 });
    expect(parsed).toEqual({ kind: "accepted", mime: "image/png" });
  });

  test("отклоняет не-изображение", () => {
    const parsed = parseChatPhotoFile({ mime: "application/pdf", byteSize: 128 });
    expect(parsed).toEqual({ kind: "rejected", reason: "unsupported-type" });
  });

  test("отклоняет пустой файл", () => {
    const parsed = parseChatPhotoFile({ mime: "image/jpeg", byteSize: 0 });
    expect(parsed).toEqual({ kind: "rejected", reason: "empty" });
  });

  test("отклоняет файл больше 10 МБ", () => {
    const parsed = parseChatPhotoFile({
      mime: "image/webp",
      byteSize: CHAT_PHOTO_MAX_BYTES + 1,
    });
    expect(parsed).toEqual({ kind: "rejected", reason: "too-large" });
  });
});
