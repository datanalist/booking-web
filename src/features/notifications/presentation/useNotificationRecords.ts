import { useEffect, useSyncExternalStore } from "react";
import type { PbNotificationRecord } from "../../chat/pocketbase";
import {
  ensureNotificationInbox,
  getNotificationRecords,
  markNotificationRead,
  subscribeNotificationRecords,
} from "../pocketbase/notificationInboxStore";

export { markNotificationRead };

export function useNotificationRecords(): readonly PbNotificationRecord[] | null {
  const records = useSyncExternalStore(
    subscribeNotificationRecords,
    getNotificationRecords,
    getNotificationRecords,
  );
  useEffect(() => {
    ensureNotificationInbox();
  }, []);
  return records;
}

export function useUnreadNotificationCount(): number | null {
  const records = useNotificationRecords();
  if (records === null) {
    return null;
  }
  return records.filter((record) => record.read !== true).length;
}
