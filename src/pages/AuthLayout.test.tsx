import type { ReactNode } from "react";
import { render, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, test } from "vitest";
import { AuthLayout } from "./AuthLayout";

function renderLayout(children: ReactNode = <div>форма</div>) {
  return render(
    <MemoryRouter>
      <AuthLayout>{children}</AuthLayout>
    </MemoryRouter>,
  );
}

test("renders SVG logo image, not text brand", () => {
  const { container } = renderLayout();

  const logo = within(container).getByRole("img", { name: "GlobalStay" });
  expect(logo).toHaveAttribute("src", "/logo-globalstay.svg");
  expect(within(container).queryByText("GlobalStay")).toBeNull();
});

test("side photo uses rounded-[20px]", () => {
  const { container } = renderLayout();

  const side = container.querySelector('img[src="/auth-side.jpg"]');
  expect(side).not.toBeNull();
  expect(side?.className).toMatch(/rounded-\[20px\]/);
});

test("disclaimer links to stub legal pages", () => {
  const { container } = renderLayout();
  const view = within(container);

  const terms = view.getByRole("link", { name: "Условиями использования" });
  const privacy = view.getByRole("link", {
    name: "Политикой конфиденциальности",
  });
  expect(terms).toHaveAttribute("href", "/terms");
  expect(privacy).toHaveAttribute("href", "/privacy");
  expect(view.getByText(/Продолжая, Вы соглашаетесь с/i)).toBeInTheDocument();
});

test("root locks viewport scroll with h-screen overflow-hidden", () => {
  const { container } = renderLayout();

  const root = container.firstElementChild;
  expect(root).not.toBeNull();
  expect(root?.className).toMatch(/\bh-screen\b/);
  expect(root?.className).toMatch(/\boverflow-hidden\b/);
});
