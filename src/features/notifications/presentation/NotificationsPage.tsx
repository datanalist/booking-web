import { EMPTY_INBOX_SUBTITLE, NotificationsEmpty } from "./NotificationsEmpty";

export function NotificationsPage() {
  return (
    <div className="flex h-full w-full flex-col gap-8 bg-[rgba(251,192,40,0.06)] p-8 font-sans">
      <header className="flex h-10 shrink-0 items-center">
        <h1 className="m-0 text-[24px] font-bold leading-[1.2] text-[#1a1b1d]">
          Уведомления
        </h1>
      </header>
      <NotificationsEmpty subtitle={EMPTY_INBOX_SUBTITLE} />
    </div>
  );
}
