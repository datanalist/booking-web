import type { ChatPhoto } from "../../domain/ChatPhoto";
import type { ChatPhotoRejectReason } from "../../domain/parseChatPhotoFile";

export type ComposerAttachment =
  | { readonly kind: "none" }
  | {
      readonly kind: "ready";
      readonly previewUrl: string;
      readonly photo: ChatPhoto;
    }
  | { readonly kind: "rejected"; readonly reason: ChatPhotoRejectReason };
