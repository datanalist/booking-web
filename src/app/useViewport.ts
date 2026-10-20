import { useEffect, useState } from "react";
import { DESKTOP_MIN_WIDTH } from "../config";

export function isDesktopWidth(width: number): boolean {
  return width >= DESKTOP_MIN_WIDTH;
}

/** Зум и узкое окно уменьшают innerWidth, но не ширину экрана. */
export function isDesktopSurface(innerWidth: number, screenWidth: number): boolean {
  return isDesktopWidth(Math.max(innerWidth, screenWidth));
}

function readSurfaceWidth(): number {
  if (typeof window === "undefined") {
    return DESKTOP_MIN_WIDTH;
  }
  return Math.max(window.innerWidth, window.screen?.width ?? 0);
}

export function useViewport(): { isDesktop: boolean } {
  const [width, setWidth] = useState(readSurfaceWidth);

  useEffect(() => {
    const onResize = (): void => {
      setWidth(readSurfaceWidth());
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return { isDesktop: isDesktopWidth(width) };
}
