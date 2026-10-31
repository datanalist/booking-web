import type { ReactElement } from "react";
import { Button } from "../../../ui/Button";
import { formatRubles } from "./formatRubles";

export type BalanceCardProps = {
  /** Доступный баланс в рублях (целое число). */
  amountRub: number;
  onTopUp: () => void;
};

export function BalanceCard({
  amountRub,
  onTopUp,
}: BalanceCardProps): ReactElement {
  return (
    <div className="relative flex h-[244px] flex-1 flex-col items-center justify-center gap-6 overflow-hidden rounded-xl bg-[rgba(251,192,40,0.17)] px-6 py-8 font-sans">
      <img
        src="/profile/balance-lines.svg"
        alt=""
        aria-hidden="true"
        width={423}
        height={410}
        className="pointer-events-none absolute top-[-48px] left-[-67px] h-[410px] w-[423px] max-w-none select-none"
      />
      <div className="relative z-10 flex flex-col items-center gap-1">
        <p className="m-0 text-[32px] leading-[1.2] font-bold whitespace-nowrap text-[var(--color-ink)]">
          {formatRubles(amountRub)}
        </p>
        <p className="m-0 text-[16px] leading-[1.45] font-normal whitespace-nowrap text-[#525353]">
          Доступный баланс
        </p>
      </div>
      <Button
        size="sm"
        variant="filled"
        onClick={onTopUp}
        className="relative z-10 gap-2.5 leading-[1.4] hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f88a2a]"
      >
        Пополнить баланс
      </Button>
    </div>
  );
}
