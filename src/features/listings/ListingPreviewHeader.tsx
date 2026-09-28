import { Pencil, Trash2 } from "lucide-react";
import type { ReactElement } from "react";
import { Button } from "../../ui/Button";
import { WizardBackButton } from "../../ui/WizardBackButton";

type ListingPreviewHeaderProps = {
  pending: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onSubmit: () => void;
};

/** Шапка предпросмотра: назад, заголовок, иконки, архив и модерация. */
export function ListingPreviewHeader({
  pending,
  onBack,
  onEdit,
  onDelete,
  onArchive,
  onSubmit,
}: ListingPreviewHeaderProps): ReactElement {
  return (
    <div className="flex w-full shrink-0 items-center justify-between gap-4">
      <div className="flex items-center gap-5">
        <WizardBackButton onClick={onBack} disabled={pending} />
        <h1 className="m-0 text-[24px] font-bold leading-[1.2] text-[var(--color-ink)]">
          Создание объявления
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Редактировать"
          disabled={pending}
          onClick={onEdit}
          className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-[30px] border border-solid border-[var(--color-accent)] bg-transparent p-2 text-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Pencil aria-hidden className="size-6" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          aria-label="Удалить"
          disabled={pending}
          onClick={onDelete}
          className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-[30px] border border-solid border-[var(--color-accent)] bg-transparent p-2 text-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 aria-hidden className="size-6" strokeWidth={1.75} />
        </button>
        <Button
          size="sm"
          variant="outlined"
          disabled={pending}
          onClick={onArchive}
        >
          Сохранить в архив
        </Button>
        <Button size="sm" disabled={pending} onClick={onSubmit}>
          Отправить на модерацию
        </Button>
      </div>
    </div>
  );
}
