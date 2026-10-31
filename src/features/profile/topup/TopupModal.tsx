import { useEffect, useId, useRef, type FormEvent, type ReactElement, type RefObject } from "react";
import { useFocusTrap } from "../../listings/useFocusTrap";
import { StagePortal } from "../../../app/stagePortal";

export type TopupPhase = "form" | "checking" | "success" | "pending" | "canceled";

export type TopupModalProps = {
  open: boolean;
  pending: boolean;
  phase: TopupPhase;
  message: string;
  onClose: () => void;
  onSubmit: (amount: string) => void;
};

const CARD_SHADOW =
  "shadow-[0px_20px_24px_-4px_rgba(16,24,40,0.08),0px_8px_8px_-4px_rgba(16,24,40,0.03)]";

type TopupDialogProps = TopupModalProps & {
  titleId: string;
  cardRef: RefObject<HTMLDivElement | null>;
};

function TopupDialog({
  pending,
  phase,
  message,
  onClose,
  onSubmit,
  titleId,
  cardRef,
}: TopupDialogProps): ReactElement {
  const amountId = useId();

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (pending) {
      return;
    }
    const data = new FormData(event.currentTarget);
    const amount = data.get("amount");
    onSubmit(typeof amount === "string" ? amount : "");
  }

  return (
    <StagePortal>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#525353]/80 font-sans"
        role="presentation"
        onClick={() => {
          if (!pending) {
            onClose();
          }
        }}
      >
        <div
          ref={cardRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className={`relative flex w-[438px] max-w-[calc(100%-32px)] flex-col items-center gap-8 overflow-hidden rounded-xl bg-white p-6 ${CARD_SHADOW}`}
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          <div className="flex w-full items-start justify-between">
            <h2 id={titleId} className="m-0 flex-1 text-[24px] font-bold leading-[28px] text-[#1a1b1d]">
              Пополнение баланса
            </h2>
            <button
              type="button"
              aria-label="Закрыть"
              disabled={pending}
              className="flex shrink-0 items-center justify-center rounded-lg border-0 bg-transparent p-2.5 disabled:opacity-50"
              onClick={onClose}
            >
              <img src="/profile/icon-close.svg" alt="" width={20} height={20} />
            </button>
          </div>
          {phase === "form" ? (
            <form className="flex w-full flex-col gap-6" onSubmit={submit}>
              <div className="flex w-full flex-col gap-1">
                <label htmlFor={amountId} className="text-[14px] font-normal text-[#1a1b1d]">
                  Сумма, ₽
                </label>
                <input
                  id={amountId}
                  name="amount"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={1000000}
                  step={1}
                  required
                  autoComplete="off"
                  disabled={pending}
                  placeholder="Введите сумму"
                  className="box-border h-11 w-full rounded-lg border border-[#d0d0d0] px-3 font-sans text-[16px] text-[var(--color-ink)] outline-none focus:border-[#f88a2a] disabled:opacity-50"
                />
                {message !== "" ? (
                  <p role="alert" className="m-0 text-[14px] text-[#e34043]">
                    {message}
                  </p>
                ) : null}
              </div>
              <button
                type="submit"
                disabled={pending}
                className="flex h-[65px] w-full cursor-pointer items-center justify-center rounded-lg border-0 bg-[#f88a2a] font-sans text-[18px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending ? "Пополняем…" : "Пополнить"}
              </button>
            </form>
          ) : (
            <p role="status" className="m-0 w-full text-[16px] leading-[1.45] text-[#1a1b1d]">
              {message}
            </p>
          )}
        </div>
      </div>
    </StagePortal>
  );
}

export function TopupModal(props: TopupModalProps): ReactElement | null {
  const titleId = useId();
  const cardRef = useRef<HTMLDivElement>(null);
  useFocusTrap(cardRef, props.open);

  useEffect(() => {
    if (!props.open) {
      return;
    }
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key !== "Escape" || props.pending) {
        return;
      }
      event.preventDefault();
      props.onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [props.open, props.pending, props.onClose]);

  if (!props.open) {
    return null;
  }

  return <TopupDialog {...props} titleId={titleId} cardRef={cardRef} />;
}
