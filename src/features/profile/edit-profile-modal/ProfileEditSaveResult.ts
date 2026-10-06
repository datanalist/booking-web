import type { ProfileEditFieldErrors } from "./ProfileEditFieldErrors";
import type { ProfileEditValues } from "./ProfileEditValues";

/** Контракт сохранения алерта: успех либо ошибки полей. */
export type ProfileEditSaveResult =
  | { status: "ok" }
  | { status: "errors"; errors: ProfileEditFieldErrors };

export type ProfileEditSaveHandler = (
  values: ProfileEditValues,
) => void | ProfileEditSaveResult | Promise<void | ProfileEditSaveResult>;
