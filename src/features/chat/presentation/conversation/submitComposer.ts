import type { ComposerAttachment } from "./ComposerAttachment";
import type { ComposerSend } from "./ComposerSend";

type SubmitComposerInput = {
  text: string;
  attachment: ComposerAttachment;
  previewSlot: { current: string | null };
  setText: (value: string) => void;
  setAttachment: (next: ComposerAttachment) => void;
  onSend: (draft: ComposerSend) => void;
};

/** Отправляет текст, фото или оба. Превью переходит в ленту без revoke. */
export function submitComposer(input: SubmitComposerInput): void {
  const body = input.text.trim();
  if (input.attachment.kind === "ready") {
    sendReadyDraft(input, body);
    return;
  }
  if (body.length === 0) {
    return;
  }
  input.onSend({ kind: "text", body });
  input.setText("");
  input.setAttachment({ kind: "none" });
}

function sendReadyDraft(input: SubmitComposerInput, body: string): void {
  if (input.attachment.kind !== "ready") {
    return;
  }
  input.previewSlot.current = null;
  if (body.length > 0) {
    input.onSend({ kind: "text", body });
  }
  input.onSend({ kind: "photo", photo: input.attachment.photo });
  input.setText("");
  input.setAttachment({ kind: "none" });
}
