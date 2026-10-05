import type { ReactNode } from "react";
import type { ComposerAttachment } from "./ComposerAttachment";
import { ChatComposerPreview } from "./ChatComposerPreview";
import { chatPhotoRejectCopy } from "./chatPhotoRejectCopy";

export function ComposerAttachmentSlot({
  attachment,
  onRemove,
}: {
  attachment: ComposerAttachment;
  onRemove: () => void;
}): ReactNode {
  switch (attachment.kind) {
    case "none":
      return null;
    case "ready":
      return (
        <ChatComposerPreview
          previewUrl={attachment.previewUrl}
          onRemove={onRemove}
        />
      );
    case "rejected":
      return (
        <p role="alert" className="text-[12px] font-normal leading-[1.5] text-[#e34043]">
          {chatPhotoRejectCopy(attachment.reason)}
        </p>
      );
  }
}
