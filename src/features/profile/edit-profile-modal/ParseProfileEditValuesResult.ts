import type { ProfileEditFieldErrors } from "./ProfileEditFieldErrors";
import type { ProfileEditValues } from "./ProfileEditValues";

export type ParseProfileEditValuesResult =
  | { status: "ok"; values: ProfileEditValues }
  | { status: "errors"; errors: ProfileEditFieldErrors };
