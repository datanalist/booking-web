/** Единая причина изменения: белые плашки с точным текстом впечатываются в кадр обложки. */
export type CoverPaintLine = {
  text: string;
  role: "title" | "detail";
};

export function paintCoverBadges(
  ctx: CanvasRenderingContext2D,
  width: number,
  lines: readonly CoverPaintLine[],
): void {
  const titleSize = Math.max(18, Math.min(46, Math.round(width * 0.042)));
  const detailSize = Math.max(14, Math.round(titleSize * 0.62));
  const margin = Math.max(12, Math.round(width * 0.04));
  const maxBox = Math.max(40, width - margin * 2);
  let y = margin;
  for (const line of lines) {
    const fontSize = fitFontSize(ctx, line.text, line.role === "title" ? titleSize : detailSize, maxBox);
    ctx.font = `700 ${fontSize}px "Noto Sans", "Segoe UI", Arial, sans-serif`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    const measured = ctx.measureText(line.text).width;
    const padX = fontSize * 0.48;
    const padY = fontSize * 0.34;
    const boxW = measured + padX * 2;
    const boxH = fontSize + padY * 2;
    const radius = Math.min(12, boxH * 0.35);
    ctx.fillStyle = "#ffffff";
    fillRoundRect(ctx, margin, y, boxW, boxH, radius);
    ctx.fillStyle = "#1a1b1d";
    ctx.fillText(line.text, margin + padX, y + boxH / 2);
    y += boxH + Math.round(fontSize * 0.38);
  }
}

export async function bakeCoverImage(photo: Blob, lines: readonly CoverPaintLine[]): Promise<Blob> {
  if (lines.length === 0) {
    return photo;
  }
  const url = URL.createObjectURL(photo);
  try {
    const image = await loadImage(url);
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    if (width < 1 || height < 1) {
      throw new Error("Не удалось собрать обложку");
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (ctx === null) {
      throw new Error("Не удалось собрать обложку");
    }
    ctx.drawImage(image, 0, 0, width, height);
    paintCoverBadges(ctx, width, lines);
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.9);
    });
    if (blob === null) {
      throw new Error("Не удалось собрать обложку");
    }
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  startSize: number,
  maxBox: number,
): number {
  let size = startSize;
  while (size > 12) {
    ctx.font = `700 ${size}px "Noto Sans", "Segoe UI", Arial, sans-serif`;
    if (ctx.measureText(text).width + size <= maxBox) {
      return size;
    }
    size -= 1;
  }
  return size;
}

function fillRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
  ctx.fill();
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Не удалось собрать обложку"));
    image.src = url;
  });
}
