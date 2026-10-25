import { notificationShowsPin } from "../pocketbase/notificationInbox";
import type { NotificationItem } from "../domain/notificationItem";

type NotificationCardProps = {
  item: NotificationItem;
};

export function NotificationCard({ item }: NotificationCardProps) {
  const pin = notificationShowsPin(item);
  return (
    <article className="flex w-full flex-col gap-2 overflow-hidden rounded-2xl border border-[rgba(251,192,40,0.17)] bg-[rgba(251,192,40,0.06)] p-3">
      <div className="flex w-full items-start justify-between gap-[10px]">
        <div className={`flex min-w-0 items-center ${pin ? "gap-[9px]" : ""}`}>
          {pin ? (
            <img
              src="/notifications-unread-pin.svg"
              alt=""
              width={7}
              height={7}
              className="shrink-0"
            />
          ) : null}
          <h2 className="m-0 text-[16px] font-bold leading-[1.2] text-[#1a1b1d]">
            {item.title}
          </h2>
        </div>
        <time
          dateTime={item.receivedAt}
          className="shrink-0 text-[14px] font-normal leading-[1.4] text-[#525353]"
        >
          {item.timeLabel}
        </time>
      </div>
      {item.body.length > 0 ? (
        <p className="m-0 w-full text-[14px] font-normal leading-[1.4] text-[#1a1b1d]">
          {item.body}
        </p>
      ) : null}
    </article>
  );
}
