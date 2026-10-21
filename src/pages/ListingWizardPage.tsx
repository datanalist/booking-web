/** Единая причина изменения: UI мастера создания и редактирования объявления (6 шагов). */
import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useSession } from "../app/session";
import { PHOTO_MAX } from "../config";
import type {
  AmenityId,
  ExtraAmenityId,
  ListingDraft,
} from "../api/types";
import {
  deleteRemovedWizardPhotos,
  listingsLocationStateFromOrigin,
  listingTableRowFromListing,
  parseListingOriginState,
  PHOTO_UPLOAD_IDLE,
  processWizardPhotoSelection,
  useAllListings,
  type ListingPreviewLocationState,
  type PhotoUploadStatus,
} from "../features/listings";
import { emptyDraft } from "../lib/emptyDraft";
import { errorCodeOf } from "../lib/errorCodeOf";
import { isDescriptionStepComplete } from "../lib/parseDescriptionStep";
import { parseStep } from "../lib/wizardStep";
import { validateStep } from "../lib/wizardValidation";
import { AmenitiesStep } from "../ui/AmenitiesStep";
import { ListingWizardDetailsStep } from "../ui/ListingWizardDetailsStep";
import { WizardBackButton } from "../ui/WizardBackButton";
import { WizardDescriptionForm } from "../ui/WizardDescriptionForm";
import { WizardPhotosStep } from "../ui/WizardPhotosStep";
import type { WizardStepNumber } from "../ui/WizardStepNumber";
import { WizardSteps } from "../ui/WizardSteps";
import { ListingWizardPriceStep } from "./ListingWizardPriceStep";
import { ListingWizardRulesStep } from "./ListingWizardRulesStep";

type WizardStep = WizardStepNumber;

export function ListingWizardPage() {
  const { session, listings } = useSession();
  const { items: tableItems, upsert } = useAllListings();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [params, setParams] = useSearchParams();
  const step = parseStep(params.get("step"));
  const isNew = !id;
  /** Вкладка списка, откуда пришли в мастер: переживает все переходы между шагами. */
  const origin: ListingPreviewLocationState = parseListingOriginState(
    location.state,
  );

  const [draft, setDraft] = useState<ListingDraft | null>(null);
  const [housingChosen, setHousingChosen] = useState(false);
  const [touched, setTouched] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uniqueOn, setUniqueOn] = useState(false);
  const [pending, setPending] = useState(false);
  const [photoUpload, setPhotoUpload] =
    useState<PhotoUploadStatus>(PHOTO_UPLOAD_IDLE);

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
        let listing = await listings.get(id).catch(() => null);
        if (!listing) {
          const row = tableItems.find((item) => item.id === id);
          if (!row) {
            navigate("/listings");
            return;
          }
          listing = await listings.ensureForEdit({
            id: row.id,
            title: row.title,
            address: row.address,
            housingType: row.housingType,
          });
        }
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
  }, [id, isNew, listings, navigate, session, tableItems]);

  function setStep(next: WizardStep): void {
    const nextParams = new URLSearchParams(params);
    nextParams.set("step", String(next));
    setParams(nextParams, { replace: true, state: origin });
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
      upsert(listingTableRowFromListing(saved));
      setTouched(false);
      if (nextStep === "preview") {
        navigate(`/listings/${saved.id}/preview`, {
          replace: true,
          state: origin,
        });
        return;
      }
      if (isNew) {
        navigate(`/listings/${saved.id}/edit?step=${nextStep}`, {
          replace: true,
          state: origin,
        });
      } else {
        setStep(nextStep);
      }
    } catch (error: unknown) {
      if (errorCodeOf(error) === "QUOTA_EXCEEDED") {
        setErrors({
          photos:
            "Не удалось сохранить объявление: переполнение хранилища. Уменьшите размер или число фото.",
        });
        return;
      }
      throw error;
    } finally {
      setPending(false);
    }
  }

  /**
   * Шаг описания. Черновик сохраняется и переходит дальше.
   * Опубликованное объявление saveDraft не записывает (INVALID_STATUS),
   * поэтому «Далее» только сменяет шаг — иначе клик ничего не делает.
   */
  async function saveDescriptionAndGo(): Promise<void> {
    if (!draft || !session) {
      return;
    }
    if (draft.status !== "published") {
      await saveAndGo(2);
      return;
    }
    const currentErrors = validateCurrent(draft);
    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors);
      return;
    }
    setErrors({});
    setTouched(false);
    setStep(2);
  }

  /** Стрелка «Назад» в шапке: в «Мои объявления» на вкладку-источник, а не на шаг назад. */
  async function exitToListings(): Promise<void> {
    if (draft && draft.id && touched) {
      setPending(true);
      try {
        const saved = await listings.saveDraft(draft);
        upsert(listingTableRowFromListing(saved));
      } catch {
        // Выход важнее сохранения: частично заполненный черновик не должен блокировать уход.
      } finally {
        setPending(false);
      }
    }
    navigate("/listings", { state: listingsLocationStateFromOrigin(origin) });
  }

  async function goBack(): Promise<void> {
    if (!draft || step === 1) {
      await exitToListings();
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
        upsert(listingTableRowFromListing(saved));
        setTouched(false);
      } finally {
        setPending(false);
      }
    }
    setErrors({});
    setStep((step - 1) as WizardStep);
  }

  async function onPhotosSelected(files: FileList | null): Promise<void> {
    if (!files || !draft || photoUpload.kind === "loading") {
      return;
    }
    const selected = [...files];
    setPhotoUpload({ kind: "loading" });
    let nextStatus: PhotoUploadStatus = PHOTO_UPLOAD_IDLE;
    try {
      const outcome = await processWizardPhotoSelection(
        selected,
        draft.photos.length,
      );
      if (outcome.addedPhotos.length > 0) {
        setDraft((current) => {
          if (!current) {
            return current;
          }
          const room = PHOTO_MAX - current.photos.length;
          return {
            ...current,
            photos: [...current.photos, ...outcome.addedPhotos.slice(0, room)],
          };
        });
        setTouched(true);
      }
      nextStatus = outcome.status;
    } catch {
      nextStatus = {
        kind: "error",
        message: "Не удалось обработать фото. Попробуйте другие файлы.",
      };
    } finally {
      setPhotoUpload(nextStatus);
    }
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

  if (step === 5) {
    return (
      <ListingWizardDetailsStep
        values={{
          accessInfo: draft.accessInfo,
          houseRules: draft.houseRules,
          extraInfo: draft.extraInfo,
        }}
        errors={errors}
        pending={pending}
        onChange={(partial) => patch(partial)}
        onExit={() => {
          void exitToListings();
        }}
        onBack={() => {
          void goBack();
        }}
        onNext={() => {
          void saveAndGo(6);
        }}
      />
    );
  }

  if (step === 3) {
    return (
      <AmenitiesStep
        selectedAmenities={new Set(draft.amenityIds)}
        selectedExtras={new Set(draft.extraAmenityIds)}
        pending={pending}
        onToggleAmenity={toggleAmenity}
        onToggleExtra={toggleExtra}
        onExit={() => {
          void exitToListings();
        }}
        onBack={() => {
          void goBack();
        }}
        onNext={() => {
          void saveAndGo(4);
        }}
      />
    );
  }

  return (
    <div className="flex h-full flex-col gap-8 overflow-auto bg-[rgba(251,192,40,0.06)] p-8 font-sans">
      <div className="flex items-center gap-5">
        <WizardBackButton
          disabled={pending}
          onClick={() => void exitToListings()}
        />
        <h1 className="m-0 text-[24px] font-bold leading-[1.2] text-[var(--color-ink)]">
          Создание объявления
        </h1>
      </div>

      <WizardSteps current={step} />

      <div className="flex min-h-0 flex-1 flex-col items-center overflow-auto rounded-2xl border border-[rgba(251,192,40,0.17)] bg-white px-6">
        {step === 1 ? (
          <WizardDescriptionForm
            title={draft.title}
            address={draft.address}
            housingType={housingChosen ? draft.housingType : ""}
            description={draft.description}
            errors={errors}
            nextEnabled={isDescriptionStepComplete({
              title: draft.title,
              address: draft.address,
              housingType: draft.housingType,
              housingChosen,
              description: draft.description,
            })}
            pending={pending}
            onTitleChange={(value) => patch({ title: value })}
            onAddressChange={(value) => patch({ address: value })}
            onHousingChange={(value) => {
              if (!value) {
                setHousingChosen(false);
                return;
              }
              setHousingChosen(true);
              patch({ housingType: value });
            }}
            onDescriptionChange={(value) => patch({ description: value })}
            onNext={() => void saveDescriptionAndGo()}
          />
        ) : null}

        {step === 2 ? (
          <WizardPhotosStep
            photos={draft.photos}
            error={errors.photos}
            pending={pending}
            uploadStatus={photoUpload}
            onPhotosChange={(photos) => {
              const previous = draft.photos;
              patch({ photos });
              void deleteRemovedWizardPhotos(previous, photos);
            }}
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

        {step === 4 ? (
          <ListingWizardRulesStep
            values={{
              maxGuests: draft.maxGuests,
              guestsForbidden: draft.guestsForbidden === true,
              checkInTime: draft.checkInTime,
              checkOutTime: draft.checkOutTime,
              petsAllowed: draft.petsAllowed,
              cancellationAllowed: draft.cancellationAllowed,
            }}
            errors={{
              maxGuests: errors.maxGuests,
              checkInTime: errors.checkInTime,
              checkOutTime: errors.checkOutTime,
            }}
            pending={pending}
            onChange={(partial) => patch(partial)}
            onBack={() => {
              void goBack();
            }}
            onNext={() => {
              void saveAndGo(5);
            }}
          />
        ) : null}

        {step === 6 ? (
          <ListingWizardPriceStep
            priceNight={draft.priceNight}
            priceFrom14={draft.priceFrom14}
            priceFrom28={draft.priceFrom28}
            uniqueOn={uniqueOn}
            uniquePrices={draft.uniquePrices}
            errors={errors}
            pending={pending}
            onPriceNight={(value) => patch({ priceNight: value })}
            onPriceFrom14={(value) => patch({ priceFrom14: value })}
            onPriceFrom28={(value) => patch({ priceFrom28: value })}
            onUniqueOn={(on) => {
              setUniqueOn(on);
              if (!on) {
                patch({ uniquePrices: [] });
              } else if (draft.uniquePrices.length === 0) {
                patch({ uniquePrices: [{ date: "", base: 0 }] });
              }
            }}
            onUniquePrices={(rows) => patch({ uniquePrices: rows })}
            onBack={() => void goBack()}
            onNext={() => {
              void saveAndGo("preview");
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
