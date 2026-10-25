import { useSearchParams } from "react-router-dom";
import { parseNotificationTab, type NotificationTabId } from "../domain/notificationTab";
import { buildNotificationInbox } from "../pocketbase/notificationInbox";
import { NotificationList } from "./NotificationList";
import { NotificationTabs } from "./NotificationTabs";
import { EMPTY_INBOX_SUBTITLE, EMPTY_UNREAD_SUBTITLE, NotificationsEmpty } from "./NotificationsEmpty";
import { markNotificationRead, useNotificationRecords } from "./useNotificationRecords";

export function NotificationsPage() {
  const [params, setParams] = useSearchParams();
  const requested = parseNotificationTab(params.get("tab"));
  const records = useNotificationRecords();
  const items = records === null
    ? null
    : buildNotificationInbox(records, requested, new Date());
  const inboxEmpty = records !== null && records.length === 0;
  const filterEmpty = (requested === "unread" || requested === "read")
    && records !== null
    && records.length > 0
    && items !== null
    && items.length === 0;

  function selectTab(tab: NotificationTabId): void {
    const next = new URLSearchParams(params);
    if (tab === "all") {
      next.delete("tab");
    } else {
      next.set("tab", tab);
    }
    setParams(next);
  }

  return (
    <div className="flex h-full w-full flex-col gap-8 bg-[rgba(251,192,40,0.06)] p-8 font-sans">
      <header className="flex h-10 shrink-0 items-center">
        <h1 className="m-0 text-[24px] font-bold leading-[1.2] text-[#1a1b1d]">
          Уведомления
        </h1>
      </header>
      {items === null ? null : inboxEmpty ? (
        <NotificationsEmpty subtitle={EMPTY_INBOX_SUBTITLE} />
      ) : (
        <div className="flex min-h-0 w-full flex-1 flex-col gap-5">
          <NotificationTabs value={requested} onChange={selectTab} />
          {filterEmpty ? (
            <NotificationsEmpty
              subtitle={requested === "unread" ? EMPTY_UNREAD_SUBTITLE : null}
            />
          ) : (
            <NotificationList
              items={items}
              onMarkRead={(id) => {
                void markNotificationRead(id);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

