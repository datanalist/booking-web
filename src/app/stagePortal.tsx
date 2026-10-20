import { createContext, useContext, type ReactNode } from "react";
import { createPortal } from "react-dom";

const StagePortalContext = createContext<HTMLElement | null>(null);

export const StagePortalProvider = StagePortalContext.Provider;

/** Сцена с transform, если приложение обёрнуто в ScaledStage. */
export function useStagePortalRoot(): HTMLElement | null {
  return useContext(StagePortalContext);
}

/** Куда класть портал, чтобы он масштабировался вместе с холстом. */
export function usePortalElement(): HTMLElement {
  return useContext(StagePortalContext) ?? document.body;
}

/** Портал в сцену: оверлей получает тот же scale, что и холст. */
export function StagePortal({ children }: { children: ReactNode }) {
  return createPortal(children, usePortalElement());
}

/** Сдвиг указателя в локальных пикселях элемента, без CSS scale предка. */
export function clientDeltaToLocal(delta: number, element: HTMLElement): number {
  const local = element.offsetWidth;
  if (local <= 0) {
    return delta;
  }
  const scale = element.getBoundingClientRect().width / local;
  if (!Number.isFinite(scale) || scale <= 0) {
    return delta;
  }
  return delta / scale;
}

/** Координаты viewport → локальные пиксели сцены до transform. */
export function clientToStage(
  clientX: number,
  clientY: number,
  stage: HTMLElement,
): { x: number; y: number } {
  const rect = stage.getBoundingClientRect();
  const scaleX = rect.width / stage.offsetWidth || 1;
  const scaleY = rect.height / stage.offsetHeight || 1;
  return {
    x: (clientX - rect.left) / scaleX,
    y: (clientY - rect.top) / scaleY,
  };
}
