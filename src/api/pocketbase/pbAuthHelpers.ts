import { NAME_MAX, NAME_MIN, PASSWORD_MIN } from "../../config";
import { SESSION_KEY } from "../keys";
import type { Session } from "../types";
import { isRecord } from "./isRecord";
import type { PbRequestError } from "./pbClient";
import type { PbUserRecord } from "./pbTypes";
import type { PbUserPatch } from "./userMapper";

type AuthErrorCode =
  | "EMAIL_TAKEN"
  | "INVALID_EMAIL"
  | "INVALID_PASSWORD"
  | "INVALID_CREDENTIALS"
  | "INVALID_TOKEN"
  | "INVALID_NAME"
  | "INVALID_PHONE"
  | "PB_FORBIDDEN";

export type ProfilePhoto =
  | { kind: "keep" }
  | { kind: "clear" }
  | { kind: "file"; dataUrl: string };

export function authError(code: AuthErrorCode, message: string): Error & { code: AuthErrorCode } {
  return Object.assign(new Error(message), { code });
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateEmail(email: string): string {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    throw authError("INVALID_EMAIL", "Обязательное поле");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw authError("INVALID_EMAIL", "Введите корректный email");
  }
  return normalized;
}

export function validatePassword(password: string): void {
  if (password.length < PASSWORD_MIN) {
    throw authError("INVALID_PASSWORD", "Минимум 8 символов");
  }
}

export function validateName(name: string): string {
  const normalizedName = name.trim();
  if (normalizedName.length < NAME_MIN || normalizedName.length > NAME_MAX) {
    throw authError("INVALID_NAME", "Введите имя от 2 до 50 символов");
  }
  return normalizedName;
}

export function validatePhone(phone: string): string {
  const phoneDigits = phone.replace(/\D/g, "");
  if (phoneDigits.length !== 11 || !phoneDigits.startsWith("7")) {
    throw authError("INVALID_PHONE", "Введите корректный номер телефона");
  }
  return `+${phoneDigits}`;
}

export function mentionsEmail(error: PbRequestError): boolean {
  return `${error.message} ${JSON.stringify(error.body)}`.toLowerCase().includes("email");
}

function readString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

function readNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function readRoles(value: unknown): PbUserRecord["roles"] {
  if (!Array.isArray(value)) {
    return [];
  }
  const roles: PbUserRecord["roles"] = [];
  for (const role of value) {
    if (role === "guest" || role === "host" || role === "staff") {
      roles.push(role);
    }
  }
  return roles;
}

function readAccountStatus(value: unknown): PbUserRecord["account_status"] {
  if (value === "active" || value === "pending" || value === "blocked" || value === "rejected") {
    return value;
  }
  return "active";
}

export function readUserRecord(value: unknown): PbUserRecord {
  if (!isRecord(value) || typeof value.id !== "string" || value.id.length === 0) {
    throw new Error("Некорректный ответ пользователя");
  }
  return {
    id: value.id,
    email: readString(value, "email"),
    verified: value.verified === true,
    name: readString(value, "name"),
    first_name: readString(value, "first_name"),
    last_name: readString(value, "last_name"),
    birthdate: readString(value, "birthdate"),
    phone: readString(value, "phone"),
    avatar: readString(value, "avatar"),
    limited_browse: value.limited_browse === true,
    bio: readString(value, "bio"),
    roles: readRoles(value.roles),
    account_status: readAccountStatus(value.account_status),
    verified_host: value.verified_host === true,
    years_hosting: readNumber(value.years_hosting),
    rating: readNumber(value.rating),
    reviews_count: readNumber(value.reviews_count),
    balance: readNumber(value.balance),
    created: readString(value, "created"),
    updated: readString(value, "updated"),
  };
}

export function readSession(storage: Storage): Session {
  const raw = storage.getItem(SESSION_KEY);
  if (raw === null) {
    throw authError("INVALID_CREDENTIALS", "Неверный email или пароль");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw authError("INVALID_CREDENTIALS", "Неверный email или пароль");
  }
  if (!isRecord(parsed) || typeof parsed.userId !== "string" || parsed.userId.length === 0) {
    throw authError("INVALID_CREDENTIALS", "Неверный email или пароль");
  }
  const session: Session = {
    userId: parsed.userId,
    email: typeof parsed.email === "string" ? parsed.email : "",
    name: typeof parsed.name === "string" ? parsed.name : "",
    phone: typeof parsed.phone === "string" ? parsed.phone : "",
    onboardingComplete: parsed.onboardingComplete === true,
  };
  if (typeof parsed.photoUrl === "string" && parsed.photoUrl.length > 0) {
    session.photoUrl = parsed.photoUrl;
  }
  if (typeof parsed.balance === "number" && Number.isFinite(parsed.balance)) {
    session.balance = parsed.balance;
  }
  return session;
}

export function writeSession(storage: Storage, session: Session): Session {
  storage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function photoChoice(photoUrl: string | undefined, clearWhenBlank: boolean): ProfilePhoto {
  if (photoUrl === undefined) {
    return { kind: "keep" };
  }
  const trimmed = photoUrl.trim();
  if (trimmed.startsWith("data:")) {
    return { kind: "file", dataUrl: trimmed };
  }
  if (clearWhenBlank && trimmed.length === 0) {
    return { kind: "clear" };
  }
  return { kind: "keep" };
}

function bytesFromBase64(payload: string): ArrayBuffer {
  const binary = atob(payload.replace(/\s/g, ""));
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return buffer;
}

function blobFromDataUrl(dataUrl: string): { blob: Blob; filename: string } {
  const comma = dataUrl.indexOf(",");
  if (comma < "data:".length) {
    throw new Error("Некорректное фото");
  }
  const header = dataUrl.slice("data:".length, comma);
  const payload = dataUrl.slice(comma + 1);
  const parts = header.split(";");
  const mime = parts[0] !== undefined && parts[0].length > 0 ? parts[0] : "application/octet-stream";
  const blob = parts.includes("base64")
    ? new Blob([bytesFromBase64(payload)], { type: mime })
    : new Blob([decodeURIComponent(payload)], { type: mime });
  const filename = mime === "image/png"
    ? "avatar.png"
    : mime === "image/webp"
      ? "avatar.webp"
      : mime === "image/gif"
        ? "avatar.gif"
        : "avatar.jpg";
  return { blob, filename };
}

export function userPatchBody(patch: PbUserPatch, photo: ProfilePhoto): object {
  if (photo.kind === "file") {
    const { blob, filename } = blobFromDataUrl(photo.dataUrl);
    const form = new FormData();
    form.set("name", patch.name);
    form.set("first_name", patch.first_name);
    form.set("last_name", patch.last_name);
    form.set("phone", patch.phone);
    form.set("avatar", blob, filename);
    return form;
  }
  if (photo.kind === "clear") {
    return { ...patch, avatar: "" };
  }
  return patch;
}
