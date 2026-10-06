import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { ProfileLayout } from "./ProfileLayout";

afterEach(() => {
  cleanup();
});

test("renders header and the three column slots", () => {
  render(
    <ProfileLayout
      header={<h1>Шапка</h1>}
      personal={<p>Личные</p>}
      apiKey={<p>Ключ</p>}
      balance={<p>Баланс</p>}
    />,
  );

  expect(screen.getByRole("heading", { name: "Шапка" })).toBeInTheDocument();

  const personal = document.querySelector('[data-slot="personal"]');
  const apiKey = document.querySelector('[data-slot="api-key"]');
  const balance = document.querySelector('[data-slot="balance"]');

  expect(personal).not.toBeNull();
  expect(apiKey).not.toBeNull();
  expect(balance).not.toBeNull();
  expect(personal).toHaveTextContent("Личные");
  expect(apiKey).toHaveTextContent("Ключ");
  expect(balance).toHaveTextContent("Баланс");
  expect(personal).toHaveClass("w-[300px]");
  expect(apiKey).toHaveClass("flex-1");
  expect(balance).toHaveClass("flex-1");
});
