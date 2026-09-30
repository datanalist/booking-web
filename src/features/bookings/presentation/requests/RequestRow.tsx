import { Mail } from "lucide-react";
import type { BookingRequest } from "../../domain/BookingRequest";
import { Button } from "../../../../ui/Button";

type RequestRowProps = {
  request: BookingRequest;
  onAccept: (id: BookingRequest["id"]) => void;
  onReject: (id: BookingRequest["id"]) => void;
};

export function RequestRow({ request, onAccept, onReject }: RequestRowProps) {
  return (
    <tr className="h-[112px] border-b border-[rgba(26,27,29,0.08)]">
      <td className="px-4 py-3 align-middle">
        <div className="flex items-center gap-3">
          <img
            src={request.guestAvatarUrl}
            alt=""
            width={48}
            height={48}
            className="size-12 shrink-0 rounded-full object-cover"
          />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-[16px] font-bold leading-[1.2] text-[var(--color-ink)]">
              {request.guestName}
            </span>
            <span className="truncate text-[14px] leading-[1.4] text-[#525353]">
              {request.guestPhone}
            </span>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 align-middle">
        <button
          type="button"
          aria-label={`Чат с ${request.guestName}`}
          className="inline-flex size-10 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-[var(--color-accent)]"
          onClick={() => undefined}
        >
          <Mail className="size-5" aria-hidden />
        </button>
      </td>
      <td className="px-4 py-3 align-middle">
        <div className="flex items-center gap-3">
          <img
            src={request.listingPhotoUrl}
            alt=""
            width={48}
            height={48}
            className="size-12 shrink-0 rounded-lg object-cover"
          />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-[16px] font-bold leading-[1.2] text-[var(--color-ink)]">
              {request.listingTitle}
            </span>
            <span className="truncate text-[14px] leading-[1.4] text-[#525353]">
              {request.listingAddress}
            </span>
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3 align-middle text-[16px] text-[var(--color-ink)]">
        {request.datesLabel}
      </td>
      <td className="whitespace-nowrap px-4 py-3 align-middle text-[16px] font-bold text-[var(--color-ink)]">
        {request.priceLabel}
      </td>
      <td className="px-4 py-3 align-middle">
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
