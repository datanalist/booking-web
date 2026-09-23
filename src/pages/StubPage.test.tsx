import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, test } from "vitest";
import { StubPage } from "./StubPage";

test("stub is plain text", () => {
  render(
    <MemoryRouter>
      <StubPage title="Чаты" />
    </MemoryRouter>,
  );
  expect(screen.getByText("Раздел появится позже")).toBeInTheDocument();
});
