import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { centeredCoverDrawRect } from "../lib/centeredCoverDrawRect";
import {
  clampAvatarPhotoOffset,
  type AvatarPhotoOffset,
} from "../lib/clampAvatarPhotoOffset";
import {
  AVATAR_PHOTO_SCALE_DEFAULT,
  clampAvatarPhotoScale,
} from "../lib/clampAvatarPhotoScale";
import { AVATAR_CROP_SIZE, cropCenteredAvatar } from "../lib/cropCenteredAvatar";
import { clientDeltaToLocal, StagePortal } from "../app/stagePortal";
import { AvatarPhotoScaleControl } from "./AvatarPhotoScaleControl";
import { Button } from "./Button";

const PREVIEW_SIZE = 280;

type AvatarCropDialogProps = {
  open: boolean;
  source: string;
  onConfirm: (croppedDataUrl: string) => void;
  onCancel: () => void;
};

type ImageNaturalSize = {
  width: number;
  height: number;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  origin: AvatarPhotoOffset;
};

export function AvatarCropDialog({
  open,
  source,
  onConfirm,
  onCancel,
}: AvatarCropDialogProps) {
  const [imageSize, setImageSize] = useState<ImageNaturalSize | null>(null);
  const [scale, setScale] = useState(AVATAR_PHOTO_SCALE_DEFAULT);
  const [offset, setOffset] = useState<AvatarPhotoOffset>({ x: 0, y: 0 });
  const [pending, setPending] = useState(false);
  const dragRef = useRef<DragState | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(scale);
  const imageSizeRef = useRef(imageSize);
  scaleRef.current = scale;
  imageSizeRef.current = imageSize;

  useEffect(() => {
    if (!open) {
      return;
    }
    setScale(AVATAR_PHOTO_SCALE_DEFAULT);
    setOffset({ x: 0, y: 0 });
    setImageSize(null);
    setPending(false);
    const image = new Image();
    image.onload = () => {
      setImageSize({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.src = source;
  }, [open, source]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const node = previewRef.current;
    if (node === null) {
      return;
    }
    function onWheel(event: WheelEvent): void {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -0.1 : 0.1;
      const safe = clampAvatarPhotoScale(scaleRef.current + delta);
      setScale(safe);
      const size = imageSizeRef.current;
      if (size === null) {
        return;
      }
      setOffset((prev) =>
        clampAvatarPhotoOffset(size, AVATAR_CROP_SIZE, safe, prev),
      );
    }
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      node.removeEventListener("wheel", onWheel);
    };
  }, [open, imageSize]);

  if (!open) {
    return null;
  }

  const previewRatio = PREVIEW_SIZE / AVATAR_CROP_SIZE;
  const previewOffset: AvatarPhotoOffset = {
    x: offset.x * previewRatio,
    y: offset.y * previewRatio,
  };
  const drawRect =
    imageSize === null
      ? null
      : centeredCoverDrawRect(imageSize, PREVIEW_SIZE, scale, previewOffset);

  function updateScale(nextScale: number): void {
    const safe = clampAvatarPhotoScale(nextScale);
    setScale(safe);
    if (imageSize === null) {
      return;
    }
    setOffset((prev) =>
      clampAvatarPhotoOffset(imageSize, AVATAR_CROP_SIZE, safe, prev),
    );
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>): void {
    if (imageSize === null || event.button !== 0) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: offset,
    };
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>): void {
    const drag = dragRef.current;
    if (drag === null || drag.pointerId !== event.pointerId || imageSize === null) {
      return;
    }
    const preview = event.currentTarget;
    const dx = clientDeltaToLocal(event.clientX - drag.startX, preview) / previewRatio;
    const dy = clientDeltaToLocal(event.clientY - drag.startY, preview) / previewRatio;
    setOffset(
      clampAvatarPhotoOffset(imageSize, AVATAR_CROP_SIZE, scale, {
        x: drag.origin.x + dx,
        y: drag.origin.y + dy,
      }),
    );
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>): void {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  }

  async function onDone(): Promise<void> {
    if (pending) {
      return;
    }
    setPending(true);
    try {
      const cropped = await cropCenteredAvatar(source, { scale, offset });
      onConfirm(cropped);
    } finally {
      setPending(false);
    }
  }

  return (
    <StagePortal>
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 font-sans"
      role="presentation"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-crop-title"
        className="flex w-[360px] flex-col items-center gap-5 rounded-[12px] bg-white p-6 shadow-[0px_20px_24px_-4px_rgba(16,24,40,0.08)]"
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id="avatar-crop-title"
          className="m-0 w-full text-center text-[20px] font-bold leading-[1.2] text-[var(--color-ink)]"
        >
          Обрезка фото
        </h2>

        <div
          ref={previewRef}
          className="relative size-[280px] cursor-grab touch-none overflow-hidden rounded-full border border-solid border-[#f88a2a] active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          role="img"
          aria-label="Область обрезки фото"
        >
          {drawRect ? (
            <img
              src={source}
              alt=""
              draggable={false}
              className="pointer-events-none absolute max-w-none select-none"
              style={{
                left: drawRect.dx,
                top: drawRect.dy,
                width: drawRect.dw,
                height: drawRect.dh,
              }}
            />
          ) : (
            <span className="flex size-full items-center justify-center text-[14px] text-[var(--color-ink)]">
              Загрузка…
            </span>
          )}
        </div>

        <AvatarPhotoScaleControl value={scale} onChange={updateScale} />

        <div className="flex w-full gap-3">
          <Button
            type="button"
            variant="outlined"
            className="w-full !h-[48px] !rounded-[8px] !text-[16px]"
            onClick={onCancel}
            disabled={pending}
          >
            Отмена
          </Button>
          <Button
            type="button"
            className="w-full !h-[48px] !rounded-[8px] !text-[16px]"
            onClick={() => {
              void onDone();
            }}
            disabled={pending || imageSize === null}
          >
            Готово
          </Button>
        </div>
      </div>
    </div>
    </StagePortal>
  );
}
