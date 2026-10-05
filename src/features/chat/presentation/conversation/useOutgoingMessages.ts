import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "../../domain/ChatMessage";
import type { ComposerSend } from "./ComposerSend";
import { messageFromComposerSend } from "./messageFromComposerSend";

export function useOutgoingMessages(): {
  outgoing: readonly ChatMessage[];
  send: (draft: ComposerSend) => void;
} {
  const [outgoing, setOutgoing] = useState<readonly ChatMessage[]>([]);
  const ownedUrls = useRef<string[]>([]);

  useEffect(() => {
    const bucket = ownedUrls;
    return () => {
      bucket.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

  const send = (draft: ComposerSend) => {
    const message = messageFromComposerSend(draft, new Date());
    rememberPhotoUrl(message, ownedUrls);
    setOutgoing((current) => [...current, message]);
  };

  return { outgoing, send };
}

function rememberPhotoUrl(
  message: ChatMessage,
  ownedUrls: { current: string[] },
): void {
  switch (message.kind) {
    case "text":
      return;
    case "photo":
      ownedUrls.current = [...ownedUrls.current, message.photo.url];
      return;
  }
}
