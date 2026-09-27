import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import type { AmenityId, ExtraAmenityId } from "../api/types";
import { AmenitiesStep } from "../ui/AmenitiesStep";

function AmenitiesHarness() {
  const [amenities, setAmenities] = useState<ReadonlySet<AmenityId>>(new Set());
  const [extras, setExtras] = useState<ReadonlySet<ExtraAmenityId>>(new Set());

  return (
    <AmenitiesStep
      selectedAmenities={amenities}
      selectedExtras={extras}
      pending={false}
      onToggleAmenity={(id) => {
        setAmenities((current) => {
          const next = new Set(current);
          if (next.has(id)) {
            next.delete(id);
          } else {
            next.add(id);
          }
          return next;
        });
      }}
      onToggleExtra={(id) => {
        setExtras((current) => {
          const next = new Set(current);
          if (next.has(id)) {
            next.delete(id);
          } else {
            next.add(id);
          }
          return next;
        });
      }}
      onBack={() => undefined}
      onNext={() => undefined}
    />
  );
}

describe("AmenitiesStep", () => {
  it("starts with grey chips and toggles selection on click", async () => {
    const user = userEvent.setup();
    render(<AmenitiesHarness />);

    const wifi = screen.getByRole("button", { name: /Wifi/i });
    expect(wifi).toHaveAttribute("aria-pressed", "false");
    expect(wifi.className).toContain("bg-white");
    expect(wifi.className).toContain("text-[#525353]");

    await user.click(wifi);
    expect(wifi).toHaveAttribute("aria-pressed", "true");
    expect(wifi.className).toContain("bg-[var(--color-accent)]");
    expect(wifi.className).toContain("text-white");

    await user.click(wifi);
    expect(wifi).toHaveAttribute("aria-pressed", "false");
    expect(wifi.className).toContain("bg-white");
  });
});
