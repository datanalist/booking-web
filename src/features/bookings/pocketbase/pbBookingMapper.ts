import type { BookingRequest } from "../domain/BookingRequest";
import { bookingRequestId } from "../domain/BookingRequest";
import type { RejectedBooking } from "../domain/RejectedBooking";
import { rejectedBookingId } from "../domain/RejectedBooking";
import type { CancelledBooking } from "../presentation/cancelled/CancelledBooking";
import type { ConfirmedBooking } from "../presentation/confirmed/ConfirmedBooking";
import { confirmedBookingId } from "../presentation/confirmed/ConfirmedBookingId";
import type { BookingReview } from "../presentation/confirmed/review/BookingReview";
import type { RequestDecision } from "../presentation/confirmed/request/RequestDecision";
import type { PbBookingCard } from "./pbBookingDisplay";
import { pbBookingCard } from "./pbBookingDisplay";
import { pbConfirmedStatus } from "./pbBookingStatus";
import type {
  PbAcceptBookingPayload,
  PbBookingRecord,
  PbHostCancelPayload,
  PbResolveBookingRequestPayload,
  PbReviewCreatePayload,
} from "./pbBookingTypes";

const CANCEL_COMMENT_MAX_LENGTH = 500;

function listedBooking<Id extends string>(id: Id, card: PbBookingCard) {
  return {
    id,
    guestName: card.guestName,
    guestPhone: card.guestPhone,
    guestAvatarUrl: card.guestAvatarUrl,
    listingTitle: card.listingTitle,
    listingAddress: card.listingAddress,
    listingPhotoUrl: card.listingPhotoUrl,
    datesLabel: card.datesLabel,
    priceLabel: card.priceLabel,
  };
}

function isHostRejection(record: PbBookingRecord): boolean {
  return (
    record.status === "cancelled" &&
    record.prepaid_at.trim() === "" &&
    (record.cancel_reason === "host" || record.cancel_reason === "host_timeout")
  );
}

function isCancelledTab(record: PbBookingRecord): boolean {
  return record.status === "cancelled" && !isHostRejection(record);
}

export function pbBookingToRequest(
  record: PbBookingRecord,
  baseUrl?: string,
): BookingRequest | null {
  if (record.status !== "pending_host") return null;
  const card = pbBookingCard(record, baseUrl);
  if (card === null) return null;
  return listedBooking(bookingRequestId(record.id), card);
}

export function pbBookingToConfirmed(
  record: PbBookingRecord,
  now: Date = new Date(),
  baseUrl?: string,
): ConfirmedBooking | null {
  const status = pbConfirmedStatus(record, now);
  if (status === null) return null;
  const card = pbBookingCard(record, baseUrl);
  if (card === null) return null;
  return {
    id: confirmedBookingId(record.id),
    guestName: card.guestName,
    guestPhone: card.guestPhone,
    guestAvatarUrl: card.guestAvatarUrl,
    housingTitle: card.listingTitle,
    housingAddress: card.listingAddress,
    housingPhotoUrl: card.listingPhotoUrl,
    stay: card.stay,
    priceLabel: card.priceLabel,
    status,
  };
}

export function pbBookingToRejected(
  record: PbBookingRecord,
  baseUrl?: string,
): RejectedBooking | null {
  if (!isHostRejection(record)) return null;
  const card = pbBookingCard(record, baseUrl);
  if (card === null) return null;
  return listedBooking(rejectedBookingId(record.id), card);
}

export function pbBookingToCancelled(
  record: PbBookingRecord,
  baseUrl?: string,
): CancelledBooking | null {
  if (!isCancelledTab(record)) return null;
  const card = pbBookingCard(record, baseUrl);
  if (card === null) return null;
  return {
    id: record.id,
    guestName: card.guestName,
    guestPhone: card.guestPhone,
    guestAvatarUrl: card.guestAvatarUrl,
    housingTitle: card.listingTitle,
    housingAddress: card.listingAddress,
    housingPhotoUrl: card.listingPhotoUrl,
    datesLabel: card.datesLabel,
    price: card.price,
  };
}

function hostCancelPayload(comment: string): PbHostCancelPayload {
  return {
    status: "cancelled",
    cancel_reason: "host",
    cancel_comment: comment.trim().slice(0, CANCEL_COMMENT_MAX_LENGTH),
  };
}

export function buildAcceptBookingRequestPayload(): PbAcceptBookingPayload {
  return { status: "awaiting_prepayment" };
}

export function buildRejectBookingRequestPayload(comment: string): PbHostCancelPayload {
  return hostCancelPayload(comment);
}

export function buildHostCancelBookingPayload(comment: string): PbHostCancelPayload {
  return hostCancelPayload(comment);
}

export function buildResolveBookingRequestPayload(
  booking: ConfirmedBooking,
  decision: RequestDecision,
): PbResolveBookingRequestPayload {
  if (booking.status.kind !== "request") {
    throw new Error("Booking has no open request");
  }
  const { request } = booking.status;
  switch (request.kind) {
    case "cancel":
      return decision === "accept"
        ? { status: "cancelled", cancel_reason: "guest" }
        : { status: "confirmed" };
    case "changeDates":
      return decision === "accept"
        ? {
            status: "confirmed",
            check_in: request.proposedStay.checkIn,
            check_out: request.proposedStay.checkOut,
          }
        : {
            status: "confirmed",
            requested_check_in: "",
            requested_check_out: "",
          };
  }
}

export function buildHostGuestReviewPayload(input: {
  review: BookingReview;
  authorId: string;
  guestId?: string;
  listingId?: string;
}): PbReviewCreatePayload {
  const payload: PbReviewCreatePayload = {
    kind: "guest",
    booking: input.review.bookingId,
    author: input.authorId,
    rating: input.review.rating,
    comment: input.review.comment,
  };
  if (input.guestId !== undefined && input.guestId !== "") {
    payload.subject = input.guestId;
  }
  if (input.listingId !== undefined && input.listingId !== "") {
    payload.listing = input.listingId;
  }
  return payload;
}
