import type { Session } from "../types";
import { buildPbFileUrl, resolvePocketBaseUrl } from "./pbClient";
import type { PbUserRecord } from "./pbTypes";

const USERS_FILE_COLLECTION = "_pb_users_auth_";

export type PbUserPatch = {
  name: string;
  first_name: string;
  last_name: string;
  phone: string;
};

function resolveDisplayName(record: PbUserRecord): string {
  const direct = record.name.trim();
  if (direct.length > 0) {
    return direct;
  }
  return [record.first_name, record.last_name]
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .join(" ");
}

function photoUrl(record: PbUserRecord, baseUrl: string): string | undefined {
  const avatar = record.avatar.trim();
  if (avatar.length === 0) {
    return undefined;
  }
  return buildPbFileUrl(baseUrl, USERS_FILE_COLLECTION, record.id, avatar);
}

export function pbUserToSession(record: PbUserRecord, baseUrl?: string): Session {
  const name = resolveDisplayName(record);
  const phone = record.phone ?? "";
  const avatarUrl = photoUrl(record, resolvePocketBaseUrl(baseUrl));
  const session: Session = {
    userId: record.id,
    email: record.email,
    name,
    phone,
    onboardingComplete: Boolean(name.trim() && phone.trim()),
  };
  if (avatarUrl !== undefined) {
    session.photoUrl = avatarUrl;
  }
  if (Number.isFinite(record.balance)) {
    session.balance = record.balance;
  }
  return session;
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"))) {
    return `+7${digits.slice(1)}`;
  }
  if (digits.length === 10) {
    return `+7${digits}`;
  }
  return digits.length > 0 ? `+${digits}` : "";
}

function splitName(name: string): Pick<PbUserPatch, "name" | "first_name" | "last_name"> {
  const parts = name.trim().split(/\s+/).filter((part) => part.length > 0);
  return {
    name: parts.join(" "),
    first_name: parts[0] ?? "",
    last_name: parts.slice(1).join(" "),
  };
}

export function sessionOrInputToPbUserPatch(input: {
  name: string;
  phone: string;
}): PbUserPatch {
  return {
    ...splitName(input.name),
    phone: normalizePhone(input.phone),
  };
}
