import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { App } from "./App";

test("renders brand", () => {
  render(createElement(App));
  expect(screen.getByText("GlobalStay")).toBeInTheDocument();
});
