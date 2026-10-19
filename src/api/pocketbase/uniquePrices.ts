import { parseIsoDate } from "../../lib/isoDate";
import type { UniquePriceEntry } from "../types";
import { isRecord } from "./isRecord";

export type PbUniquePricePayload = {
  date: string;
  base: number;
};

function asArray(value: unknown): unknown[] | null {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value !== "string" || !value.trim().startsWith("[")) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function readEntry(value: unknown): UniquePriceEntry | null {
  if (!isRecord(value) || typeof value.base !== "number" || !Number.isFinite(value.base)) {
    return null;
  }
  if (value.date === "") {
    return { date: "", base: value.base };
  }
  if (typeof value.date !== "string") {
    return null;
  }
  const date = parseIsoDate(value.date);
  if (date === null) {
    return null;
  }
  return { date, base: value.base };
}

export function uniquePricesFromPb(value: unknown): UniquePriceEntry[] {
  const source = asArray(value);
  if (source === null) {
    return [];
  }
  const entries: UniquePriceEntry[] = [];
  for (const item of source) {
    const entry = readEntry(item);
    if (entry !== null) {
      entries.push(entry);
    }
  }
  return entries;
}

export function uniquePricesToPb(
  entries: readonly UniquePriceEntry[],
): PbUniquePricePayload[] {
  const payload: PbUniquePricePayload[] = [];
  for (const entry of entries) {
    if (!Number.isFinite(entry.base)) {
      continue;
    }
    if (entry.date !== "" && parseIsoDate(entry.date) === null) {
      continue;
    }
    payload.push({ date: entry.date, base: entry.base });
  }
  return payload;
}
