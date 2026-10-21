import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSession } from "../app/session";
import { resolveCabinetDataSource } from "../api/pocketbase/dataSource";
import type { Listing } from "../api/types";
import {
  BookingCalendarAlert,
  DeleteAnnouncementDialog,
  listingTableRowFromListing,
  ListingPreviewHeader,
  ListingPreviewView,
  listingsLocationStateFromOrigin,
  parseListingOriginState,
  listingTableStatusFromApi,
  type ListingPreviewLocationState,
  ModerationSentDialog,
  PublishAnnouncementDialog,
  resolveListingForPreview,
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
  const location = useLocation();
  const [listing, setListing] = useState<Listing | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteOpenedAt = useRef(0);
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
      let apiListing: Listing | null = null;
      try {
        apiListing = await listings.get(id);
      } catch {
        apiListing = null;
      }
      const resolved = resolveListingForPreview(
        tableRow,
        apiListing,
        session?.userId ?? "local-preview",
      );
      if (cancelled) {
        return;
      }
      if (resolved === null) {
        navigate("/listings");
        return;
      }
      setListing(resolved);
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

  const tableRow = listing
    ? items.find((item) => item.id === listing.id)
    : undefined;
  const tableStatus = tableRow
    ? tableRow.status
    : listing
      ? listingTableStatusFromApi(listing.status)
      : null;

  function goToListings(tab?: ListingsLocationState["tab"]): void {
    const state: ListingsLocationState | undefined =
      tab === undefined ? undefined : { tab };
    navigate("/listings", { state });
  }

  function onBack(): void {
    goToListings(listingsLocationStateFromOrigin(location.state)?.tab);
  }

  function navigateToEdit(listingId: string, step: number): void {
    const state: ListingPreviewLocationState = parseListingOriginState(
      location.state,
    );
    navigate(`/listings/${listingId}/edit?step=${step}`, { state });
  }

  async function onSubmit(): Promise<void> {
    if (!listing) {
      return;
    }
    const invalid = firstInvalidStep(listing);
    if (invalid !== null) {
      setSubmitError(`Заполните шаг ${invalid}`);
      navigateToEdit(listing.id, invalid);
      return;
    }
    setPending(true);
    setSubmitError("");
    try {
      const updated = await listings.submitForModeration(listing.id);
      setListing(updated);
      upsert(listingTableRowFromListing(updated));
      setModerationOpen(true);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message.trim() : "";
      setSubmitError(
        message.length > 0 ? message : "Не удалось отправить на модерацию",
      );
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
    if (resolveCabinetDataSource() === "pocketbase") {
      setStatus(listing.id, "moderation");
      setListing({ ...listing, status: "moderation" });
      setPublishOpen(false);
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
        onEdit={() => navigateToEdit(listing.id, 1)}
        onDelete={() => {
          deleteOpenedAt.current = Date.now();
          setDeleteOpen(true);
        }}
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
        onClose={() => {
          if (Date.now() - deleteOpenedAt.current < 400) {
            return;
          }
          setDeleteOpen(false);
        }}
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
        listingId={id ?? "preview"}
      />
    </div>
  );
}
