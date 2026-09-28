import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSession } from "../app/session";
import type { Listing } from "../api/types";
import {
  BookingCalendarAlert,
  DeleteAnnouncementDialog,
  listingFromTableRow,
  listingTableRowFromListing,
  ListingPreviewHeader,
  ListingPreviewView,
  listingTableStatusFromApi,
  ModerationSentDialog,
  PublishAnnouncementDialog,
  toListingPreviewDisplay,
  UnpublishAnnouncementDialog,
  useAllListings,
} from "../features/listings";
import { firstInvalidStep } from "../lib/canSubmit";
import type { ListingsLocationState } from "../lib/listingTabs";

export function ListingPreviewPage() {
  const { listings, session } = useSession();
  const { items, upsert, remove: removeFromTable, setStatus } = useAllListings();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [moderationOpen, setModerationOpen] = useState(false);
  const [unpublishOpen, setUnpublishOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [bookingCalendarOpen, setBookingCalendarOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load(): Promise<void> {
      if (!id) {
        return;
      }
      const tableRow = items.find((item) => item.id === id);
      try {
        const next = await listings.get(id);
        if (!cancelled) {
          setListing(next);
        }
      } catch {
        if (tableRow) {
          if (!cancelled) {
            setListing(
              listingFromTableRow(tableRow, session?.userId ?? "local-preview"),
            );
          }
          return;
        }
        navigate("/listings");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id, items, listings, navigate, session]);

  const display = useMemo(
    () => (listing ? toListingPreviewDisplay(listing) : null),
    [listing],
  );

  const tableStatus = listing
    ? listingTableStatusFromApi(listing.status)
    : null;

  function goToListings(tab?: ListingsLocationState["tab"]): void {
    const state: ListingsLocationState | undefined =
      tab === undefined ? undefined : { tab };
    navigate("/listings", { state });
  }

  function onBack(): void {
    if (!listing) {
      return;
    }
    if (listing.status === "draft") {
      navigate(`/listings/${listing.id}/edit?step=6`);
      return;
    }
    goToListings();
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
      upsert(listingTableRowFromListing(updated));
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
      const wasDraft = listing.status === "draft";
      const updated = await listings.archive(listing.id);
      const row = listingTableRowFromListing(updated);
      upsert({
        ...row,
        status: wasDraft ? "draft" : "unpublished",
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
      try {
        await listings.remove(listing.id);
      } catch {
        // Мок-строка могла не существовать в listings API.
      }
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

  function confirmUnpublish(): void {
    if (!listing) {
      return;
    }
    setStatus(listing.id, "unpublished");
    setListing({ ...listing, status: "archived" });
    setUnpublishOpen(false);
  }

  function confirmPublish(): void {
    if (!listing) {
      return;
    }
    setStatus(listing.id, "published");
    setListing({ ...listing, status: "published" });
    setPublishOpen(false);
  }

  function onOpenBookingCalendar(): void {
    setBookingCalendarOpen(true);
  }

  if (!listing || !display || tableStatus === null) {
    return <p className="font-sans">Загрузка…</p>;
  }

  return (
    <div className="flex h-full w-full flex-col gap-8 overflow-auto bg-amber-400/5 p-8 font-sans">
      <ListingPreviewHeader
        status={tableStatus}
        pending={pending}
        onBack={onBack}
        onEdit={() => navigate(`/listings/${listing.id}/edit?step=1`)}
        onDelete={() => setDeleteOpen(true)}
        onArchive={() => {
          void onArchive();
        }}
        onSubmit={() => {
          void onSubmit();
        }}
        onUnpublish={() => setUnpublishOpen(true)}
        onPublish={() => setPublishOpen(true)}
        onOpenBookingCalendar={onOpenBookingCalendar}
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
      <UnpublishAnnouncementDialog
        open={unpublishOpen}
        onClose={() => setUnpublishOpen(false)}
        onConfirm={confirmUnpublish}
      />
      <PublishAnnouncementDialog
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        onConfirm={confirmPublish}
      />
      <BookingCalendarAlert
        open={bookingCalendarOpen}
        onOpenChange={setBookingCalendarOpen}
      />
    </div>
  );
}
