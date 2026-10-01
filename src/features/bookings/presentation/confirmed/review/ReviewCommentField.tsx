import { useId } from "react";
import { REVIEW_COMMENT_MAX_LENGTH } from "./reviewCommentMaxLength";

type ReviewCommentFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

export function ReviewCommentField({ value, onChange }: ReviewCommentFieldProps) {
  const fieldId = useId();
  return (
    <div className="flex w-full flex-col gap-1">
      <label htmlFor={fieldId} className="text-sm leading-5 text-neutral-600">
        Комментарий
      </label>
      <textarea
        id={fieldId}
        value={value}
        maxLength={REVIEW_COMMENT_MAX_LENGTH}
        placeholder="Здесь вы можете добавить комментарий"
        className="box-border h-40 w-full resize-none rounded-lg bg-amber-400/5 px-3.5 py-2.5 font-sans text-base leading-6 text-black outline outline-1 outline-offset-[-1px] outline-amber-400/20 placeholder:text-neutral-600 focus:outline-amber-400/40"
        onChange={(event) => onChange(event.target.value)}
      />
      <span className="self-end text-xs leading-4 text-neutral-600">
        {value.length}/{REVIEW_COMMENT_MAX_LENGTH}
      </span>
    </div>
  );
}
