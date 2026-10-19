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

test("side photo is 789x938 with p-16 and rounded-[20px] clip", () => {
  const { container } = renderLayout();

  const side = container.querySelector('img[src="/auth-side.jpg"]');
  expect(side).not.toBeNull();
  expect(side?.className).toMatch(/rounded-\[20px\]/);

  const frame = side?.parentElement;
  expect(frame).not.toBeNull();
  expect(frame?.className).toMatch(/rounded-\[20px\]/);
  expect(frame?.className).toMatch(/\boverflow-hidden\b/);
  expect(frame?.className).toMatch(/w-\[789px\]/);
  expect(frame?.className).toMatch(/h-\[938px\]/);

  const panel = frame?.parentElement;
  expect(panel).not.toBeNull();
  expect(panel?.className).toMatch(/\bp-16\b/);
  expect(panel?.className).toMatch(/\bright-0\b/);
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

test("root locks viewport scroll; canvas is fixed 1440x1020 without clipping radius", () => {
  const { container } = renderLayout();

  const root = container.firstElementChild;
  expect(root).not.toBeNull();
  expect(root?.className).toMatch(/\bh-screen\b/);
  expect(root?.className).toMatch(/\boverflow-hidden\b/);

  const canvas = root?.firstElementChild;
  expect(canvas).not.toBeNull();
  expect(canvas?.className).toMatch(/w-\[1440px\]/);
  expect(canvas?.className).toMatch(/h-\[1020px\]/);
  expect(canvas?.className).not.toMatch(/\boverflow-hidden\b/);
  expect(canvas?.className).not.toMatch(/\bw-full\b/);
  expect(canvas?.className).not.toMatch(/\bmin-w-\[1440px\]\b/);
});

test("form slot matches Figma left/top/width", () => {
  const { container } = renderLayout(<div data-testid="form-slot">форма</div>);
  const slot = container.querySelector('[data-testid="form-slot"]')?.parentElement;
  expect(slot?.className).toMatch(/\bw-80\b/);
  expect(slot?.className).toMatch(/left-\[149px\]/);
  expect(slot?.className).toMatch(/top-\[305px\]/);
});
