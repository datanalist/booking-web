import { describe, expect, test } from "vitest";
import { createPbClient } from "../../../api/pocketbase";
import { confirmedBookingId } from "../presentation/confirmed/ConfirmedBookingId";
import { createPbBookingsSource } from "./createPbBookingsSource";

const pending = {
  id: "bk1",
  status: "pending_host",
  listing: "lst1",
  guest: "gst1",
  host: "user1",
  check_in: "2026-11-14",
  check_out: "2026-11-19",
  adults: 2,
  children: 0,
  pets: 0,
  total: 15460,
  prepay: 0,
  remainder: 0,
  commission: 0,
  host_amount: 0,
  guest_note: "",
  prepaid_at: "",
  cancel_reason: "",
  cancel_comment: "",
  host_respond_until: "",
  prepay_until: "",
  requested_check_in: "",
  requested_check_out: "",
  expand: {
    guest: { id: "gst1", name: "Петр Петров", phone: "+79001234567", avatar: "" },
    listing: { id: "lst1", title: "У моря", address: "Сочи", city: "Сочи", photos: [] },
  },
};

describe("createPbBookingsSource", () => {
  test("pending_host попадает в заявки", async () => {
    const client = createPbClient({
      baseUrl: "https://pb.example",
      fetchFn: async () => new Response(JSON.stringify({
        page: 1, perPage: 50, totalItems: 1, totalPages: 1, items: [pending],
      }), { status: 200 }),
    });
    const snapshot = await createPbBookingsSource(client).load("user1");
    expect(snapshot.requests).toHaveLength(1);
    expect(snapshot.confirmed).toHaveLength(0);
    expect(snapshot.guestReviews).toEqual([]);
  });

  test("load читает отзывы хозяина kind guest", async () => {
    const client = createPbClient({
      baseUrl: "https://pb.example",
      fetchFn: async (input) => {
        const url = String(input);
        const items = url.includes("/api/collections/reviews/")
          ? [{
              booking: "bk-done",
              author: "user1",
              subject: "gst1",
              kind: "guest",
              rating: 4,
              comment: "Тихий гость",
            }]
          : [];
        return new Response(JSON.stringify({
          page: 1,
          perPage: 50,
          totalItems: items.length,
          totalPages: 1,
          items,
        }), { status: 200 });
      },
    });
    const snapshot = await createPbBookingsSource(client).load("user1");
    expect(snapshot.guestReviews).toEqual([{
      bookingId: confirmedBookingId("bk-done"),
      rating: 4,
      comment: "Тихий гость",
    }]);
  });

  test("accept шлёт awaiting_prepayment", async () => {
    let body = "";
    const client = createPbClient({
      baseUrl: "https://pb.example",
      fetchFn: async (_input, init) => {
        body = String(init?.body ?? "");
        return new Response("{}", { status: 200 });
      },
    });
    await createPbBookingsSource(client).accept("bk1");
    expect(body).toContain("awaiting_prepayment");
  });

  test("createGuestReview пишет отзыв kind guest в reviews", async () => {
    let url = "";
    let body = "";
    const client = createPbClient({
      baseUrl: "https://pb.example",
      fetchFn: async (input, init) => {
        url = String(input);
        body = String(init?.body ?? "");
        return new Response(JSON.stringify({ id: "rev1" }), { status: 200 });
      },
    });
    await createPbBookingsSource(client).createGuestReview(
      {
        bookingId: confirmedBookingId("bk-done"),
        rating: 5,
        comment: "Ок",
      },
      { authorId: "user1", guestId: "gst1", listingId: "lst1" },
    );
    expect(url).toContain("/api/collections/reviews/records");
    expect(JSON.parse(body)).toEqual({
      kind: "guest",
      booking: "bk-done",
      author: "user1",
      subject: "gst1",
      listing: "lst1",
      rating: 5,
      comment: "Ок",
    });
  });
});
