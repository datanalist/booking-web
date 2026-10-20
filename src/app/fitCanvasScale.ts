import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../config";

/** Доля, на которую холст 1440×1020 целиком помещается в окно. */
export function fitCanvasScale(width: number, height: number): number {
  if (width <= 0 || height <= 0) {
    return 1;
  }
  return Math.min(width / CANVAS_WIDTH, height / CANVAS_HEIGHT);
}
