import { useEffect, useState } from "react";
import { fitCanvasScale } from "./fitCanvasScale";

function readViewport(): { width: number; height: number } {
  const visual = window.visualViewport;
  return {
    width: visual?.width ?? window.innerWidth,
    height: visual?.height ?? window.innerHeight,
  };
}

export function useCanvasScale(): number {
  const [scale, setScale] = useState(() => {
    if (typeof window === "undefined") {
      return 1;
    }
    const { width, height } = readViewport();
    return fitCanvasScale(width, height);
  });

  useEffect(() => {
    const update = (): void => {
      const { width, height } = readViewport();
      setScale(fitCanvasScale(width, height));
    };
    update();
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, []);

  return scale;
}
