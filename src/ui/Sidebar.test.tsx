import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
import { MemoryRouter, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";

function PathProbe() {
  const { pathname } = useLocation();
  return <div data-testid="path">{pathname}</div>;
}

function renderSidebar(activePath: string) {
  return render(
    <MemoryRouter initialEntries={[activePath]}>
      <Sidebar
        activePath={activePath}
        account={{ name: "Ирина Иванова", email: "hello@gmail.com" }}
      />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
});

test("shows account block, nav icons, and logo image", () => {
  renderSidebar("/listings");

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
  renderSidebar("/listings");

  const link = screen.getByRole("link", { name: /мои объявления/i });
  const label = within(link).getByText("Мои объявления");
  expect(label).toHaveClass("whitespace-nowrap");
  expect(label).toHaveTextContent("Мои объявления");
});

test("renders profile icon in a fixed square with object-contain", () => {
  renderSidebar("/profile");

  const link = screen.getByRole("link", { name: /профиль/i });
  const icon = link.querySelector("img");
  expect(icon).not.toBeNull();
  expect(icon).toHaveAttribute("src", "/sidebar-icon-profile.svg");
  expect(icon).toHaveAttribute("width", "24");
  expect(icon).toHaveAttribute("height", "24");
  expect(icon).toHaveClass("object-contain");
  expect(icon).toHaveClass("size-6");
});

test("footer logo matches mockup size and frame position", () => {
  const { container } = renderSidebar("/listings");

  const aside = container.querySelector("aside");
  expect(aside).not.toBeNull();
  expect(aside).toHaveClass("w-[235px]");
  expect(aside).toHaveClass("h-full");
  expect(aside).toHaveClass("self-stretch");
  expect(aside).toHaveClass("gap-5");

  const footer = container.querySelector("footer");
  expect(footer).not.toBeNull();
  expect(footer).toHaveClass("h-[77px]");
  expect(footer).toHaveClass("relative");

  const logo = screen.getByAltText("GlobalStay");
  expect(logo.tagName).toBe("IMG");
  expect(logo).toHaveAttribute("width", "181");
  expect(logo).toHaveAttribute("height", "60");
  expect(logo).toHaveAttribute("src", "/logo-globalstay.svg");
  expect(logo).toHaveClass("object-contain");
  expect(logo).toHaveClass("h-[60px]");
  expect(logo).toHaveClass("w-[181px]");
  expect(logo).toHaveClass("left-[27px]");
  expect(logo).toHaveClass("bottom-[32px]");
  expect(logo).toHaveClass("absolute");
  expect(footer?.contains(logo)).toBe(true);
});

test("пункт «Уведомления» без числа не показывает постоянную двойку", () => {
  renderSidebar("/listings");

  const link = screen.getByRole("link", { name: /уведомления/i });
  expect(within(link).queryByText("2")).not.toBeInTheDocument();
});

test("switches section inside the app instead of reloading the document", async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={["/listings"]}>
      <Sidebar
        activePath="/listings"
        account={{ name: "Ирина Иванова", email: "hello@gmail.com" }}
      />
      <PathProbe />
    </MemoryRouter>,
  );

  await user.click(screen.getByRole("link", { name: /бронирования/i }));

  expect(screen.getByTestId("path")).toHaveTextContent("/bookings");
});
