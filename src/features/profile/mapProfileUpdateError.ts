import type { ProfileEditSaveResult } from "./edit-profile-modal";

const FIELD_BY_CODE = {
  INVALID_NAME: "name",
  INVALID_PHONE: "phone",
  INVALID_EMAIL: "email",
  EMAIL_TAKEN: "email",
} as const;

type AuthFieldCode = keyof typeof FIELD_BY_CODE;
type ProfileFieldName = (typeof FIELD_BY_CODE)[AuthFieldCode];

function isAuthFieldCode(value: string): value is AuthFieldCode {
  return value in FIELD_BY_CODE;
}

function readUpdateFailure(
  error: unknown,
): { field: ProfileFieldName; message: string } | null {
  if (!(error instanceof Error) || !("code" in error)) {
    return null;
  }
  const code: unknown = error.code;
  if (typeof code !== "string" || !isAuthFieldCode(code)) {
    return null;
  }
  return { field: FIELD_BY_CODE[code], message: error.message };
}

function errorsFor(
  field: ProfileFieldName,
  message: string,
): ProfileEditSaveResult {
  switch (field) {
    case "name":
      return { status: "errors", errors: { name: message } };
    case "phone":
      return { status: "errors", errors: { phone: message } };
    case "email":
      return { status: "errors", errors: { email: message } };
  }
}

export function mapProfileUpdateError(error: unknown): ProfileEditSaveResult {
  const failure = readUpdateFailure(error);
  if (failure === null) {
    return {
      status: "errors",
      errors: { email: "Не удалось сохранить профиль" },
    };
  }
  return errorsFor(failure.field, failure.message);
}
