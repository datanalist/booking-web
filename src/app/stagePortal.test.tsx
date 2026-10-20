import { render } from "@testing-library/react";
import { expect, test } from "vitest";
import {
  clientDeltaToLocal,
  StagePortal,
  StagePortalProvider,
} from "./stagePortal";

test("pointer delta ignores ancestor css scale", () => {
  const element = document.createElement("div");
  Object.defineProperty(element, "offsetWidth", { value: 280 });
  element.getBoundingClientRect = () =>
    ({
      width: 140,
      height: 140,
      left: 0,
      top: 0,
      right: 140,
      bottom: 140,
      x: 0,
      y: 0,
      toJSON() {
        return {};
      },
    }) as DOMRect;

  expect(clientDeltaToLocal(14, element)).toBe(28);
});

test("stage portal mounts into the scaled canvas", () => {
  const stage = document.createElement("div");
  document.body.appendChild(stage);

  render(
    <StagePortalProvider value={stage}>
      <StagePortal>
        <div data-testid="overlay">окно</div>
      </StagePortal>
    </StagePortalProvider>,
  );

  expect(stage.querySelector("[data-testid=overlay]")).not.toBeNull();
  expect(document.body.querySelector(":scope > [data-testid=overlay]")).toBeNull();
  stage.remove();
});
