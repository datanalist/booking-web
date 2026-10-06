import { NAME_MAX, NAME_MIN } from "../../../config";
import { formatPhoneMask } from "../../../lib/formatPhoneMask";
import type { ProfileEditFieldErrors } from "./ProfileEditFieldErrors";
import type { ParseProfileEditValuesResult } from "./ParseProfileEditValuesResult";
import type { ProfileEditValues } from "./ProfileEditValues";
import { presentProfilePhoto } from "./presentProfilePhoto";

/** Тот же формат, что неэкспортированный validateEmail в api/auth. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ParsedField =
  | { status: "ok"; value: string }
  | { status: "error"; message: string };

function parseName(name: string): ParsedField {
  const value = name.trim();
  if (value.length < NAME_MIN || value.length > NAME_MAX) {
    return {
      status: "error",
      message: `Введите имя от ${NAME_MIN} до ${NAME_MAX} символов`,
    };
  }
  return { status: "ok", value };
}

function parsePhone(phone: string): ParsedField {
  const value = formatPhoneMask(phone);
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11 || !digits.startsWith("7")) {
    return { status: "error", message: "Введите корректный номер телефона" };
  }
  return { status: "ok", value };
}

function parseEmail(email: string): ParsedField {
  const value = email.trim().toLowerCase();
  if (value.length === 0) {
    return { status: "error", message: "Обязательное поле" };
  }
  if (!EMAIL_PATTERN.test(value)) {
    return { status: "error", message: "Введите корректный email" };
  }
  return { status: "ok", value };
}

function collectErrors(
  name: ParsedField,
  phone: ParsedField,
  email: ParsedField,
): ProfileEditFieldErrors {
  return {
    ...(name.status === "error" ? { name: name.message } : {}),
    ...(phone.status === "error" ? { phone: phone.message } : {}),
    ...(email.status === "error" ? { email: email.message } : {}),
  };
}

export function parseProfileEditValues(
  input: ProfileEditValues,
): ParseProfileEditValuesResult {
  const name = parseName(input.name);
  const phone = parsePhone(input.phone);
  const email = parseEmail(input.email);
  if (
    name.status === "error" ||
    phone.status === "error" ||
    email.status === "error"
  ) {
    return { status: "errors", errors: collectErrors(name, phone, email) };
  }
  const photoUrl = presentProfilePhoto(input.photoUrl);
  return {
    status: "ok",
    values: {
      name: name.value,
      phone: phone.value,
      email: email.value,
      ...(photoUrl !== undefined ? { photoUrl } : {}),
    },
  };
}
