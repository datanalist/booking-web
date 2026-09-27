/** Единая причина изменения: UI мастера создания и редактирования объявления (6 шагов). */
import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useSession } from "../app/session";
import {
  AMENITY_LABELS,
  DESCRIPTION_MAX,
  EXTRA_AMENITY_LABELS,
  HOUSING_LABELS,
  PHOTO_MAX,
} from "../config";
import type {
  AmenityId,
  ExtraAmenityId,
  HousingType,
  ListingDraft,
} from "../api/types";
import { emptyDraft } from "../lib/emptyDraft";
import { compressImage } from "../lib/compressImage";
import { commissionOf, clientPriceOf } from "../lib/money";
import { parseStep } from "../lib/wizardStep";
import { validateStep } from "../lib/wizardValidation";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { WizardPhotosStep } from "../ui/WizardPhotosStep";
import { WizardSteps } from "../ui/WizardSteps";

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

export function ListingWizardPage() {
  const { session, listings } = useSession();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [params, setParams] = useSearchParams();
  const step = parseStep(params.get("step"));
  const isNew = !id;

  const [draft, setDraft] = useState<ListingDraft | null>(null);
  const [housingChosen, setHousingChosen] = useState(false);
  const [touched, setTouched] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uniqueOn, setUniqueOn] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load(): Promise<void> {
      if (!session) {
        return;
      }
      if (isNew) {
        if (!cancelled) {
          setDraft(emptyDraft(session.userId));
          setHousingChosen(false);
        }
        return;
      }
      try {
        const listing = await listings.get(id);
        if (!cancelled) {
          setDraft(listing);
          setHousingChosen(true);
          setUniqueOn(listing.uniquePrices.length > 0);
        }
      } catch {
        navigate("/listings");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id, isNew, listings, navigate, session]);

  function setStep(next: WizardStep): void {
    const nextParams = new URLSearchParams(params);
    nextParams.set("step", String(next));
    setParams(nextParams, { replace: true });
  }

  function patch(partial: Partial<ListingDraft>): void {
    setDraft((current) => (current ? { ...current, ...partial } : current));
    setTouched(true);
  }

  function validateCurrent(current: ListingDraft): Record<string, string> {
    if (step === 1 && !housingChosen) {
      return {
        ...validateStep(1, current),
        housingType: "Выберите вид жилья",
      };
    }
    return validateStep(step, current);
  }

  async function saveAndGo(nextStep: WizardStep | "preview"): Promise<void> {
    if (!draft || !session) {
      return;
    }
    const currentErrors = validateCurrent(draft);
    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors);
      return;
    }
    setErrors({});
    setPending(true);
    try {
      const saved = await listings.saveDraft(draft);
      setDraft(saved);
      setTouched(false);
      if (nextStep === "preview") {
        navigate(`/listings/${saved.id}/preview`);
        return;
      }
      if (isNew) {
        navigate(`/listings/${saved.id}/edit?step=${nextStep}`, { replace: true });
      } else {
        setStep(nextStep);
      }
    } finally {
      setPending(false);
    }
  }

  async function goBack(): Promise<void> {
    if (!draft || step === 1) {
      navigate("/listings");
      return;
    }
    if (touched) {
      const currentErrors = validateCurrent(draft);
      if (Object.keys(currentErrors).length > 0) {
        setErrors(currentErrors);
        return;
      }
      setPending(true);
      try {
        const saved = await listings.saveDraft(draft);
        setDraft(saved);
        setTouched(false);
      } finally {
        setPending(false);
      }
    }
    setErrors({});
    setStep((step - 1) as WizardStep);
  }

  async function onPhotosSelected(files: FileList | null): Promise<void> {
    if (!files || !draft) {
      return;
    }
    const remaining = PHOTO_MAX - draft.photos.length;
    const selected = [...files].slice(0, remaining);
    const compressed: string[] = [];
    for (const file of selected) {
      compressed.push(await compressImage(file));
    }
    patch({ photos: [...draft.photos, ...compressed] });
  }

  function toggleAmenity(id: AmenityId): void {
    if (!draft) {
      return;
    }
    const has = draft.amenityIds.includes(id);
    patch({
      amenityIds: has
        ? draft.amenityIds.filter((item) => item !== id)
        : [...draft.amenityIds, id],
    });
  }

  function toggleExtra(id: ExtraAmenityId): void {
    if (!draft) {
      return;
    }
    const has = draft.extraAmenityIds.includes(id);
    patch({
      extraAmenityIds: has
        ? draft.extraAmenityIds.filter((item) => item !== id)
        : [...draft.extraAmenityIds, id],
    });
  }

  if (!draft) {
    return <p className="font-sans">Загрузка…</p>;
  }

  return (
    <div className="-mx-10 -my-8 flex h-full flex-col gap-8 overflow-auto bg-[rgba(251,192,40,0.06)] p-8 font-sans">
      <div className="flex items-center gap-5">
        <button
          type="button"
          aria-label="Назад"
          className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-[30px] border border-solid border-[#ffe4b8] bg-white p-2"
          disabled={pending}
          onClick={() => void goBack()}
        >
          <span className="flex size-6 items-center justify-center">
            <img
              src="/icon-arrow-left.svg"
              alt=""
              width={15.5}
              height={8.5}
              className="block rotate-90"
            />
          </span>
        </button>
        <h1 className="m-0 text-[24px] leading-[1.2] font-bold text-[var(--color-ink)]">
          Создание объявления
        </h1>
      </div>

      <WizardSteps current={step} />

      <div className="flex min-h-0 flex-1 flex-col items-center rounded-[16px] border border-solid border-[rgba(251,192,40,0.17)] bg-white">
      {step === 1 ? (
        <div className="flex w-full max-w-xl flex-col gap-4 px-8 py-10">
          <Input
            label="Название"
            value={draft.title}
            onChange={(value) => patch({ title: value })}
            error={errors.title}
          />
          <Input
            label="Адрес"
            value={draft.address}
            onChange={(value) => patch({ address: value })}
            error={errors.address}
          />
          <label className="flex flex-col gap-1 text-[14px]">
            Вид жилья
            <select
              className="rounded-[8px] border border-[#d0d0d0] px-3 py-2 text-[16px]"
              value={housingChosen ? draft.housingType : ""}
              onChange={(event) => {
                const value = event.target.value as HousingType | "";
                if (!value) {
                  setHousingChosen(false);
                  return;
                }
                setHousingChosen(true);
                patch({ housingType: value });
              }}
            >
              <option value="">Выберите</option>
              {(Object.keys(HOUSING_LABELS) as HousingType[]).map((key) => (
                <option key={key} value={key}>
                  {HOUSING_LABELS[key]}
                </option>
              ))}
            </select>
            {errors.housingType ? (
              <span className="text-red-600">{errors.housingType}</span>
            ) : null}
          </label>
          <Input
            label="Описание"
            value={draft.description}
            onChange={(value) => patch({ description: value })}
            multiline
            maxLength={DESCRIPTION_MAX}
            error={errors.description}
            hint={`${draft.description.length}/${DESCRIPTION_MAX}`}
          />
        </div>
      ) : null}

      {step === 2 ? (
        <WizardPhotosStep
          photos={draft.photos}
          error={errors.photos}
          pending={pending}
          onPhotosChange={(photos) => patch({ photos })}
          onFilesSelected={(files) => {
            void onPhotosSelected(files);
          }}
          onBack={() => {
            void goBack();
          }}
          onNext={() => {
            void saveAndGo(3);
          }}
        />
      ) : null}

      {step === 3 ? (
        <div className="flex max-w-2xl flex-col gap-6">
          <div>
            <h2 className="mb-3 text-[18px] font-bold">Удобства</h2>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(AMENITY_LABELS) as AmenityId[]).map((key) => {
                const on = draft.amenityIds.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    className={`rounded-full border px-3 py-2 text-[14px] cursor-pointer ${
                      on
                        ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                        : "border-[#d0d0d0] bg-white"
                    }`}
                    onClick={() => toggleAmenity(key)}
                  >
                    {AMENITY_LABELS[key]}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <h2 className="mb-3 text-[18px] font-bold">Дополнительно</h2>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(EXTRA_AMENITY_LABELS) as ExtraAmenityId[]).map(
                (key) => {
                  const on = draft.extraAmenityIds.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`rounded-full border px-3 py-2 text-[14px] cursor-pointer ${
                        on
                          ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                          : "border-[#d0d0d0] bg-white"
                      }`}
                      onClick={() => toggleExtra(key)}
                    >
                      {EXTRA_AMENITY_LABELS[key]}
                    </button>
                  );
                },
              )}
            </div>
          </div>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="flex max-w-xl flex-col gap-4">
          <Input
            label="Максимум гостей"
            type="number"
            value={draft.maxGuests ? String(draft.maxGuests) : ""}
            onChange={(value) =>
              patch({ maxGuests: value === "" ? 0 : Number(value) })
            }
            error={errors.maxGuests}
          />
          <label className="flex items-center gap-2 text-[14px]">
            <input
              type="checkbox"
              checked={draft.petsAllowed}
              onChange={(event) => patch({ petsAllowed: event.target.checked })}
            />
            Можно с питомцами
          </label>
          <label className="flex items-center gap-2 text-[14px]">
            <input
              type="checkbox"
              checked={draft.cancellationAllowed}
              onChange={(event) =>
                patch({ cancellationAllowed: event.target.checked })
              }
            />
            Бесплатная отмена
          </label>
          <Input
            label="Время заезда"
            type="time"
            value={draft.checkInTime}
            onChange={(value) => patch({ checkInTime: value })}
            error={errors.checkInTime}
          />
          <Input
            label="Время выезда"
            type="time"
            value={draft.checkOutTime}
            onChange={(value) => patch({ checkOutTime: value })}
            error={errors.checkOutTime}
          />
        </div>
      ) : null}

      {step === 5 ? (
        <div className="flex max-w-xl flex-col gap-4">
          <Input
            label="Как попасть"
            value={draft.accessInfo}
            onChange={(value) => patch({ accessInfo: value })}
            multiline
            maxLength={DESCRIPTION_MAX}
            error={errors.accessInfo}
            hint={`${draft.accessInfo.length}/${DESCRIPTION_MAX}`}
          />
          <Input
            label="Правила дома"
            value={draft.houseRules}
            onChange={(value) => patch({ houseRules: value })}
            multiline
            maxLength={DESCRIPTION_MAX}
            error={errors.houseRules}
            hint={`${draft.houseRules.length}/${DESCRIPTION_MAX}`}
          />
          <Input
            label="Дополнительная информация"
            value={draft.extraInfo}
            onChange={(value) => patch({ extraInfo: value })}
            multiline
            maxLength={DESCRIPTION_MAX}
            error={errors.extraInfo}
            hint={`${draft.extraInfo.length}/${DESCRIPTION_MAX}`}
          />
        </div>
      ) : null}

      {step === 6 ? (
        <div className="flex max-w-xl flex-col gap-4">
          <PriceField
            label="Цена за ночь"
            value={draft.priceNight}
            error={errors.priceNight}
            onChange={(value) => patch({ priceNight: value })}
          />
          <PriceField
            label="От 14 ночей"
            value={draft.priceFrom14}
            error={errors.priceFrom14}
            onChange={(value) => patch({ priceFrom14: value })}
          />
          <PriceField
            label="От 28 ночей"
            value={draft.priceFrom28}
            error={errors.priceFrom28}
            onChange={(value) => patch({ priceFrom28: value })}
          />
          <label className="flex items-center gap-2 text-[14px]">
            <input
              type="checkbox"
              checked={uniqueOn}
              onChange={(event) => {
                const on = event.target.checked;
                setUniqueOn(on);
                if (!on) {
                  patch({ uniquePrices: [] });
                } else if (draft.uniquePrices.length === 0) {
                  patch({ uniquePrices: [{ date: "", base: 0 }] });
                }
              }}
            />
            Уникальные цены по датам
          </label>
          {uniqueOn ? (
            <div className="flex flex-col gap-3">
              {draft.uniquePrices.map((row, index) => (
                <div key={index} className="flex items-end gap-2">
                  <Input
                    label="Дата"
                    type="date"
                    value={row.date}
                    onChange={(value) => {
                      const next = [...draft.uniquePrices];
                      next[index] = { ...row, date: value };
                      patch({ uniquePrices: next });
                    }}
                  />
                  <Input
                    label="Базовая цена"
                    type="number"
                    value={row.base ? String(row.base) : ""}
                    onChange={(value) => {
                      const next = [...draft.uniquePrices];
                      next[index] = {
                        ...row,
                        base: value === "" ? 0 : Number(value),
                      };
                      patch({ uniquePrices: next });
                    }}
                  />
                  <Button
                    variant="text"
                    onClick={() =>
                      patch({
                        uniquePrices: draft.uniquePrices.filter(
                          (_, i) => i !== index,
                        ),
                      })
                    }
                  >
                    Удалить
                  </Button>
                </div>
              ))}
              {errors.uniquePrices ? (
                <p className="text-red-600">{errors.uniquePrices}</p>
              ) : null}
              <Button
                variant="outlined"
                onClick={() =>
                  patch({
                    uniquePrices: [
                      ...draft.uniquePrices,
                      { date: "", base: 0 },
                    ],
                  })
                }
              >
                Добавить дату
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {step !== 2 ? (
        <div className="mt-auto flex w-full max-w-[437px] gap-5 px-0 pb-10">
          <Button
            variant="outlined"
            disabled={pending}
            className="h-auto min-w-0 flex-1 rounded-[8px] px-6 py-5"
            onClick={() => void goBack()}
          >
            Вернуться
          </Button>
          <Button
            disabled={pending}
            className="h-auto min-w-0 flex-1 rounded-[8px] px-6 py-5"
            onClick={() => {
              void saveAndGo(step === 6 ? "preview" : ((step + 1) as WizardStep));
            }}
          >
            Далее
          </Button>
        </div>
      ) : null}
      </div>
    </div>
  );
}

function PriceField({
  label,
  value,
  error,
  onChange,
}: {
  label: string;
  value: number;
  error?: string;
  onChange: (value: number) => void;
}) {
  const commission = value > 0 ? commissionOf(value) : 0;
  const client = value > 0 ? clientPriceOf(value) : 0;
  return (
    <div className="flex flex-col gap-1">
      <Input
        label={label}
        type="number"
        value={value ? String(value) : ""}
        onChange={(raw) => onChange(raw === "" ? 0 : Number(raw))}
        error={error}
      />
      {value > 0 ? (
        <p className="text-[12px] text-[#757575]">
          Комиссия сервиса: {commission} · Цена для гостя: {client}
        </p>
      ) : null}
    </div>
  );
}
