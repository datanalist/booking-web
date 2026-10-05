import { chatPhotoUrl } from "../../domain/ChatPhoto";
import { parseChatPhotoFile } from "../../domain/parseChatPhotoFile";
import type { ComposerAttachment } from "./ComposerAttachment";
import { revokePreview } from "./revokePreview";

/** Кладёт выбранный файл в черновик либо фиксирует причину отказа. */
export function attachSelectedFile(
  file: File,
  previewSlot: { current: string | null },
  setAttachment: (next: ComposerAttachment) => void,
): void {
  revokePreview(previewSlot);
  const parsed = parseChatPhotoFile({ mime: file.type, byteSize: file.size });
  switch (parsed.kind) {
    case "rejected":
      setAttachment({ kind: "rejected", reason: parsed.reason });
      return;
    case "accepted":
      acceptPhotoFile(file, previewSlot, setAttachment);
      return;
  }
}

function acceptPhotoFile(
  file: File,
  previewSlot: { current: string | null },
  setAttachment: (next: ComposerAttachment) => void,
): void {
  const previewUrl = URL.createObjectURL(file);
  const url = chatPhotoUrl(previewUrl);
  if (url === null) {
    URL.revokeObjectURL(previewUrl);
    setAttachment({ kind: "rejected", reason: "empty" });
    return;
  }
  previewSlot.current = previewUrl;
  setAttachment({
    kind: "ready",
    previewUrl,
    photo: { url, alt: "Прикреплённое фото" },
  });
}
