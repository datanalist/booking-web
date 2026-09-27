import { useState } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
import { TimeInput } from "./TimeInput";

afterEach(() => {
  cleanup();
});

function TimeInputHarness({
  initial = "",
}: {
  initial?: string;
}) {
  const [value, setValue] = useState(initial);
  return (
    <TimeInput
      label="Время заселения"
      value={value}
      onChange={setValue}
      placeholder="Введите время"
    />
  );
}

test("TimeInput shows HH:MM and rejects non-time characters", async () => {
  const user = userEvent.setup();
  render(<TimeInputHarness />);

  const field = screen.getByPlaceholderText("Введите время");
  expect(field).toHaveAttribute("inputMode", "numeric");
  expect(field).not.toHaveAttribute("type", "time");

  await user.type(field, "14abc00");
  expect(screen.getByDisplayValue("14:00")).toBeInTheDocument();
});

test("TimeInput formats progressive typing as HH:MM", async () => {
  const user = userEvent.setup();
  render(<TimeInputHarness />);

  const field = screen.getByPlaceholderText("Введите время");
  await user.type(field, "930");
  expect(screen.getByDisplayValue("09:30")).toBeInTheDocument();
});
