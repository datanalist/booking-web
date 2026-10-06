import { useRef, type ChangeEvent, type FormEvent } from "react";
import type { ComposerSend } from "./ComposerSend";
import { ChatComposerField } from "./ChatComposerField";
import { ChatSendIcon } from "./ChatSendIcon";
import { ComposerAttachmentSlot } from "./ComposerAttachmentSlot";
import { useChatComposer } from "./useChatComposer";

export function ChatComposer({ onSend }: { onSend: (draft: ComposerSend) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const composer = useChatComposer(onSend);

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = chosenFile(event);
    if (file !== null) {
      composer.attachFile(file);
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    composer.submit();
  };

  return (
    <div className="flex w-full flex-col gap-3 px-5 py-6">
      <ComposerAttachmentSlot
        attachment={composer.attachment}
        onRemove={composer.clearAttachment}
      />
      <form className="flex w-full items-center gap-2" onSubmit={onSubmit}>
        <ChatComposerField
          text={composer.text}
          onTextChange={composer.setText}
          onPickFile={() => fileRef.current?.click()}
        />
        <button
          type="submit"
          aria-label="Отправить"
          className="flex size-10 shrink-0 items-center justify-center rounded-[30px] bg-accent"
        >
          <ChatSendIcon />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          aria-label="Файл фото"
          className="sr-only"
          onChange={onFileChange}
        />
      </form>
    </div>
  );
}

function chosenFile(event: ChangeEvent<HTMLInputElement>): File | null {
  const list = event.target.files;
  const file = list === null || list.length === 0 ? null : (list[0] ?? null);
  event.target.value = "";
  return file;
}
