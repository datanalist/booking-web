import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { Button } from "./Button";

test("button disabled does not click", async () => {
  const onClick = vi.fn();
  render(
    <Button disabled onClick={onClick}>
      Далее
    </Button>,
  );
  await userEvent.click(screen.getByRole("button", { name: "Далее" }));
  expect(onClick).not.toHaveBeenCalled();
});

test("size sm uses compact pill styles", () => {
  render(<Button size="sm">Создать объявление</Button>);
  const button = screen.getByRole("button", { name: "Создать объявление" });
  expect(button.className).toContain("text-[14px]");
  expect(button.className).toContain("rounded-[30px]");
  expect(button.className).toContain("font-normal");
  expect(button.className).not.toContain("h-[61px]");
});
