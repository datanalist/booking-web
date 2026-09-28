import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSession } from "../app/session";
import type { Listing } from "../api/types";
import {
  DeleteAnnouncementDialog,
  ListingPreviewHeader,
  ListingPreviewView,
  ModerationSentDialog,
  toListingPreviewDisplay,
  useAllListings,
} from "../features/listings";
import { firstInvalidStep } from "../lib/canSubmit";
import type { ListingsLocationState } from "../lib/listingTabs";

export function ListingPreviewPage() {
  const { listings } = useSession();
  const { upsert, remove: removeFromTable } = useAllListings();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [moderationOpen, setModerationOpen] = useState(false);
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

  const display = useMemo(
    () => (listing ? toListingPreviewDisplay(listing) : null),
    [listing],
  );

  function goToListings(tab?: ListingsLocationState["tab"]): void {
    const state: ListingsLocationState | undefined =
      tab === undefined ? undefined : { tab };
    navigate("/listings", { state });
  }

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
      upsert({
        id: updated.id,
        title: updated.title,
        address: updated.address,
        housingType: updated.housingType,
        status: "moderation",
        coverUrl: updated.photos[0],
      });
      setModerationOpen(true);
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
      const updated = await listings.archive(listing.id);
      upsert({
        id: updated.id,
        title: updated.title,
        address: updated.address,
        housingType: updated.housingType,
        status: "unpublished",
        coverUrl: updated.photos[0],
      });
      goToListings("archived");
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
      removeFromTable(listing.id);
      goToListings();
    } finally {
      setPending(false);
      setDeleteOpen(false);
    }
  }

  function onModerationClose(): void {
    setModerationOpen(false);
    goToListings("moderation");
  }

  if (!listing || !display) {
    return <p className="font-sans">Загрузка…</p>;
  }

  return (
    <div className="flex h-full w-full flex-col gap-8 overflow-auto bg-amber-400/5 p-8 font-sans">
      <ListingPreviewHeader
        pending={pending}
        onBack={() => navigate(`/listings/${listing.id}/edit?step=6`)}
        onEdit={() => navigate(`/listings/${listing.id}/edit?step=1`)}
        onDelete={() => setDeleteOpen(true)}
        onArchive={() => {
          void onArchive();
        }}
        onSubmit={() => {
          void onSubmit();
        }}
      />

      {submitError ? <p className="m-0 text-red-600">{submitError}</p> : null}

      <ListingPreviewView data={display} />

      <DeleteAnnouncementDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          void onDelete();
        }}
      />
      <ModerationSentDialog
        open={moderationOpen}
        onClose={onModerationClose}
      />
    </div>
  );
}
