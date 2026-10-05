import { Pencil, Trash2 } from "lucide-react";
import type { ReactElement } from "react";
import { Button } from "../../ui/Button";
import { WizardBackButton } from "../../ui/WizardBackButton";
import { listingPreviewActionsByStatus } from "./listingPreviewActionsByStatus";
import { ListingPreviewIconButton } from "./ListingPreviewIconButton";
import type { ListingTableStatus } from "./listingTableStatus";

type ListingPreviewHeaderProps = {
  status: ListingTableStatus;
  pending: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onSubmit: () => void;
  onUnpublish: () => void;
  onPublish: () => void;
  /** Заглушка: позже подключат алерт календаря бронирования. */
  onOpenBookingCalendar: () => void;
};

/** Шапка предпросмотра: набор кнопок зависит от статуса объявления. */
export function ListingPreviewHeader({
  status,
  pending,
  onBack,
  onEdit,
  onDelete,
  onArchive,
  onSubmit,
  onUnpublish,
  onPublish,
  onOpenBookingCalendar,
}: ListingPreviewHeaderProps): ReactElement {
  const actions = listingPreviewActionsByStatus(status);
  const title = status === "draft" ? "Создание объявления" : "Объявление";

  return (
    <div className="flex w-full shrink-0 items-center justify-between gap-4">
      <div className="flex items-center gap-5">
        <WizardBackButton onClick={onBack} disabled={pending} />
        <h1 className="m-0 text-2xl font-bold leading-7 text-[var(--color-ink)]">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        {actions.includes("edit") ? (
          <ListingPreviewIconButton
            label="Редактировать"
            icon={Pencil}
            disabled={pending}
            onClick={onEdit}
          />
        ) : null}
        {actions.includes("delete") ? (
          <ListingPreviewIconButton
            label="Удалить"
            icon={Trash2}
            disabled={pending}
            onClick={onDelete}
          />
        ) : null}
        {actions.includes("unpublish") ? (
          <Button
            size="sm"
            variant="outlined"
            disabled={pending}
            onClick={onUnpublish}
          >
            Снять с публикации
          </Button>
        ) : null}
        {actions.includes("calendar") ? (
          <Button
            size="sm"
            disabled={pending}
            onClick={onOpenBookingCalendar}
          >
            Перейти в календарь бронирования
          </Button>
        ) : null}
        {actions.includes("publish") ? (
          <Button size="sm" disabled={pending} onClick={onPublish}>
            Опубликовать
          </Button>
        ) : null}
        {actions.includes("archive") ? (
          <Button
            size="sm"
            variant="outlined"
            disabled={pending}
            onClick={onArchive}
          >
            Сохранить в архив
          </Button>
        ) : null}
        {actions.includes("submit") ? (
          <Button size="sm" disabled={pending} onClick={onSubmit}>
            Отправить на модерацию
          </Button>
        ) : null}
      </div>
    </div>
  );
}
