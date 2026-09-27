import { afterEach, expect, test, vi } from "vitest";
import { AVATAR_CROP_SIZE, cropCenteredAvatar } from "./cropCenteredAvatar";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test("draws cover-scaled image into a square jpeg", async () => {
  const drawImage = vi.fn();
  const toDataURL = vi.fn(() => "data:image/jpeg;base64,cropped");
  const close = vi.fn();

  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      blob: async () => new Blob(["x"], { type: "image/jpeg" }),
    })),
  );
  vi.stubGlobal(
    "createImageBitmap",
    vi.fn(async () => ({
      width: 200,
      height: 100,
      close,
    })),
  );

  const createElement = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
    if (tagName === "canvas") {
      const canvas = {
        width: 0,
        height: 0,
        getContext: () => ({ drawImage }),
        toDataURL,
      };
      return canvas as unknown as HTMLCanvasElement;
    }
    return createElement(tagName);
  });

  const result = await cropCenteredAvatar("data:image/jpeg;base64,source", {
    scale: 2,
    size: 100,
  });

  expect(result).toBe("data:image/jpeg;base64,cropped");
  expect(drawImage).toHaveBeenCalledWith(
    expect.objectContaining({ width: 200, height: 100 }),
    -150,
    -50,
    400,
    200,
  );
  expect(close).toHaveBeenCalledOnce();
  expect(toDataURL).toHaveBeenCalledWith("image/jpeg", 0.8);
});

test("applies pan offset when drawing", async () => {
  const drawImage = vi.fn();
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
        getContext: () => ({ drawImage }),
        toDataURL: () => "data:image/jpeg;base64,cropped",
      };
      return canvas as unknown as HTMLCanvasElement;
    }
    return createElement(tagName);
  });

  await cropCenteredAvatar("data:image/jpeg;base64,source", {
    scale: 2,
    offset: { x: 10, y: -5 },
    size: 50,
  });

  expect(drawImage).toHaveBeenCalledWith(
    expect.objectContaining({ width: 100, height: 100 }),
    -15,
    -30,
    100,
    100,
  );
});

test("uses default crop size", async () => {
  let capturedWidth = 0;
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
        toDataURL: () => "data:image/jpeg;base64,ok",
      };
      Object.defineProperty(canvas, "width", {
        get: () => capturedWidth,
        set: (value: number) => {
          capturedWidth = value;
        },
      });
      return canvas as unknown as HTMLCanvasElement;
    }
    return createElement(tagName);
  });

  await cropCenteredAvatar("data:image/jpeg;base64,source", { scale: 1 });
  expect(capturedWidth).toBe(AVATAR_CROP_SIZE);
});
