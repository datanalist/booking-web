import { useState, type ReactElement } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { resolveCabinetDataSource } from "../api/pocketbase/dataSource";
import {
  AllListingsTable,
  BookingCalendarAlert,
  DeleteAnnouncementDialog,
  filterListingsByQuery,
  PublishAnnouncementDialog,
  UnpublishAnnouncementDialog,
  useAllListings,
  type ListingPreviewLocationState,
  type ListingRowMenuActionId,
  type ListingTableRow,
} from "../features/listings";
import {
  isListingTabId,
  LISTING_TABS,
  type ListingTabId,
  type ListingsLocationState,
} from "../lib/listingTabs";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { Search } from "../ui/Search";
import { Tabs } from "../ui/Tabs";

const TAB_ARIA_LABELS: Record<ListingTabId, string> = {
  all: "Все объявления",
  published: "Опубликованы",
  moderation: "На модерации",
  archived: "Архив",
};

function itemsForTab(
  items: readonly ListingTableRow[],
  tab: ListingTabId,
): ListingTableRow[] {
  switch (tab) {
    case "all":
      return [...items];
    case "published":
      return items.filter((item) => item.status === "published");
    case "moderation":
      return items.filter((item) => item.status === "moderation");
    case "archived":
      return items.filter(
        (item) => item.status === "unpublished" || item.status === "draft",
      );
  }
}

export function ListingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, remove, setStatus } = useAllListings();
  const [tab, setTab] = useState<ListingTabId>(() => {
    const state = location.state as ListingsLocationState | null;
    return isListingTabId(state?.tab) ? state.tab : "all";
  });
  const [query, setQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [unpublishId, setUnpublishId] = useState<string | null>(null);
  const [publishId, setPublishId] = useState<string | null>(null);
  const [calendarListingId, setCalendarListingId] = useState<string | null>(
    null,
  );

  const visibleItems = filterListingsByQuery(itemsForTab(items, tab), query);

  function handleMenuAction(
    listingId: string,
    actionId: ListingRowMenuActionId,
  ): void {
    if (actionId === "edit") {
      const state: ListingPreviewLocationState = { fromTab: tab };
      navigate(`/listings/${listingId}/edit?step=1`, { state });
      return;
    }
    if (actionId === "calendar") {
      setCalendarListingId(listingId);
      return;
    }
    if (actionId === "delete") {
      setDeleteError("");
      setDeleteId(listingId);
      return;
    }
    if (actionId === "unpublish") {
      setUnpublishId(listingId);
      return;
    }
    if (actionId === "publish") {
      setPublishId(listingId);
    }
  }

  async function confirmDelete(): Promise<void> {
    if (deleteId === null) {
      return;
    }
    const id = deleteId;
    try {
      await remove(id);
      setDeleteError("");
      setDeleteId(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message.trim() : "";
      setDeleteError(message.length > 0 ? message : "Не удалось удалить объявление");
    }
  }

  function confirmUnpublish(): void {
    if (unpublishId === null) {
      return;
    }
    setStatus(unpublishId, "unpublished");
    setUnpublishId(null);
  }

  function confirmPublish(): void {
    if (publishId === null) {
      return;
    }
    const id = publishId;
    if (resolveCabinetDataSource() === "pocketbase") {
      setStatus(id, "moderation");
    } else {
      setStatus(id, "published");
    }
    setPublishId(null);
  }

  function renderEmptyState(): ReactElement {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 rounded-2xl border border-amber-400/20 bg-white">
        <EmptyState
          title="Нет объявлений"
          description="Создайте свое первое объявление о жилье!"
          illustration={
            <img
              src="/listings-empty.svg"
              alt=""
              width={214}
              height={200}
              className="mb-0"
            />
          }
        />
      </div>
    );
  }

  function renderTable(): ReactElement {
    if (visibleItems.length === 0) {
      return renderEmptyState();
    }
    return (
      <AllListingsTable
        ariaLabel={TAB_ARIA_LABELS[tab]}
        items={visibleItems}
        openMenuId={openMenuId}
        onOpenMenuChange={setOpenMenuId}
        onMenuAction={handleMenuAction}
        onOpenListing={(listingId) => {
          const state: ListingPreviewLocationState = { fromTab: tab };
          navigate(`/listings/${listingId}/preview`, { state });
        }}
      />
    );
  }

  return (
    <div className="flex h-full w-full flex-col gap-8 bg-amber-400/5 p-8 font-sans">
      <div className="flex w-full shrink-0 items-center justify-between">
        <h1 className="m-0 text-[24px] font-bold leading-[1.2] text-[var(--color-ink)]">
          Мои объявления
        </h1>
        <div className="flex items-center gap-3">
          <Button size="sm" variant="outlined">
            Импорт из TravelLine
          </Button>
          <Button
            size="sm"
            onClick={() => {
              const state: ListingPreviewLocationState = { fromTab: tab };
              navigate("/listings/new", { state });
            }}
          >
            Создать объявление
          </Button>
        </div>
      </div>

      <div className="flex w-full shrink-0 items-start justify-between gap-4">
        <Tabs
          items={LISTING_TABS.map((item) => ({
            id: item.id,
            label: item.label,
          }))}
          value={tab}
          onChange={(id) => {
            setTab(id as ListingTabId);
            setOpenMenuId(null);
          }}
        />
        <Search
          value={query}
          onChange={setQuery}
          placeholder="Введите название или адрес жилья"
        />
      </div>

      {renderTable()}

      <DeleteAnnouncementDialog
        open={deleteId !== null}
        error={deleteError}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          void confirmDelete();
        }}
      />
      <UnpublishAnnouncementDialog
        open={unpublishId !== null}
        onClose={() => setUnpublishId(null)}
        onConfirm={confirmUnpublish}
      />
      <PublishAnnouncementDialog
        open={publishId !== null}
        onClose={() => setPublishId(null)}
        onConfirm={confirmPublish}
      />
      <BookingCalendarAlert
        open={calendarListingId !== null}
        listingId={calendarListingId ?? undefined}
        onOpenChange={(open) => {
          if (!open) {
            setCalendarListingId(null);
          }
        }}
      />
    </div>
  );
}
