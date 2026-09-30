import { describe, expect, it } from "vitest";
import { parseBookingTab } from "./parseBookingTab";

describe("parseBookingTab", () => {
  it("defaults to requests", () => {
    expect(parseBookingTab(null)).toBe("requests");
    expect(parseBookingTab("unknown")).toBe("requests");
  });

  it("accepts rejected", () => {
    expect(parseBookingTab("rejected")).toBe("rejected");
  });
});
