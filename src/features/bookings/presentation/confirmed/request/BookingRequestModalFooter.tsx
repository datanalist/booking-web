import type { RequestDecision } from "./RequestDecision";

type BookingRequestModalFooterProps = {
  onDecision: (decision: RequestDecision) => void;
};

const BUTTON_CLASS =
  "inline-flex flex-1 cursor-pointer items-center justify-center gap-2.5 rounded-lg px-6 py-5 font-sans text-lg font-bold tracking-tight";

export function BookingRequestModalFooter({
  onDecision,
}: BookingRequestModalFooterProps) {
  return (
    <footer className="flex gap-3">
      <button
        type="button"
        onClick={() => onDecision("reject")}
        className={`${BUTTON_CLASS} border-0 bg-transparent text-orange-400 outline outline-1 -outline-offset-1 outline-orange-400`}
      >
        Отклонить
      </button>
      <button
        type="button"
        onClick={() => onDecision("accept")}
        className={`${BUTTON_CLASS} border-0 bg-orange-400 text-absolute-white`}
      >
        Принять
      </button>
    </footer>
  );
}
