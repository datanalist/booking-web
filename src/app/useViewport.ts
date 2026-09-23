import { useEffect, useState } from "react";
import { DESKTOP_MIN_WIDTH } from "../config";

export function isDesktopWidth(width: number): boolean {
  return width >= DESKTOP_MIN_WIDTH;
}

export function useViewport(): { isDesktop: boolean } {
  const [width, setWidth] = useState(() =>
    typeof window === "undefined" ? DESKTOP_MIN_WIDTH : window.innerWidth,
  );

  useEffect(() => {
    const onResize = (): void => {
      setWidth(window.innerWidth);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return { isDesktop: isDesktopWidth(width) };
}
