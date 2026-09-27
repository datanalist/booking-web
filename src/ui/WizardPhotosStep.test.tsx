import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { WizardPhotosStep } from "./WizardPhotosStep";

afterEach(() => {
  cleanup();
});

describe("WizardPhotosStep", () => {
  test("shows empty slots and disabled next until minimum photos", () => {
    render(
      <WizardPhotosStep
        photos={[]}
        onPhotosChange={vi.fn()}
        onFilesSelected={vi.fn()}
        onBack={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    expect(screen.getByText("Добавьте фото жилья")).toBeInTheDocument();
    expect(screen.getByText("Минимум 6 фото")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Далее" })).toBeDisabled();
    expect(screen.getAllByRole("button", { name: /Добавить/ })).toHaveLength(9);
  });

  test("shows previews and enables next with enough photos", async () => {
    const user = userEvent.setup();
    const onPhotosChange = vi.fn();

    render(
      <WizardPhotosStep
        photos={[
          "data:image/png;base64,aaa",
          "data:image/png;base64,bbb",
          "data:image/png;base64,ccc",
          "data:image/png;base64,ddd",
          "data:image/png;base64,eee",
          "data:image/png;base64,fff",
        ]}
        onPhotosChange={onPhotosChange}
        onFilesSelected={vi.fn()}
        onBack={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    const nextButtons = screen.getAllByRole("button", { name: "Далее" });
    expect(nextButtons.some((button) => !button.hasAttribute("disabled"))).toBe(
      true,
    );
    expect(screen.getAllByRole("button", { name: "Удалить фото" }).length).toBeGreaterThanOrEqual(6);
    expect(screen.getAllByRole("button", { name: /Добавить/ }).length).toBeGreaterThanOrEqual(3);

    await user.click(screen.getAllByRole("button", { name: "Удалить фото" })[0]!);
    expect(onPhotosChange).toHaveBeenCalledWith([
      "data:image/png;base64,bbb",
      "data:image/png;base64,ccc",
      "data:image/png;base64,ddd",
      "data:image/png;base64,eee",
      "data:image/png;base64,fff",
    ]);
  });
});
