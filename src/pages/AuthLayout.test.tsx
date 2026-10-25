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
  expect(logo).toHaveAttribute("width", "181");
  expect(logo).toHaveAttribute("height", "60");
  expect(logo.className).toMatch(/w-\[181px\]/);
  expect(logo.className).toMatch(/h-\[60px\]/);
  expect(logo.className).toMatch(/\bleft-8\b/);
  expect(logo.className).toMatch(/\btop-4\b/);
  expect(within(container).queryByText("GlobalStay")).toBeNull();
});

test("side photo fills the right column with p-16 and rounded-[20px] clip", () => {
  const { container } = renderLayout();

  const side = container.querySelector('img[src="/auth-side.jpg"]');
  expect(side).not.toBeNull();
  expect(side?.className).toMatch(/rounded-\[20px\]/);
  expect(side?.className).toMatch(/\bh-full\b/);
  expect(side?.className).toMatch(/\bw-full\b/);

  const frame = side?.parentElement;
  expect(frame).not.toBeNull();
  expect(frame?.className).toMatch(/rounded-\[20px\]/);
  expect(frame?.className).toMatch(/\boverflow-hidden\b/);
  expect(frame?.className).toMatch(/\bh-full\b/);
  expect(frame?.className).toMatch(/\bw-full\b/);

  const panel = frame?.parentElement;
  expect(panel).not.toBeNull();
  expect(panel?.className).toMatch(/\bp-16\b/);
  expect(panel?.className).toMatch(/flex-\[917_1_0%\]/);
});

test("footer has no consent disclaimer or legal links", () => {
  const { container } = renderLayout();
  const view = within(container);

  expect(view.queryByText(/Продолжая, Вы соглашаетесь/i)).toBeNull();
  expect(
    view.queryByRole("link", { name: "Условиями использования" }),
  ).toBeNull();
  expect(
    view.queryByRole("link", { name: "Политикой конфиденциальности" }),
  ).toBeNull();
});

test("root fills the window instead of a fixed 1440x1020 canvas", () => {
  const { container } = renderLayout();

  const root = container.firstElementChild;
  expect(root).not.toBeNull();
  expect(root?.className).toMatch(/\bh-full\b/);
  expect(root?.className).toMatch(/\bw-full\b/);
  expect(root?.className).toMatch(/\boverflow-hidden\b/);
  expect(root?.className).not.toMatch(/1440/);
  expect(root?.className).not.toMatch(/1020/);
  expect(container.innerHTML).not.toMatch(/w-\[1440px\]/);
  expect(container.innerHTML).not.toMatch(/h-\[1020px\]/);
});

test("form slot keeps the mock width and left inset while the column grows", () => {
  const { container } = renderLayout(<div data-testid="form-slot">форма</div>);
  const slot = container.querySelector('[data-testid="form-slot"]')?.parentElement;
  expect(slot?.className).toMatch(/\bw-80\b/);
  expect(slot?.className).toMatch(/clamp\(2rem,10\.35vw,149px\)/);
  expect(slot?.className).not.toMatch(/top-\[305px\]/);
});
