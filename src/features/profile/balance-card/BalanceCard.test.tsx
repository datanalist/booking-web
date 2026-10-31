import { cleanup, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { BalanceCard } from "./BalanceCard";

const nbsp = "\u00A0";

afterEach(() => {
  cleanup();
});

test("показывает сумму и подпись доступного баланса", () => {
  const { container, getByText } = render(
    <BalanceCard amountRub={34670} onWithdraw={() => undefined} onTopUp={() => undefined} />,
  );
  expect(container.querySelector("p")?.textContent).toBe(`34${nbsp}670${nbsp}₽`);
  expect(getByText("Доступный баланс")).toBeInTheDocument();
});

test("вызывает onWithdraw по клику «Вывести средства»", async () => {
  const onWithdraw = vi.fn();
  const { getByRole } = render(
    <BalanceCard amountRub={0} onWithdraw={onWithdraw} onTopUp={() => undefined} />,
  );
  await userEvent.click(getByRole("button", { name: "Вывести средства" }));
  expect(onWithdraw).toHaveBeenCalledOnce();
});

test("вызывает onTopUp по клику «Пополнить баланс»", async () => {
  const onTopUp = vi.fn();
  const { getByRole } = render(
    <BalanceCard amountRub={0} onWithdraw={() => undefined} onTopUp={onTopUp} />,
  );
  await userEvent.click(getByRole("button", { name: "Пополнить баланс" }));
  expect(onTopUp).toHaveBeenCalledOnce();
});

test("декоративные линии скрыты от доступности", () => {
  const { container } = render(
    <BalanceCard amountRub={1000} onWithdraw={() => undefined} onTopUp={() => undefined} />,
  );
  const lines = container.querySelector("img");
  expect(lines).not.toBeNull();
  expect(lines).toHaveAttribute("aria-hidden", "true");
  expect(lines).toHaveAttribute("alt", "");
  expect(lines).toHaveAttribute("src", "/profile/balance-lines.svg");
});
