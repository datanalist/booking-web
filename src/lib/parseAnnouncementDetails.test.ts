import { expect, test } from "vitest";
import { DESCRIPTION_MAX } from "../config";
import { parseAnnouncementDetails } from "./parseAnnouncementDetails";

test("parses empty optional details", () => {
  const result = parseAnnouncementDetails({
    accessInfo: "",
    houseRules: "",
    extraInfo: "",
  });
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.value.accessInfo).toBe("");
    expect(result.value.houseRules).toBe("");
    expect(result.value.extraInfo).toBe("");
  }
});

test("rejects fields over max length", () => {
  const tooLong = "a".repeat(DESCRIPTION_MAX + 1);
  const result = parseAnnouncementDetails({
    accessInfo: tooLong,
    houseRules: "ok",
    extraInfo: tooLong,
  });
  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.errors.accessInfo).toMatch(/500/);
    expect(result.errors.extraInfo).toMatch(/500/);
    expect(result.errors.houseRules).toBeUndefined();
  }
});

test("accepts text at max length", () => {
  const max = "б".repeat(DESCRIPTION_MAX);
  const result = parseAnnouncementDetails({
    accessInfo: max,
    houseRules: max,
    extraInfo: max,
  });
  expect(result.ok).toBe(true);
});
