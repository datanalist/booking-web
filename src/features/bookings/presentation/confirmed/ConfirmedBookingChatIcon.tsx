type ConfirmedBookingChatIconProps = {
  guestName: string;
};

export function ConfirmedBookingChatIcon({
  guestName,
}: ConfirmedBookingChatIconProps) {
  return (
    <button
      type="button"
      aria-label={`Чат с гостем ${guestName}`}
      className="inline-flex size-6 cursor-pointer items-center justify-center border-0 bg-transparent p-0"
      onClick={() => undefined}
    >
      <img
        src="/bookings/icon-chat-envelope.svg"
        alt=""
        width={24}
        height={24}
        className="size-6 object-contain"
        aria-hidden
      />
    </button>
  );
}
