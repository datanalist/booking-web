import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { AvatarCropDialog } from "./AvatarCropDialog";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function stubImageLoad(width: number, height: number): void {
  vi.stubGlobal(
    "Image",
    class {
      naturalWidth = width;
      naturalHeight = height;
      onload: (() => void) | null = null;
      set src(_value: string) {
        this.onload?.();
      }
    },
  );
}

test("cancel closes without confirming", async () => {
  stubImageLoad(100, 100);
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <AvatarCropDialog
      open
      source="data:image/jpeg;base64,source"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />,
  );

  expect(screen.getByRole("dialog", { name: "Обрезка фото" })).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Отмена" }));
  expect(onCancel).toHaveBeenCalledOnce();
  expect(onConfirm).not.toHaveBeenCalled();
});

test("done crops and confirms", async () => {
  stubImageLoad(100, 100);
  const onConfirm = vi.fn();
  const onCancel = vi.fn();

  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      blob: async () => new Blob(["x"], { type: "image/jpeg" }),
    })),
  );
  vi.stubGlobal(
    "createImageBitmap",
    vi.fn(async () => ({
      width: 100,
      height: 100,
      close: vi.fn(),
    })),
  );
  const createElement = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
    if (tagName === "canvas") {
      const canvas = {
        width: 0,
        height: 0,
        getContext: () => ({ drawImage: vi.fn() }),
        toDataURL: () => "data:image/jpeg;base64,cropped",
      };
      return canvas as unknown as HTMLCanvasElement;
    }
    return createElement(tagName);
  });

  render(
    <AvatarCropDialog
      open
      source="data:image/jpeg;base64,source"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />,
  );

  await waitFor(() => {
    expect(screen.queryByText("Загрузка…")).not.toBeInTheDocument();
  });
  const done = screen.getByRole("button", { name: "Готово" });
  expect(done).toBeEnabled();
  await userEvent.click(done);
  await waitFor(() => {
    expect(onConfirm).toHaveBeenCalledWith("data:image/jpeg;base64,cropped");
  });
  expect(onCancel).not.toHaveBeenCalled();
});
