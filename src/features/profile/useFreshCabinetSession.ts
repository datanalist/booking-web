import { useEffect } from "react";
import { resolveCabinetDataSource } from "../../api/pocketbase/dataSource";
import {
  cabinetBalanceEpoch,
  refreshCabinetBalance,
} from "../../api/pocketbase/refreshCabinetBalance";
import { useSession } from "../../app/session";

/** При открытии профиля берёт users.balance, а не сумму из старой сессии. */
export function useFreshCabinetSession(userId: string | undefined): void {
  const { reload } = useSession();

  useEffect(() => {
    if (resolveCabinetDataSource() !== "pocketbase" || userId === undefined || userId.length === 0) {
      return;
    }
    const seen = cabinetBalanceEpoch();
    let cancelled = false;
    const isCurrent = (): boolean => !cancelled && seen === cabinetBalanceEpoch();
    refreshCabinetBalance(localStorage, isCurrent)
      .then(() => {
        if (isCurrent()) {
          reload();
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [reload, userId]);
}
