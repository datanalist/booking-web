import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { App } from "./App";

test("renders login on desktop viewport", () => {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: 1440,
  });
  render(<App />);
  expect(screen.getByRole("heading", { name: "Войти" })).toBeInTheDocument();
});
