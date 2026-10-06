import type { ReactNode } from "react";
import type { MessageAuthor } from "../../domain/MessageAuthor";
import { ChatMessageAvatar } from "./ChatMessageAvatar";

type ChatMessageAvatarSlotProps = {
  author: MessageAuthor;
  slot: "leading" | "trailing";
  selfAvatarUrl: string;
  peerAvatarUrl: string;
};

/** Аватар только с внешней стороны пузыря: слева у собеседника, справа у себя. */
export function ChatMessageAvatarSlot({
  author,
  slot,
  selfAvatarUrl,
  peerAvatarUrl,
}: ChatMessageAvatarSlotProps): ReactNode {
  switch (author) {
    case "peer":
      return slot === "leading" ? <ChatMessageAvatar url={peerAvatarUrl} /> : null;
    case "self":
      return slot === "trailing" ? <ChatMessageAvatar url={selfAvatarUrl} /> : null;
  }
}
