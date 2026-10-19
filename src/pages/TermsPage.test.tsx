import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, test } from "vitest";

afterEach(() => {
  cleanup();
});
import { PrivacyPage } from "./PrivacyPage";
import { TermsPage } from "./TermsPage";

test("условия ссылаются на политику конфиденциальности", () => {
  render(
    <MemoryRouter>
      <TermsPage />
    </MemoryRouter>,
  );
  expect(screen.getByRole("heading", { name: "Условия использования" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Политика конфиденциальности" })).toHaveAttribute("href", "/privacy");
  expect(screen.queryByText("Раздел появится позже")).toBeNull();
});

test("политика читается как шаблон", () => {
  render(
    <MemoryRouter>
      <PrivacyPage />
    </MemoryRouter>,
  );
  expect(screen.getByRole("heading", { name: "Политика конфиденциальности" })).toBeInTheDocument();
  expect(screen.getByText(/шаблон/i)).toBeInTheDocument();
  expect(screen.queryByText("Раздел появится позже")).toBeNull();
});
