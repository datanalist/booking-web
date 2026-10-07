import { useLayoutEffect, useRef } from "react";

/** Высота textarea по переносам, не шире плашки композера. */
export function useComposerTextareaHeight(text: string) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const field = ref.current;
    if (field === null) {
      return;
    }
    field.style.height = "auto";
    field.style.height = `${field.scrollHeight}px`;
  }, [text]);

  return ref;
}
