export const EMPTY_INBOX_SUBTITLE =
  "Уведомления об объявлениях и бронированиях появятся здесь";

export const EMPTY_UNREAD_SUBTITLE = "Все уведомления прочитаны";

type NotificationsEmptyProps = {
  subtitle: string | null;
};

export function NotificationsEmpty({ subtitle }: NotificationsEmptyProps) {
  return (
    <section className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-6 rounded-2xl border border-[rgba(251,192,40,0.17)] bg-white">
      <img
        data-testid="notifications-empty-art"
        src="/notifications-empty.svg"
        alt=""
        width={228.846}
        height={200}
      />
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="m-0 text-[24px] font-bold leading-[1.2] text-[#1a1b1d]">
          Нет уведомлений
        </h2>
        {subtitle !== null && subtitle.length > 0 ? (
          <p className="m-0 text-[16px] font-normal leading-[1.45] text-[#525353]">
            {subtitle}
          </p>
        ) : null}
      </div>
    </section>
  );
}
