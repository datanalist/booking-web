import { ChatPaperclipIcon } from "./ChatPaperclipIcon";
import { useComposerTextareaHeight } from "./useComposerTextareaHeight";

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
  const textareaRef = useComposerTextareaHeight(text);

  return (
    <div className="flex min-w-0 flex-1 items-end overflow-hidden rounded-3xl border border-[rgba(251,192,40,0.17)] bg-white p-3">
      <div className="flex min-w-0 flex-1 items-end gap-3">
        <button
          type="button"
          className="mb-[1px] shrink-0"
          aria-label="Прикрепить фото"
          onClick={onPickFile}
        >
          <ChatPaperclipIcon />
        </button>
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          placeholder="Напишите сообщение..."
          className="max-h-[120px] min-h-[20px] min-w-0 flex-1 resize-none overflow-x-hidden overflow-y-auto whitespace-pre-wrap bg-transparent text-[14px] font-normal leading-[1.4] text-[#1a1b1d] outline-none [overflow-wrap:anywhere] placeholder:text-[#525353]"
        />
      </div>
    </div>
  );
}
