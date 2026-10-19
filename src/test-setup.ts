import "@testing-library/jest-dom/vitest";
import { beforeEach, vi } from "vitest";

beforeEach(() => {
  vi.stubEnv("VITE_DATA_SOURCE", "");
});
