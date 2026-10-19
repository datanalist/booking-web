const ISO_DAY = /(\d{4}-\d{2}-\d{2})/;
const DEFAULT_REMAINING_LABEL = "12:00";

export function isoDayKey(value: string): string {
  return ISO_DAY.exec(value)?.[1] ?? "";
}

export function calendarDayKey(now: Date): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${String(now.getFullYear())}-${month}-${day}`;
}

/** День `now` лежит в полуинтервале [checkIn, checkOut). */
export function isStayDay(checkIn: string, checkOut: string, now: Date): boolean {
  const start = isoDayKey(checkIn);
  const end = isoDayKey(checkOut);
  const today = calendarDayKey(now);
  return start !== "" && end !== "" && today >= start && today < end;
}

function parseDeadline(value: string): number | null {
  const raw = value.trim();
  if (raw === "") return null;
  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const deadline = Date.parse(normalized);
  return Number.isNaN(deadline) ? null : deadline;
}

function clockLabel(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** Остаток до `prepay_until` как `ЧЧ:ММ`. Пустой или неразборчивый срок — `12:00`. */
export function formatRemainingLabel(prepayUntil: string, now: Date): string {
  const deadline = parseDeadline(prepayUntil);
  if (deadline === null) return DEFAULT_REMAINING_LABEL;
  const remainingMs = deadline - now.getTime();
  if (remainingMs <= 0) return "00:00";
  return clockLabel(Math.floor(remainingMs / 60_000));
}
