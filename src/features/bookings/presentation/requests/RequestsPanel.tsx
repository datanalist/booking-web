import { useMemo, useState } from "react";
import { BOOKING_REQUEST_MOCKS } from "../../data/bookingRequestMocks";
import type {
  BookingRequest,
  BookingRequestId,
} from "../../domain/BookingRequest";
import { BookingsEmptyPanel } from "../BookingsEmptyPanel";
import { AcceptRequestModal } from "./AcceptRequestModal";
import { filterBookingRequests } from "./filterBookingRequests";
import { RejectRequestModal } from "./RejectRequestModal";
import { RequestsTable } from "./RequestsTable";

type RequestsPanelProps = {
  query: string;
  forceEmpty: boolean;
};

export function RequestsPanel({ query, forceEmpty }: RequestsPanelProps) {
  const [items, setItems] = useState<BookingRequest[]>(() => [
    ...BOOKING_REQUEST_MOCKS,
  ]);
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [rejectId, setRejectId] = useState<BookingRequestId | null>(null);

  const visible = useMemo(() => {
    if (forceEmpty) {
      return [];
    }
    return filterBookingRequests(items, query);
  }, [forceEmpty, items, query]);

  function handleAccept(id: BookingRequestId): void {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setAcceptOpen(true);
  }

  function handleRejectSubmit(): void {
    if (!rejectId) {
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== rejectId));
    setRejectId(null);
  }

  if (visible.length === 0) {
    return (
      <>
        <BookingsEmptyPanel
          title="Нет заявок"
          description="Заявки на бронирование жилья появятся здесь!"
        />
        <AcceptRequestModal
          open={acceptOpen}
          onClose={() => setAcceptOpen(false)}
        />
        <RejectRequestModal
          open={rejectId !== null}
          onClose={() => setRejectId(null)}
          onSubmit={() => handleRejectSubmit()}
        />
      </>
    );
  }

  return (
    <>
      <RequestsTable
        items={visible}
        onAccept={handleAccept}
        onReject={setRejectId}
      />
      <AcceptRequestModal
        open={acceptOpen}
        onClose={() => setAcceptOpen(false)}
      />
      <RejectRequestModal
        open={rejectId !== null}
        onClose={() => setRejectId(null)}
        onSubmit={() => handleRejectSubmit()}
      />
    </>
  );
}
