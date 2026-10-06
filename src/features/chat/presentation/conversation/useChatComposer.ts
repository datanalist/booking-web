import { useEffect, useRef, useState } from "react";
import { attachSelectedFile } from "./attachSelectedFile";
import type { ComposerAttachment } from "./ComposerAttachment";
import type { ComposerSend } from "./ComposerSend";
import { revokePreview } from "./revokePreview";
import { submitComposer } from "./submitComposer";

export function useChatComposer(onSend: (draft: ComposerSend) => void) {
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<ComposerAttachment>({ kind: "none" });
  const previewSlot = useRef<string | null>(null);

  useEffect(() => {
    const slot = previewSlot;
    return () => {
      revokePreview(slot);
    };
  }, []);

  const attachFile = (file: File) => {
    attachSelectedFile(file, previewSlot, setAttachment);
  };

  const clearAttachment = () => {
    revokePreview(previewSlot);
    setAttachment({ kind: "none" });
  };

  const submit = () => {
    submitComposer({ text, attachment, previewSlot, setText, setAttachment, onSend });
  };

  return { text, setText, attachment, attachFile, clearAttachment, submit };
}
