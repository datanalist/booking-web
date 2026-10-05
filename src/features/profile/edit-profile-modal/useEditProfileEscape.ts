import { useEffect } from "react";

type UseEditProfileEscapeArgs = {
  open: boolean;
  cropSource: string | undefined;
  onClose: () => void;
  onCancelCrop: () => void;
};

export function useEditProfileEscape({
  open,
  cropSource,
  onClose,
  onCancelCrop,
}: UseEditProfileEscapeArgs): void {
  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key !== "Escape") {
        return;
      }
      event.preventDefault();
      if (cropSource !== undefined) {
        onCancelCrop();
        return;
      }
      onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, cropSource, onClose, onCancelCrop]);
}
