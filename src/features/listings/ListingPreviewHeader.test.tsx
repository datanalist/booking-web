import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { ListingPreviewHeader } from "./ListingPreviewHeader";

test("кнопка «Удалить» в шапке превью запускает удаление", async () => {
  const user = userEvent.setup();
  const onDelete = vi.fn();

  render(
    <ListingPreviewHeader
      status="moderation"
      pending={false}
      onBack={vi.fn()}
      onEdit={vi.fn()}
      onDelete={onDelete}
      onArchive={vi.fn()}
      onSubmit={vi.fn()}
      onUnpublish={vi.fn()}
      onPublish={vi.fn()}
      onOpenBookingCalendar={vi.fn()}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Удалить" }));

  expect(onDelete).toHaveBeenCalledTimes(1);
});
