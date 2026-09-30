import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import { WizardSteps } from "./WizardSteps";
import type { WizardStepNumber } from "./WizardStepNumber";
import {
  wizardProgressPercent,
  wizardStepProgress,
} from "./wizardStepProgress";

afterEach(() => {
  cleanup();
});

const STEPS: readonly WizardStepNumber[] = [1, 2, 3, 4, 5, 6];

describe("WizardSteps", () => {
  test.each(STEPS)(
    "шаг %i: линия идёт от начала до текущего шага включительно",
    (current) => {
      render(<WizardSteps current={current} />);

      const line = screen.getByTestId("wizard-steps-progress");
      expect(line).toHaveClass("left-0", "h-0.5", "bg-[var(--color-ink)]");
      expect(line.style.width).toBe(`${(current / 6) * 100}%`);

      const items = screen.getAllByRole("listitem");
      expect(items).toHaveLength(6);
      items.forEach((item, index) => {
        const step = (index + 1) as WizardStepNumber;
        const expected =
          step < current ? "passed" : step === current ? "current" : "upcoming";
        expect(item).toHaveAttribute("data-progress", expected);
        expect(item).toHaveClass("flex-1");
        if (expected === "upcoming") {
          expect(item).toHaveClass("text-[#525353]");
        } else {
          expect(item).toHaveClass("text-[var(--color-ink)]");
        }
      });
    },
  );

  test("у каждого элемента одинаковая геометрия без зазоров", () => {
    render(<WizardSteps current={2} />);
    const classes = screen
      .getAllByRole("listitem")
      .map((item) => item.className.replace(/text-\S+/g, "").trim());
    expect(new Set(classes).size).toBe(1);
    expect(screen.getByRole("list").className).not.toMatch(/\bgap-/);
  });

  test("текущий шаг помечен aria-current", () => {
    render(<WizardSteps current={4} />);
    expect(screen.getByText("4. Правила").closest("li")).toHaveAttribute(
      "aria-current",
      "step",
    );
  });
});

describe("wizardStepProgress", () => {
  test("классифицирует шаги относительно текущего", () => {
    expect(wizardStepProgress(1, 3)).toBe("passed");
    expect(wizardStepProgress(3, 3)).toBe("current");
    expect(wizardStepProgress(4, 3)).toBe("upcoming");
  });

  test("доля ширины растёт до 100% на последнем шаге", () => {
    expect(wizardProgressPercent(6)).toBe(100);
    expect(wizardProgressPercent(3)).toBe(50);
  });
});
