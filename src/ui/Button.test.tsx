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
