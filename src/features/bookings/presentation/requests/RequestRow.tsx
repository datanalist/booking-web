import type { BookingRequest } from "../../domain/BookingRequest";
import { Button } from "../../../../ui/Button";
import { ChatEnvelopeIcon } from "./ChatEnvelopeIcon";

type RequestRowProps = {
  request: BookingRequest;
  onAccept: (id: BookingRequest["id"]) => void;
  onReject: (id: BookingRequest["id"]) => void;
};

export function RequestRow({ request, onAccept, onReject }: RequestRowProps) {
  return (
    <tr className="h-28 border-b border-amber-400/20 bg-white">
      <td className="w-56 px-5 align-middle">
        <div className="flex items-center gap-3">
          <img
            src={request.guestAvatarUrl}
            alt=""
            width={48}
            height={48}
            className="size-12 shrink-0 rounded-full object-cover"
          />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-sm text-[var(--color-ink)]">
              {request.guestName}
            </span>
            <span className="truncate text-xs text-neutral-600">
              {request.guestPhone}
            </span>
          </div>
        </div>
      </td>
      <td className="w-16 px-2 align-middle">
        <button
          type="button"
          aria-label={`Чат с ${request.guestName}`}
          className="inline-flex size-6 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-black"
          onClick={() => undefined}
        >
          <ChatEnvelopeIcon />
        </button>
      </td>
      <td className="w-72 px-5 align-middle">
        <div className="flex items-center gap-3">
          <img
            src={request.listingPhotoUrl}
            alt=""
            width={48}
            height={48}
            className="size-12 shrink-0 rounded-lg object-cover"
          />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-sm text-[var(--color-ink)]">
              {request.listingTitle}
            </span>
            <span className="truncate text-xs text-neutral-600">
              {request.listingAddress}
            </span>
          </div>
        </div>
      </td>
      <td className="w-36 whitespace-nowrap px-5 align-middle text-sm text-[var(--color-ink)]">
        {request.datesLabel}
      </td>
      <td className="w-28 whitespace-nowrap px-5 align-middle text-sm text-[var(--color-ink)]">
        {request.priceLabel}
      </td>
      <td className="px-5 align-middle">
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" onClick={() => onAccept(request.id)}>
            Принять
          </Button>
          <Button
            size="sm"
            variant="outlined"
            onClick={() => onReject(request.id)}
          >
            Отклонить
          </Button>
        </div>
      </td>
    </tr>
  );
}
