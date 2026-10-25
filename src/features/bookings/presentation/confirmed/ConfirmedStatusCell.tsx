import { Button } from "../../../../ui/Button";
import {
  CONFIRMED_BOOKING_STATUS_LABELS,
  type ConfirmedBookingStatus,
} from "./confirmedBookingStatus";

type ConfirmedStatusCellProps = {
  status: ConfirmedBookingStatus;
};

function badgeClass(status: ConfirmedBookingStatus): string {
  switch (status.kind) {
    case "awaitingPrepayment":
      return "bg-indigo-600/25";
    case "prepaymentPaid":
      return "bg-green-500/30";
    case "stayCompleted":
      return "border border-orange-200 bg-transparent";
    case "staying":
      return "bg-blue-400/30";
    case "request":
      return "";
  }
}

export function ConfirmedStatusCell({ status }: ConfirmedStatusCellProps) {
  if (status.kind === "request") {
    return (
      <div className="flex flex-col items-start justify-center gap-1">
        <Button size="sm" type="button" onClick={() => undefined}>
          {CONFIRMED_BOOKING_STATUS_LABELS.request}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start justify-center gap-1">
      <span
        className={`inline-flex w-max shrink-0 items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-xs leading-4 text-[var(--color-ink)] ${badgeClass(status)}`}
      >
        {CONFIRMED_BOOKING_STATUS_LABELS[status.kind]}
      </span>
      {status.kind === "awaitingPrepayment" ? (
        <span className="text-xs leading-4 text-[#525353]">
          {status.remainingLabel}
        </span>
      ) : null}
    </div>
  );
}
