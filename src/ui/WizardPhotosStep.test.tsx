import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { PHOTO_UPLOAD_IDLE } from "../features/listings";
import { WIZARD_PHOTO_DRAG_MIME } from "../lib/wizardPhotoDragMime";
import { WizardPhotosStep } from "./WizardPhotosStep";

afterEach(() => {
  cleanup();
});

const sixPhotos = [
  "data:image/png;base64,aaa",
  "data:image/png;base64,bbb",
  "data:image/png;base64,ccc",
  "data:image/png;base64,ddd",
  "data:image/png;base64,eee",
  "data:image/png;base64,fff",
];

describe("WizardPhotosStep", () => {
  test("shows empty slots and disabled next until minimum photos", () => {
    render(
      <WizardPhotosStep
        photos={[]}
        uploadStatus={PHOTO_UPLOAD_IDLE}
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

  test("shows loading indicator and keeps next disabled without enough photos", () => {
    render(
      <WizardPhotosStep
        photos={[]}
        uploadStatus={{ kind: "loading" }}
        onPhotosChange={vi.fn()}
        onFilesSelected={vi.fn()}
        onBack={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Обработка фото…");
    expect(screen.getByRole("button", { name: "Далее" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Вернуться" })).toBeDisabled();
  });

  test("keeps next enabled while loading when minimum photos already present", () => {
    render(
      <WizardPhotosStep
        photos={sixPhotos}
        uploadStatus={{ kind: "loading" }}
        onPhotosChange={vi.fn()}
        onFilesSelected={vi.fn()}
        onBack={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("Обработка фото…");
    expect(screen.getByRole("button", { name: "Далее" })).toBeEnabled();
  });

  test("shows upload error and enables next after enough photos", async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();

    render(
      <WizardPhotosStep
        photos={sixPhotos}
        uploadStatus={{
          kind: "error",
          message: "Не удалось обработать 1 из 7 фото. Остальные добавлены.",
        }}
        onPhotosChange={vi.fn()}
        onFilesSelected={vi.fn()}
        onBack={vi.fn()}
        onNext={onNext}
      />,
    );

    expect(
      screen.getByText("Не удалось обработать 1 из 7 фото. Остальные добавлены."),
    ).toBeInTheDocument();
    const next = screen.getByRole("button", { name: "Далее" });
    expect(next).toBeEnabled();
    await user.click(next);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  test("shows previews and enables next with enough photos", async () => {
    const user = userEvent.setup();
    const onPhotosChange = vi.fn();

    render(
      <WizardPhotosStep
        photos={sixPhotos}
        uploadStatus={PHOTO_UPLOAD_IDLE}
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

  test("reorders photos when preview is dropped onto another", () => {
    const onPhotosChange = vi.fn();

    const { container } = render(
      <WizardPhotosStep
        photos={sixPhotos}
        uploadStatus={PHOTO_UPLOAD_IDLE}
        onPhotosChange={onPhotosChange}
        onFilesSelected={vi.fn()}
        onBack={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    const previews = container.querySelectorAll("[draggable='true']");
    expect(previews.length).toBeGreaterThanOrEqual(2);

    const source = previews[0]!;
    const target = previews[1]!;

    fireEvent.dragStart(source, {
      dataTransfer: {
        setData: (type: string, value: string) => {
          expect(type).toBe(WIZARD_PHOTO_DRAG_MIME);
          expect(value).toBe("0");
        },
        effectAllowed: "move",
        types: [WIZARD_PHOTO_DRAG_MIME],
      },
    });

    fireEvent.drop(target, {
      dataTransfer: {
        types: [WIZARD_PHOTO_DRAG_MIME],
        getData: () => "",
        files: [] as unknown as FileList,
      },
    });

    expect(onPhotosChange).toHaveBeenCalledWith([
      "data:image/png;base64,bbb",
      "data:image/png;base64,aaa",
      "data:image/png;base64,ccc",
      "data:image/png;base64,ddd",
      "data:image/png;base64,eee",
      "data:image/png;base64,fff",
    ]);
  });

  test("nav buttons use rounded-lg", () => {
    render(
      <WizardPhotosStep
        photos={sixPhotos}
        uploadStatus={PHOTO_UPLOAD_IDLE}
        onPhotosChange={vi.fn()}
        onFilesSelected={vi.fn()}
        onBack={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Вернуться" }).className).toContain(
      "rounded-lg",
    );
    expect(screen.getByRole("button", { name: "Далее" }).className).toContain(
      "rounded-lg",
    );
  });
});
