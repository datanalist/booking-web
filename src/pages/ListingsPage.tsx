import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../app/session";
import { STATUS_LABELS } from "../config";
import { LISTING_TABS, type ListingTabId } from "../lib/listingTabs";
import type { Listing } from "../api/types";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { ListingCard } from "../ui/ListingCard";
import { Modal } from "../ui/Modal";
import { Search } from "../ui/Search";
import { Tabs } from "../ui/Tabs";

export function ListingsPage() {
  const { listings } = useSession();
  const navigate = useNavigate();
  const [tab, setTab] = useState<ListingTabId>("all");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Listing[]>([]);
  const [travelOpen, setTravelOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const reload = useCallback(async (): Promise<void> => {
    const next = await listings.list({ tab, query });
    setItems(next);
  }, [listings, tab, query]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function confirmDelete(): Promise<void> {
    if (!deleteId) {
      return;
    }
    await listings.remove(deleteId);
    setDeleteId(null);
    await reload();
  }

  const empty =
    tab === "published" || items.length === 0;

  return (
    <div className="font-sans">
      <div className="mb-6 flex items-start justify-between gap-4">
        <h1 className="text-[28px] font-bold text-[var(--color-ink)]">
          Мои объявления
        </h1>
        <div className="flex gap-3">
          <Button variant="outlined" onClick={() => setTravelOpen(true)}>
            Импорт из TravelLine
          </Button>
          <Button onClick={() => navigate("/listings/new")}>
            Создать объявление
          </Button>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between gap-4">
        <Tabs
          items={LISTING_TABS.map((item) => ({
            id: item.id,
            label: item.label,
          }))}
          value={tab}
          onChange={(id) => setTab(id as ListingTabId)}
        />
        <div className="w-[280px]">
          <Search value={query} onChange={setQuery} placeholder="Поиск" />
        </div>
      </div>

      {empty ? (
        <EmptyState
          title="Нет объявлений"
          description="Создайте своё первое объявление о жилье!"
          illustration={
            <div className="mb-2 h-40 w-56 rounded-lg bg-[#f5ebe0]" aria-hidden />
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <ListingCard
              key={item.id}
              title={item.title}
              address={item.address}
              photoUrl={item.photos[0]}
              statusLabel={STATUS_LABELS[item.status]}
              onOpen={() => navigate(`/listings/${item.id}/preview`)}
              onEdit={() => navigate(`/listings/${item.id}/edit`)}
              onPublish={() => setPublishOpen(true)}
              onDelete={() => setDeleteId(item.id)}
            />
          ))}
        </div>
      )}

      <Modal
        open={travelOpen}
        title="Импорт из TravelLine"
        onClose={() => setTravelOpen(false)}
      >
        <p className="text-[16px] text-[var(--color-text)]">
          Импорт появится позже
        </p>
      </Modal>

      <Modal
        open={publishOpen}
        title="Публикация"
        onClose={() => setPublishOpen(false)}
      >
        <p className="text-[16px] text-[var(--color-text)]">
          Публикацию выполняет администратор, раздел появится позже
        </p>
      </Modal>

      <Modal
        open={deleteId !== null}
        title="Удалить объявление?"
        onClose={() => setDeleteId(null)}
      >
        <p className="mb-6 text-[16px] text-[var(--color-text)]">
          Это действие нельзя отменить.
        </p>
        <div className="flex gap-3">
          <Button
            variant="outlined"
            className="flex-1"
            onClick={() => setDeleteId(null)}
          >
            Отмена
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              void confirmDelete();
            }}
          >
            Удалить
          </Button>
        </div>
      </Modal>
    </div>
  );
}
