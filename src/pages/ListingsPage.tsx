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
import { Tabs } from "../ui/Tabs";

export function ListingsPage() {
  const { listings } = useSession();
  const navigate = useNavigate();
  const [tab, setTab] = useState<ListingTabId>("all");
  const [items, setItems] = useState<Listing[]>([]);
  const [publishOpen, setPublishOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const reload = useCallback(async (): Promise<void> => {
    const next = await listings.list({ tab, query: "" });
    setItems(next);
  }, [listings, tab]);

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

  const empty = tab === "published" || items.length === 0;

  return (
    <div className="-mx-10 -my-8 flex min-h-[1020px] flex-col gap-8 bg-[rgba(251,192,40,0.06)] px-8 py-8 font-sans">
      <div className="flex items-center justify-between">
        <h1 className="m-0 text-[24px] font-bold text-[var(--color-ink)]">
          Мои объявления
        </h1>
        <Button size="sm" onClick={() => navigate("/listings/new")}>
          Создать объявление
        </Button>
      </div>

      <Tabs
        items={LISTING_TABS.map((item) => ({
          id: item.id,
          label: item.label,
        }))}
        value={tab}
        onChange={(id) => setTab(id as ListingTabId)}
      />

      {empty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 rounded-2xl border border-[rgba(251,192,40,0.17)] bg-white">
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
