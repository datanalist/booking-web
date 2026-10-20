import { useState, type ReactNode } from "react";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../config";
import { StagePortalProvider } from "./stagePortal";
import { useCanvasScale } from "./useCanvasScale";

type ScaledStageProps = {
  children: ReactNode;
};

/** Холст 1440×1020, который целиком вписывается в окно и растёт вместе с ним. */
export function ScaledStage({ children }: ScaledStageProps) {
  const scale = useCanvasScale();
  const [node, setNode] = useState<HTMLDivElement | null>(null);

  return (
    <div className="flex h-dvh w-dvw items-center justify-center overflow-hidden bg-[#fffdf8]">
      <div
        className="relative shrink-0"
        style={{
          width: CANVAS_WIDTH * scale,
          height: CANVAS_HEIGHT * scale,
        }}
      >
        <div
          ref={setNode}
          className="absolute top-0 left-0"
          style={{
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <StagePortalProvider value={node}>{children}</StagePortalProvider>
        </div>
      </div>
    </div>
  );
}
