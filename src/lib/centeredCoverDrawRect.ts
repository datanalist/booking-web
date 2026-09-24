export type ImageSize = {
  width: number;
  height: number;
};

export type DrawRect = {
  dx: number;
  dy: number;
  dw: number;
  dh: number;
};

export type CoverOffset = {
  x: number;
  y: number;
};

/** Rect for object-cover + zoom + pan, filling a square output. */
export function centeredCoverDrawRect(
  image: ImageSize,
  outputSize: number,
  scale: number,
  offset: CoverOffset = { x: 0, y: 0 },
): DrawRect {
  const cover = Math.max(outputSize / image.width, outputSize / image.height);
  const effective = cover * scale;
  const dw = image.width * effective;
  const dh = image.height * effective;
  const maxX = Math.max(0, (dw - outputSize) / 2);
  const maxY = Math.max(0, (dh - outputSize) / 2);
  const ox = Math.min(maxX, Math.max(-maxX, offset.x));
  const oy = Math.min(maxY, Math.max(-maxY, offset.y));
  return {
    dx: (outputSize - dw) / 2 + ox,
    dy: (outputSize - dh) / 2 + oy,
    dw,
    dh,
  };
}
