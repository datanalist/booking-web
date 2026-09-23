import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSession } from "../app/session";
import {
  AMENITY_LABELS,
  EXTRA_AMENITY_LABELS,
  HOUSING_LABELS,
  STATUS_LABELS,
} from "../config";
import type { Listing } from "../api/types";
import { firstInvalidStep } from "../lib/canSubmit";
import { clientPriceOf, commissionOf } from "../lib/money";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

export function ListingPreviewPage() {
  const { listings } = useSession();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load(): Promise<void> {
      if (!id) {
        return;
      }
      try {
        const next = await listings.get(id);
        if (!cancelled) {
          setListing(next);
        }
      } catch {
        navigate("/listings");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id, listings, navigate]);

  async function onSubmit(): Promise<void> {
    if (!listing) {
      return;
    }
    const invalid = firstInvalidStep(listing);
    if (invalid !== null) {
      setSubmitError(`Заполните шаг ${invalid}`);
      navigate(`/listings/${listing.id}/edit?step=${invalid}`);
      return;
    }
    setPending(true);
    setSubmitError("");
    try {
      const updated = await listings.submitForModeration(listing.id);
      setListing(updated);
      setSuccess(true);
    } finally {
      setPending(false);
    }
  }

  async function onArchive(): Promise<void> {
    if (!listing) {
      return;
    }
    setPending(true);
    try {
      await listings.archive(listing.id);
      navigate("/listings");
    } finally {
      setPending(false);
    }
  }

  async function onDelete(): Promise<void> {
    if (!listing) {
      return;
    }
    setPending(true);
    try {
      await listings.remove(listing.id);
      navigate("/listings");
    } finally {
      setPending(false);
      setDeleteOpen(false);
    }
  }

  if (!listing) {
    return <p className="font-sans">Загрузка…</p>;
  }

  if (success) {
    return (
      <div className="flex min-h-[600px] flex-col items-center justify-center gap-6 font-sans">
        <h1 className="text-[32px] font-bold text-[var(--color-ink)]">
          Отправлено на модерацию
        </h1>
        <p className="text-[16px] text-[var(--color-text)]">
          Мы проверим объявление и сообщим о результате
        </p>
        <Button onClick={() => navigate("/listings")}>К объявлениям</Button>
      </div>
    );
  }

  return (
    <div className="font-sans">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-[14px] text-[var(--color-accent)]">
            {STATUS_LABELS[listing.status]}
          </p>
          <h1 className="text-[28px] font-bold text-[var(--color-ink)]">
            {listing.title}
          </h1>
          <p className="text-[16px] text-[#757575]">{listing.address}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outlined"
            onClick={() => navigate(`/listings/${listing.id}/edit`)}
          >
            Править
          </Button>
          <Button variant="outlined" onClick={() => setDeleteOpen(true)}>
            Удалить
          </Button>
          <Button
            variant="outlined"
            disabled={pending}
            onClick={() => {
              void onArchive();
            }}
          >
            Сохранить в архив
          </Button>
          <Button
            disabled={pending}
            onClick={() => {
              void onSubmit();
            }}
          >
            Отправить на модерацию
          </Button>
        </div>
      </div>

      {submitError ? <p className="mb-4 text-red-600">{submitError}</p> : null}

      <div className="mb-6 grid grid-cols-3 gap-3">
        {listing.photos.map((src, index) => (
          <img
            key={`${index}-${src.slice(0, 24)}`}
            src={src}
            alt=""
            className="h-48 w-full rounded-lg object-cover"
          />
        ))}
      </div>

      <section className="mb-6 max-w-3xl">
        <h2 className="mb-2 text-[18px] font-bold">Описание</h2>
        <p className="whitespace-pre-wrap text-[16px] text-[var(--color-text)]">
          {listing.description}
        </p>
        <p className="mt-2 text-[14px] text-[#757575]">
          {HOUSING_LABELS[listing.housingType]}
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 text-[18px] font-bold">Удобства</h2>
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
          {listing.amenityIds.map((id) => (
            <li
              key={id}
              className="rounded-full bg-[#f5f5f5] px-3 py-1 text-[14px]"
            >
              {AMENITY_LABELS[id]}
            </li>
          ))}
          {listing.extraAmenityIds.map((id) => (
            <li
              key={id}
              className="rounded-full bg-[#f5f5f5] px-3 py-1 text-[14px]"
            >
              {EXTRA_AMENITY_LABELS[id]}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-6 max-w-3xl">
        <h2 className="mb-2 text-[18px] font-bold">Правила</h2>
        <p>Гостей: {listing.maxGuests}</p>
        <p>Заезд: {listing.checkInTime}</p>
        <p>Выезд: {listing.checkOutTime}</p>
        <p>{listing.petsAllowed ? "Можно с питомцами" : "Без питомцев"}</p>
        <p>
          {listing.cancellationAllowed
            ? "Бесплатная отмена"
            : "Без бесплатной отмены"}
        </p>
      </section>

      <section className="mb-6 max-w-3xl">
        <h2 className="mb-2 text-[18px] font-bold">Дополнительно</h2>
        <p className="whitespace-pre-wrap">{listing.accessInfo}</p>
        <p className="whitespace-pre-wrap">{listing.houseRules}</p>
        <p className="whitespace-pre-wrap">{listing.extraInfo}</p>
      </section>

      <section className="mb-6 max-w-xl">
        <h2 className="mb-2 text-[18px] font-bold">Стоимость</h2>
        <PriceLine label="За ночь" base={listing.priceNight} />
        <PriceLine label="От 14 ночей" base={listing.priceFrom14} />
        <PriceLine label="От 28 ночей" base={listing.priceFrom28} />
        {listing.uniquePrices.length > 0 ? (
          <ul className="mt-3 list-disc pl-5">
            {listing.uniquePrices.map((row) => (
              <li key={row.date}>
                {row.date}: {row.base} (гость {clientPriceOf(row.base)})
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <Modal
        open={deleteOpen}
        title="Удалить объявление?"
        onClose={() => setDeleteOpen(false)}
      >
        <p className="mb-6 text-[16px]">Это действие нельзя отменить.</p>
        <div className="flex gap-3">
          <Button
            variant="outlined"
            className="flex-1"
            onClick={() => setDeleteOpen(false)}
          >
            Отмена
          </Button>
          <Button
            className="flex-1"
            disabled={pending}
            onClick={() => {
              void onDelete();
            }}
          >
            Удалить
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function PriceLine({ label, base }: { label: string; base: number }) {
  return (
    <p className="text-[16px]">
      {label}: {base} · комиссия {commissionOf(base)} · гость{" "}
      {clientPriceOf(base)}
    </p>
  );
}
