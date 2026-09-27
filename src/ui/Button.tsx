import type { ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  variant?: "filled" | "outlined" | "text";
  size?: "md" | "sm";
  disabled?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
  className?: string;
};

export function Button({
  children,
  variant = "filled",
  size = "md",
  disabled = false,
  type = "button",
  onClick,
  className = "",
}: ButtonProps) {
  const base =
    size === "sm"
      ? "inline-flex items-center justify-center font-sans font-normal text-[14px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      : "inline-flex items-center justify-center font-sans font-bold text-[18px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

  const variants: Record<"filled" | "outlined" | "text", string> = {
    filled:
      size === "sm"
        ? "h-auto rounded-[30px] bg-[var(--color-accent)] text-white border-0 px-5 py-2.5"
        : "h-[61px] rounded-[30px] bg-[var(--color-accent)] text-white border-0 px-8",
    outlined:
      size === "sm"
        ? "h-auto rounded-[30px] bg-transparent text-[var(--color-accent)] border border-[var(--color-accent)] px-5 py-2.5"
        : "h-[61px] rounded-[30px] bg-transparent text-[var(--color-accent)] border border-[var(--color-accent)] px-8",
    text: "h-auto rounded-none bg-transparent text-[var(--color-accent)] border-0 px-2 py-1",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${className}`.trim()}
    >
      {children}
    </button>
  );
}
