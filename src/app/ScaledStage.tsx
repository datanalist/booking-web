import { useState, type ReactNode } from "react";
import { StagePortalProvider } from "./stagePortal";

type ScaledStageProps = {
  children: ReactNode;
};

/**
 * Окно на весь вьюпорт. Макет 1440×1020 задаёт сайдбар, отступы и типографику;
 * контент и высота тянутся вместе с окном, без масштаба холста.
 */
export function ScaledStage({ children }: ScaledStageProps) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);

  return (
    <div className="h-dvh w-dvw overflow-hidden bg-[#fffdf8]">
      <div ref={setNode} className="relative h-full min-h-0 w-full min-w-0">
        <StagePortalProvider value={node}>{children}</StagePortalProvider>
      </div>
    </div>
  );
}
