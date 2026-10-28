import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { rub } from "../../../lib/money";
import { bookingRequestId } from "../domain/BookingRequest";
import { rejectedBookingId } from "../domain/RejectedBooking";
import { CancelledBookingRow } from "./cancelled/CancelledBookingRow";
import { ConfirmedBookingRow } from "./confirmed/ConfirmedBookingRow";
import { confirmedBookingFixture } from "./confirmed/confirmedBookingFixture";
import type { ConfirmedBookingRowActions } from "./confirmed/menu/ConfirmedBookingRowActions";
import { BookingRequestGuestSection } from "./confirmed/request/BookingRequestGuestSection";
import type { ConfirmedRequestBooking } from "./confirmed/request/ConfirmedRequestBooking";
import { ReviewModal } from "./confirmed/review/ReviewModal";
import { RejectedBookingRow } from "./rejected/RejectedBookingRow";
import { RequestRow } from "./requests/RequestRow";

const SILHOUETTE = "/onboarding/avatar-placeholder.svg";
const REMOTE = "https://pb.example/api/files/users/g1/ava.jpg";
const STOCK = "https://pb.example/api/files/users/g1/avatar-placeholder.png";
const LOCAL = "/bookings/guest-anna.jpg";

const actions: ConfirmedBookingRowActions = {
  openMenuId: null,
  onToggleMenu: () => undefined,
  onCloseMenu: () => undefined,
  onOpenDialog: () => undefined,
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function portrait(root: ParentNode): HTMLImageElement {
  const img = root.querySelector("img.rounded-full");
  if (!(img instanceof HTMLImageElement)) {
    throw new Error("нет портрета гостя");
  }
  return img;
}

function renderRequest(url: string): HTMLElement {
  const view = render(
    <table>
      <tbody>
        <RequestRow
          request={{
            id: bookingRequestId("q1"),
            guestName: "Анна",
            guestPhone: "+7",
            guestAvatarUrl: url,
            listingTitle: "Жильё",
            listingAddress: "Адрес",
            listingPhotoUrl: "/h.jpg",
            datesLabel: "1-2",
            priceLabel: "100 ₽",
          }}
          onAccept={() => undefined}
          onReject={() => undefined}
        />
      </tbody>
    </table>,
  );
  return view.container;
}

function renderConfirmed(url: string): HTMLElement {
  const view = render(
    <ConfirmedBookingRow
      booking={{ ...confirmedBookingFixture("b1", { kind: "prepaymentPaid" }), guestAvatarUrl: url }}
      actions={actions}
    />,
  );
  return view.container;
}

function renderRejected(url: string): HTMLElement {
  const view = render(
    <RejectedBookingRow
      booking={{
        id: rejectedBookingId("r1"),
        guestName: "Анна",
        guestPhone: "+7",
        guestAvatarUrl: url,
        listingTitle: "Жильё",
        listingAddress: "Адрес",
        listingPhotoUrl: "/h.jpg",
        datesLabel: "1-2",
        priceLabel: "100 ₽",
      }}
    />,
  );
  return view.container;
}

function renderCancelled(url: string): HTMLElement {
  const view = render(
    <table>
      <tbody>
        <CancelledBookingRow
          booking={{
            id: "c1",
            guestName: "Анна",
            guestPhone: "+7",
            guestAvatarUrl: url,
            housingTitle: "Жильё",
            housingAddress: "Адрес",
            housingPhotoUrl: "/h.jpg",
            datesLabel: "1-2",
            price: rub(100),
          }}
        />
      </tbody>
    </table>,
  );
  return view.container;
}

function renderGuestSection(url: string): HTMLElement {
  const booking: ConfirmedRequestBooking = {
    ...confirmedBookingFixture("b1", {
      kind: "request",
      previousStatus: { kind: "prepaymentPaid" },
      request: { kind: "cancel" },
    }),
    guestAvatarUrl: url,
  };
  const view = render(<BookingRequestGuestSection booking={booking} />);
  return view.container;
}

function renderReview(url: string): HTMLElement {
  render(
    <ReviewModal
      booking={{ ...confirmedBookingFixture("b1", { kind: "prepaymentPaid" }), guestAvatarUrl: url }}
      onClose={() => undefined}
      onSubmit={() => undefined}
    />,
  );
  return screen.getByRole("dialog");
}

const surfaces: ReadonlyArray<[string, (url: string) => HTMLElement]> = [
  ["заявка", renderRequest],
  ["подтверждённая бронь", renderConfirmed],
  ["отклонённая бронь", renderRejected],
  ["отменённая бронь", renderCancelled],
  ["карточка клиента", renderGuestSection],
  ["отзыв", renderReview],
];

test.each(surfaces)("%s: стоковый png — силуэт", (_name, renderGuest) => {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  expect(portrait(renderGuest(STOCK))).toHaveAttribute("src", SILHOUETTE);
  expect(fetchMock).not.toHaveBeenCalled();
});

test.each(surfaces)("%s: локальный файл показываем сразу", (_name, renderGuest) => {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  expect(portrait(renderGuest(LOCAL))).toHaveAttribute("src", LOCAL);
  expect(fetchMock).not.toHaveBeenCalled();
});

test.each(surfaces)("%s: недоступный файл — силуэт", async (_name, renderGuest) => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 404 })));
  const root = renderGuest(REMOTE);
  expect(portrait(root)).toHaveAttribute("src", SILHOUETTE);
  await waitFor(() => expect(fetch).toHaveBeenCalledWith(REMOTE, { cache: "no-store" }));
  expect(portrait(root)).toHaveAttribute("src", SILHOUETTE);
});

test.each(surfaces)("%s: живой файл показываем после проверки", async (_name, renderGuest) => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 200 })));
  const root = renderGuest(REMOTE);
  await waitFor(() => {
    expect(portrait(root)).toHaveAttribute("src", REMOTE);
  });
});
