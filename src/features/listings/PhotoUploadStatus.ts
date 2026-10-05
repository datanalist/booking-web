/** Состояние обработки фото на шаге мастера (взаимоисключающие варианты). */
export type PhotoUploadStatus =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string };

export const PHOTO_UPLOAD_IDLE: PhotoUploadStatus = { kind: "idle" };
