type WizardBackButtonProps = {
  onClick: () => void;
  disabled?: boolean;
};

export function WizardBackButton({
  onClick,
  disabled = false,
}: WizardBackButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label="Назад"
      onClick={onClick}
      className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-[30px] border border-solid border-[#ffe4b8] bg-white p-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <img
        src="/icon-arrow-left.svg"
        alt=""
        width={15.5}
        height={8.5}
        className="rotate-90"
      />
    </button>
  );
}
