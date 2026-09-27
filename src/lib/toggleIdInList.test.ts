import { describe, expect, it } from "vitest";
import { toggleIdInList } from "./toggleIdInList";

describe("toggleIdInList", () => {
  it("adds missing id", () => {
    expect(toggleIdInList(["wifi"], "tv")).toEqual(["wifi", "tv"]);
  });

  it("removes existing id", () => {
    expect(toggleIdInList(["wifi", "tv"], "wifi")).toEqual(["tv"]);
  });
});
