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

/** Rect for object-cover + zoom, centered in a square output. */
export function centeredCoverDrawRect(
  image: ImageSize,
  outputSize: number,
  scale: number,
): DrawRect {
  const cover = Math.max(outputSize / image.width, outputSize / image.height);
  const effective = cover * scale;
  const dw = image.width * effective;
  const dh = image.height * effective;
  return {
    dx: (outputSize - dw) / 2,
    dy: (outputSize - dh) / 2,
    dw,
    dh,
  };
}
