import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SESSION_KEY } from "../../../api/keys";
import { createCabinetPbClient, resolveCabinetDataSource } from "../../../api/pocketbase";
import type { PbNotificationRecord } from "../../chat/pocketbase";
import { parseNotificationTab, type NotificationTabId } from "../domain/notificationTab";
import { buildNotificationInbox } from "../pocketbase/notificationInbox";
import { createPbNotificationSource } from "../pocketbase/createPbNotificationSource";
import { NotificationList } from "./NotificationList";
import { NotificationTabs } from "./NotificationTabs";
import { EMPTY_INBOX_SUBTITLE, EMPTY_UNREAD_SUBTITLE, NotificationsEmpty } from "./NotificationsEmpty";

export function NotificationsPage() {
  const [params, setParams] = useSearchParams();
  const requested = parseNotificationTab(params.get("tab"));
  const records = useNotificationRecords();
  const items = records === null
    ? null
    : buildNotificationInbox(records, requested === "unread" ? "unread" : "all", new Date());
  const inboxEmpty = records !== null && records.length === 0;
  const unreadEmpty = requested === "unread"
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
          {unreadEmpty ? (
            <NotificationsEmpty subtitle={EMPTY_UNREAD_SUBTITLE} />
          ) : (
            <NotificationList items={items} />
          )}
        </div>
      )}
    </div>
  );
}

function useNotificationRecords(): readonly PbNotificationRecord[] | null {
  const pocketbase = resolveCabinetDataSource() === "pocketbase";
  const [records, setRecords] = useState<readonly PbNotificationRecord[] | null>(() => {
    if (!pocketbase) {
      return [];
    }
    return readSessionUserId() === null ? [] : null;
  });

  useEffect(() => {
    if (!pocketbase) {
      return;
    }
    const userId = readSessionUserId();
    if (userId === null) {
      setRecords([]);
      return;
    }
    let cancelled = false;
    createPbNotificationSource(createCabinetPbClient())
      .list(userId)
      .then((items) => {
        if (!cancelled) {
          setRecords(items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRecords([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [pocketbase]);

  return records;
}

function readSessionUserId(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw === null) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }
    const userId = Reflect.get(parsed, "userId");
    return typeof userId === "string" && userId.length > 0 ? userId : null;
  } catch {
    return null;
  }
}
