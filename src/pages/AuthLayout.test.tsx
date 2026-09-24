import { render, within } from "@testing-library/react";
import { expect, test } from "vitest";
import { AuthLayout } from "./AuthLayout";

test("renders SVG logo image, not text brand", () => {
  const { container } = render(
    <AuthLayout>
      <div>форма</div>
    </AuthLayout>,
  );

  const logo = within(container).getByRole("img", { name: "GlobalStay" });
  expect(logo).toHaveAttribute("src", "/logo-globalstay.svg");
  expect(within(container).queryByText("GlobalStay")).toBeNull();
});

test("side photo uses rounded-[20px]", () => {
  const { container } = render(
    <AuthLayout>
      <div>форма</div>
    </AuthLayout>,
  );

  const side = container.querySelector('img[src="/auth-side.jpg"]');
  expect(side).not.toBeNull();
  expect(side?.className).toMatch(/rounded-\[20px\]/);
});

test("disclaimer has no links and accent phrases", () => {
  const { container } = render(
    <AuthLayout>
      <div>форма</div>
    </AuthLayout>,
  );
  const view = within(container);

  expect(container.querySelector("a")).toBeNull();
  expect(
    view.getByText("Условиями использования", { exact: false }),
  ).toBeInTheDocument();
  expect(
    view.getByText("Политикой конфиденциальности", { exact: false }),
  ).toBeInTheDocument();
  expect(view.getByText(/Продолжая, Вы соглашаетесь с/i)).toBeInTheDocument();
});

test("root locks viewport scroll with h-screen overflow-hidden", () => {
  const { container } = render(
    <AuthLayout>
      <div>форма</div>
    </AuthLayout>,
  );

  const root = container.firstElementChild;
  expect(root).not.toBeNull();
  expect(root?.className).toMatch(/\bh-screen\b/);
  expect(root?.className).toMatch(/\boverflow-hidden\b/);
});
