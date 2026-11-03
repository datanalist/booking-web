/** Единая причина изменения: кнопка обложки недоступна без главного фото и не шлёт второй запрос. */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { GenerateCoverButton } from "./GenerateCoverButton";

vi.mock("../features/listings/generateListingCover", () => ({
  generateListingCover: vi.fn(),
}));

import { generateListingCover } from "../features/listings/generateListingCover";

const generate = vi.mocked(generateListingCover);

afterEach(() => {
  cleanup();
  generate.mockReset();
});

describe("GenerateCoverButton", () => {
  test("без главного фото кнопка недоступна", async () => {
    const user = userEvent.setup();
    render(
      <GenerateCoverButton
        coverUrl={null}
        title="Студия"
        address=""
        priceNight={0}
        maxGuests={0}
        hasKitchen={false}
        onGenerated={vi.fn()}
      />,
    );
    const button = screen.getByRole("button", { name: "Сгенерировать обложку" });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(generate).not.toHaveBeenCalled();
  });

  test("повторный клик не шлёт второй запрос, ошибка не подменяет фото", async () => {
    const user = userEvent.setup();
    const onGenerated = vi.fn();
    let release: (value: string) => void = () => undefined;
    generate.mockImplementation(() => new Promise((resolve) => {
      release = resolve;
    }));
    render(
      <GenerateCoverButton
        coverUrl="/data/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee.jpg"
        title="Студия"
        address="Москва"
        priceNight={3000}
        maxGuests={1}
        hasKitchen={false}
        onGenerated={onGenerated}
      />,
    );
    const button = screen.getByRole("button", { name: "Сгенерировать обложку" });
    await user.click(button);
    await user.click(button);
    expect(generate).toHaveBeenCalledTimes(1);
    expect(button).toHaveAttribute("aria-busy", "true");
    release("/data/bbbbbbbb-bbbb-4ccc-8ddd-eeeeeeeeeeee.jpg");
    await waitFor(() => {
      expect(onGenerated).toHaveBeenCalledTimes(1);
    });
    expect(button).toHaveAttribute("aria-busy", "false");
  });

  test("ошибка видна, обложка не меняется", async () => {
    const user = userEvent.setup();
    const onGenerated = vi.fn();
    generate.mockRejectedValue(new Error("Не удалось сгенерировать обложку"));
    render(
      <GenerateCoverButton
        coverUrl="/data/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee.jpg"
        title=""
        address=""
        priceNight={0}
        maxGuests={0}
        hasKitchen={false}
        onGenerated={onGenerated}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Сгенерировать обложку" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Не удалось сгенерировать обложку");
    expect(onGenerated).not.toHaveBeenCalled();
  });
});
