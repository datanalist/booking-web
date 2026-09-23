import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { Input } from "./Input";

test("input shows error not html", () => {
  render(
    <Input
      label="Email"
      value="<b>x</b>"
      onChange={() => {}}
      error="Неверный email или пароль"
    />,
  );
  expect(screen.getByText("Неверный email или пароль")).toBeInTheDocument();
  expect(screen.getByDisplayValue("<b>x</b>")).toBeInTheDocument();
});
