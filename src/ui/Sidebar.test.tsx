import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { Sidebar } from "./Sidebar";

afterEach(() => {
  cleanup();
});

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

test("keeps «Мои объявления» on one line", () => {
  render(
    <Sidebar
      activePath="/listings"
      account={{ name: "Ирина Иванова", email: "hello@gmail.com" }}
    />,
  );

  const link = screen.getByRole("link", { name: /мои объявления/i });
  const label = within(link).getByText("Мои объявления");
  expect(label).toHaveClass("whitespace-nowrap");
  expect(label).toHaveTextContent("Мои объявления");
});

test("renders profile icon in a fixed square with object-contain", () => {
  render(
    <Sidebar
      activePath="/profile"
      account={{ name: "Ирина Иванова", email: "hello@gmail.com" }}
    />,
  );

  const link = screen.getByRole("link", { name: /профиль/i });
  const icon = link.querySelector("img");
  expect(icon).not.toBeNull();
  expect(icon).toHaveAttribute("src", "/sidebar-icon-profile.svg");
  expect(icon).toHaveAttribute("width", "24");
  expect(icon).toHaveAttribute("height", "24");
  expect(icon).toHaveClass("object-contain");
  expect(icon).toHaveClass("size-6");
});

test("footer logo matches mockup size and padding slot", () => {
  const { container } = render(
    <Sidebar
      activePath="/listings"
      account={{ name: "Ирина Иванова", email: "hello@gmail.com" }}
    />,
  );

  const footer = container.querySelector("footer");
  expect(footer).not.toBeNull();
  expect(footer).toHaveClass("h-[77px]");
  expect(footer).toHaveClass("px-8");
  expect(footer).toHaveClass("py-6");

  const logo = screen.getByAltText("GlobalStay");
  expect(logo.tagName).toBe("IMG");
  expect(logo).toHaveAttribute("width", "124");
  expect(logo).toHaveAttribute("height", "29");
  expect(logo).toHaveClass("object-contain");
  expect(logo).toHaveClass("h-[29px]");
});
