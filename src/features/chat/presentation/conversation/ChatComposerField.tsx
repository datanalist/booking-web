import { ChatPaperclipIcon } from "./ChatPaperclipIcon";

type ChatComposerFieldProps = {
  text: string;
  onTextChange: (value: string) => void;
  onPickFile: () => void;
};

export function ChatComposerField({
  text,
  onTextChange,
  onPickFile,
}: ChatComposerFieldProps) {
  return (
    <div className="flex min-w-0 flex-1 items-center overflow-hidden rounded-3xl border border-[rgba(251,192,40,0.17)] bg-white p-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          className="shrink-0"
          aria-label="Прикрепить фото"
          onClick={onPickFile}
        >
          <ChatPaperclipIcon />
        </button>
        <input
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          placeholder="Напишите сообщение..."
          className="min-w-0 flex-1 bg-transparent text-[14px] font-normal leading-[1.4] text-[#1a1b1d] outline-none placeholder:text-[#525353]"
        />
      </div>
    </div>
  );
}
