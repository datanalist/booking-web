import { describe, expect, test } from "vitest";
import { createPbClient } from "../../../api/pocketbase";
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
});
