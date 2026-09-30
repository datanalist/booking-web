import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { ListingPreviewGallery } from "./ListingPreviewGallery";

afterEach(() => {
  cleanup();
});

test("thumbnails use a two-column grid", () => {
  const { container } = render(
    <ListingPreviewGallery
      photos={["a.jpg", "b.jpg", "c.jpg", "d.jpg", "e.jpg", "f.jpg"]}
    />,
  );

  const thumbs = screen.getByTestId("listing-preview-thumbs");
  expect(thumbs).toHaveClass("grid");
  expect(thumbs).toHaveClass("grid-cols-2");
  expect(thumbs).toHaveClass("gap-3");
  expect(thumbs.children).toHaveLength(4);
  expect(screen.getByTestId("listing-preview-extra-photos")).toHaveTextContent(
    "+2 фото",
  );

  const column = container.firstElementChild;
  expect(column).toHaveClass("w-96");
});

test("fewer than two thumbs still render inside the grid", () => {
  render(<ListingPreviewGallery photos={["a.jpg", "b.jpg"]} />);
  const thumbs = screen.getByTestId("listing-preview-thumbs");
  expect(thumbs.children).toHaveLength(1);
  expect(
    screen.queryByTestId("listing-preview-extra-photos"),
  ).not.toBeInTheDocument();
});
