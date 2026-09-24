import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { Sidebar } from "./Sidebar";

test("shows account block, nav icons, and logo image", () => {
  render(
    <Sidebar
      activePath="/listings"
      account={{ name: "Ирина Иванова", email: "hello@gmail.com" }}
    />,
  );

  expect(screen.getByText("Ирина Иванова")).toBeInTheDocument();
  expect(screen.getByText("hello@gmail.com")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /мои объявления/i })).toHaveAttribute(
    "href",
    "/listings",
  );
  expect(screen.getByAltText("GlobalStay")).toHaveAttribute(
    "src",
    "/logo-globalstay.svg",
  );
  expect(screen.queryByText("GlobalStay")).not.toBeInTheDocument();
});
