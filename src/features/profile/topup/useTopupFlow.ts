import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SESSION_KEY } from "../../../api/keys";
import { bumpCabinetBalanceEpoch } from "../../../api/pocketbase/refreshCabinetBalance";
import { refreshCabinetSession } from "../../../api/pocketbase/refreshCabinetSession";
import { useSession } from "../../../app/session";
import { isPaymentRecordId } from "../../../../vite/payments/yookassa";
import { parseTopupAmount } from "../../../../vite/payments/parseTopupAmount";
import type { TopupPhase } from "./TopupModal";
import { confirmTopup, requestTopup, TOPUP_OPEN_MESSAGE, TOPUP_REQUEST_TIMEOUT_MS } from "./topupApi";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function patchStoredBalance(balance: number): void {
  const raw = localStorage.getItem(SESSION_KEY);
  if (raw === null) {
    return;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) {
      return;
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify({ ...parsed, balance }));
  } catch {
    return;
  }
}

export function useTopupFlow(): {
  open: boolean;
  pending: boolean;
  phase: TopupPhase;
  message: string;
  openForm: () => void;
  close: () => void;
  submit: (amount: string) => void;
} {
  const { reload } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [phase, setPhase] = useState<TopupPhase>("form");
  const [message, setMessage] = useState("");
  const attempt = useRef(0);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearRedirectTimer(): void {
    if (redirectTimer.current !== null) {
      clearTimeout(redirectTimer.current);
      redirectTimer.current = null;
    }
  }

  useEffect(() => {
    function onPageShow(event: PageTransitionEvent): void {
      if (!event.persisted) {
        return;
      }
      attempt.current += 1;
      clearRedirectTimer();
      setPending(false);
    }
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.removeEventListener("pageshow", onPageShow);
      clearRedirectTimer();
    };
  }, []);

  async function applyBalance(balance: number | undefined): Promise<void> {
    bumpCabinetBalanceEpoch();
    try {
      await refreshCabinetSession(localStorage);
    } catch {
      if (typeof balance === "number" && Number.isFinite(balance)) {
        patchStoredBalance(balance);
      }
    }
    bumpCabinetBalanceEpoch();
    reload();
  }

  async function runConfirm(paymentId: string): Promise<void> {
    setOpen(true);
    setPhase("checking");
    setMessage("Проверяем оплату…");
    setPending(true);
    try {
      const result = await confirmTopup(paymentId);
      if (result.status === "succeeded" || result.status === "already") {
        await applyBalance(result.balance);
        setPhase("success");
      } else if (result.status === "canceled") {
        setPhase("canceled");
      } else {
        setPhase("pending");
      }
      setMessage(result.message);
    } catch (error) {
      setPhase("form");
      setMessage(error instanceof Error ? error.message : "Не удалось проверить платёж");
    } finally {
      setPending(false);
    }
  }

  useEffect(() => {
    const paymentId = searchParams.get("payment");
    if (paymentId === null || !isPaymentRecordId(paymentId)) {
      return;
    }
    const next = new URLSearchParams(searchParams);
    next.delete("payment");
    setSearchParams(next, { replace: true });
    void runConfirm(paymentId);
    // Подтверждение запускается один раз на идентификатор в адресе.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, setSearchParams]);

  function openForm(): void {
    clearRedirectTimer();
    setPhase("form");
    setMessage("");
    setPending(false);
    setOpen(true);
  }

  function close(): void {
    if (pending) {
      return;
    }
    clearRedirectTimer();
    setOpen(false);
  }

  function submit(amount: string): void {
    const parsed = parseTopupAmount(amount);
    if (!parsed.ok) {
      setMessage(parsed.message);
      return;
    }
    clearRedirectTimer();
    const current = attempt.current + 1;
    attempt.current = current;
    setMessage("");
    setPending(true);
    void requestTopup(parsed.rubles)
      .then(({ confirmationUrl }) => {
        if (attempt.current !== current) {
          return;
        }
        window.location.assign(confirmationUrl);
        redirectTimer.current = setTimeout(() => {
          if (attempt.current !== current) {
            return;
          }
          redirectTimer.current = null;
          setPending(false);
          setMessage(TOPUP_OPEN_MESSAGE);
        }, TOPUP_REQUEST_TIMEOUT_MS);
      })
      .catch((error: unknown) => {
        if (attempt.current !== current) {
          return;
        }
        setPending(false);
        setMessage(error instanceof Error ? error.message : "Не удалось создать платёж");
      });
  }

  return { open, pending, phase, message, openForm, close, submit };
}
