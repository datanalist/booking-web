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
  expect(logo.className).toMatch(/\bw-44\b/);
  expect(logo.className).toMatch(/\bh-14\b/);
  expect(logo.className).toMatch(/\bleft-8\b/);
  expect(logo.className).toMatch(/\btop-4\b/);
  expect(within(container).queryByText("GlobalStay")).toBeNull();
});

test("side photo uses rounded-[20px] on overflow-hidden frame", () => {
  const { container } = renderLayout();

  const side = container.querySelector('img[src="/auth-side.jpg"]');
  expect(side).not.toBeNull();
  const frame = side?.parentElement;
  expect(frame).not.toBeNull();
  expect(frame?.className).toMatch(/rounded-\[20px\]/);
  expect(frame?.className).toMatch(/\boverflow-hidden\b/);
  expect(frame?.className).toMatch(/left-\[619px\]/);
  expect(frame?.className).toMatch(/top-\[41px\]/);
  expect(frame?.className).toMatch(/w-\[789px\]/);
  expect(frame?.className).toMatch(/h-\[938px\]/);
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
  const disclaimer = view.getByText(/Продолжая, Вы соглашаетесь с/i).closest("p");
  expect(disclaimer?.className).toMatch(/\bw-80\b/);
  expect(disclaimer?.className).toMatch(/left-\[149px\]/);
  expect(disclaimer?.className).toMatch(/top-\[942px\]/);
});

test("root locks viewport scroll; canvas is fixed 1440x1020", () => {
  const { container } = renderLayout();

  const root = container.firstElementChild;
  expect(root).not.toBeNull();
  expect(root?.className).toMatch(/\bh-screen\b/);
  expect(root?.className).toMatch(/\boverflow-hidden\b/);

  const canvas = root?.firstElementChild;
  expect(canvas).not.toBeNull();
  expect(canvas?.className).toMatch(/w-\[1440px\]/);
  expect(canvas?.className).toMatch(/h-\[1020px\]/);
  expect(canvas?.className).toMatch(/\boverflow-hidden\b/);
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
