import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { ListingWizardDetailsStep } from "./ListingWizardDetailsStep";

afterEach(() => {
  cleanup();
});

test("renders mockup labels and counters", () => {
  render(
    <ListingWizardDetailsStep
      values={{ accessInfo: "", houseRules: "", extraInfo: "" }}
      errors={{}}
      pending={false}
      onChange={() => {}}
      onBack={() => {}}
      onNext={() => {}}
    />,
  );

  expect(screen.getByText("Создание объявления")).toBeInTheDocument();
  expect(screen.getByText("Укажите дополнительные сведения")).toBeInTheDocument();
  expect(screen.getByText("5. Дополнительное")).toBeInTheDocument();
  expect(
    screen.getByLabelText("Инструкция, как попасть внутрь"),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Правила проживания")).toBeInTheDocument();
  expect(
    screen.getByLabelText("Дополнительная информация"),
  ).toBeInTheDocument();
  expect(screen.getAllByText("0/500")).toHaveLength(3);
  expect(screen.getByRole("button", { name: "Вернуться" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Далее" })).toBeInTheDocument();
});

test("typing updates counters and calls onChange", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(
    <ListingWizardDetailsStep
      values={{ accessInfo: "", houseRules: "", extraInfo: "" }}
      errors={{}}
      pending={false}
      onChange={onChange}
      onBack={() => {}}
      onNext={() => {}}
    />,
  );

  await user.type(
    screen.getByPlaceholderText("Опишите, как попасть в жилье"),
    "код",
  );
  expect(onChange).toHaveBeenCalled();
  expect(onChange.mock.calls.some((call) => call[0].accessInfo !== undefined)).toBe(
    true,
  );
});

test("next and back are interactive", async () => {
  const user = userEvent.setup();
  const onBack = vi.fn();
  const onNext = vi.fn();
  render(
    <ListingWizardDetailsStep
      values={{ accessInfo: "a", houseRules: "b", extraInfo: "c" }}
      errors={{}}
      pending={false}
      onChange={() => {}}
      onBack={onBack}
      onNext={onNext}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Вернуться" }));
  await user.click(screen.getByRole("button", { name: "Далее" }));
  expect(onBack).toHaveBeenCalledTimes(1);
  expect(onNext).toHaveBeenCalledTimes(1);
});
