import type { PbClient } from "../../../api/pocketbase";
import type { BookingsSnapshot, BookingsSource } from "./bookingsSource";
import type { BookingReview } from "../presentation/confirmed/review/BookingReview";
import {
  buildAcceptBookingRequestPayload,
  buildHostCancelBookingPayload,
  buildHostGuestReviewPayload,
  buildRejectBookingRequestPayload,
  buildResolveBookingRequestPayload,
  pbBookingToCancelled,
  pbBookingToConfirmed,
  pbBookingToRejected,
  pbBookingToRequest,
  pbReviewToBookingReview,
} from "./pbBookingMapper";
import type { PbBookingRecord, PbReviewRecord } from "./pbBookingTypes";

export function createPbBookingsSource(client: PbClient): BookingsSource {
  return {
    async load(hostId) {
      const listed = await client.listRecords<PbBookingRecord>("bookings", {
        filter: `host="${hostId}"`,
        expand: "guest,listing",
        perPage: 50,
        sort: "-created",
      });
      const now = new Date();
      const requests: BookingsSnapshot["requests"][number][] = [];
      const confirmed: BookingsSnapshot["confirmed"][number][] = [];
      const rejected: BookingsSnapshot["rejected"][number][] = [];
      const cancelled: BookingsSnapshot["cancelled"][number][] = [];
      for (const record of listed.items) {
        const request = pbBookingToRequest(record, client.baseUrl);
        if (request !== null) requests.push(request);
        const confirmedRow = pbBookingToConfirmed(record, now, client.baseUrl);
        if (confirmedRow !== null) confirmed.push(confirmedRow);
        const rejectedRow = pbBookingToRejected(record, client.baseUrl);
        if (rejectedRow !== null) rejected.push(rejectedRow);
        const cancelledRow = pbBookingToCancelled(record, client.baseUrl);
        if (cancelledRow !== null) cancelled.push(cancelledRow);
      }
      return {
        requests,
        confirmed,
        rejected,
        cancelled,
        guestReviews: await listHostGuestReviews(client, hostId),
      };
    },
    async accept(id) {
      await client.updateRecord("bookings", id, buildAcceptBookingRequestPayload());
    },
    async reject(id, comment) {
      await client.updateRecord("bookings", id, buildRejectBookingRequestPayload(comment));
    },
    async hostCancel(id, comment) {
      await client.updateRecord("bookings", id, buildHostCancelBookingPayload(comment));
    },
    async resolveRequest(booking, decision) {
      await client.updateRecord(
        "bookings",
        booking.id,
        buildResolveBookingRequestPayload(booking, decision),
      );
    },
    async createGuestReview(review, links) {
      await client.createRecord(
        "reviews",
        buildHostGuestReviewPayload({
          review,
          authorId: links.authorId,
          guestId: links.guestId,
          listingId: links.listingId,
        }),
      );
    },
  };
}

async function listHostGuestReviews(
  client: PbClient,
  hostId: string,
): Promise<BookingReview[]> {
  const filter = `author="${hostId}" && kind="guest"`;
  const reviews: BookingReview[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const listed = await client.listRecords<PbReviewRecord>("reviews", {
      filter,
      page,
      perPage: 200,
    });
    totalPages = listed.totalPages;
    for (const item of listed.items) {
      const review = pbReviewToBookingReview(item);
      if (review !== null) reviews.push(review);
    }
    page += 1;
  } while (page <= totalPages);
  return reviews;
}
