import { chatClockLabel, type ChatClockLabel } from "../domain/ChatThread";
import { messageTimeLabel, type MessageTimeLabel } from "../domain/MessageTimeLabel";
import { formatMessageTime } from "../presentation/conversation/formatMessageTime";
import type { PbBookingExpand } from "./pbChatTypes";

const CLOCK_FALLBACK = "00:00";

/** Подпись `ЧЧ:ММ` из даты PocketBase. Пустая и битая дата — `00:00`. */
export function clockFromIso(iso: string | undefined): ChatClockLabel {
  const date = iso === undefined ? null : parsePbDate(iso);
  if (date === null) {
    return chatClockLabel(CLOCK_FALLBACK);
  }
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return chatClockLabel(`${hours}:${minutes}`);
}

/** Время пузыря сообщения. Битая дата — `00:00`. */
export function timeLabelFromIso(iso: string): MessageTimeLabel {
  const date = parsePbDate(iso);
  if (date === null) {
    const fallback = messageTimeLabel(CLOCK_FALLBACK);
    if (fallback === null) {
      throw new Error("Не удалось собрать время сообщения");
    }
    return fallback;
  }
  return formatMessageTime(date);
}

/** Даты заезда и выезда в виде `ДД.ММ.ГГ - ДД.ММ.ГГ`. */
export function stayDatesLabel(booking: PbBookingExpand | undefined): string {
  const checkIn = formatStayDate(booking?.check_in);
  const checkOut = formatStayDate(booking?.check_out);
  if (checkIn.length > 0 && checkOut.length > 0) {
    return `${checkIn} - ${checkOut}`;
  }
  return checkIn.length > 0 ? checkIn : checkOut;
}

/** Сумма взрослых и детей со склонением «гость / гостя / гостей». */
export function stayGuestsLabel(booking: PbBookingExpand | undefined): string {
  const total = Math.trunc((booking?.adults ?? 0) + (booking?.children ?? 0));
  const count = Number.isFinite(total) ? Math.max(0, total) : 0;
  return `${count} ${guestWord(count)}`;
}

/** Адрес файла PocketBase: `/api/files/{collection}/{id}/{filename}`. */
export function pbFileUrl(
  baseUrl: string | undefined,
  collection: string,
  recordId: string,
  filename: string,
): string {
  const path = `/api/files/${encodeURIComponent(collection)}/${encodeURIComponent(recordId)}/${encodeURIComponent(filename)}`;
  const base = baseUrl?.trim().replace(/\/+$/, "") ?? "";
  return `${base}${path}`;
}

function formatStayDate(value: string | undefined): string {
  if (value === undefined) {
    return "";
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match === null) {
    return "";
  }
  const year = match[1] ?? "";
  const month = match[2] ?? "";
  const day = match[3] ?? "";
  return `${day}.${month}.${year.slice(2)}`;
}

function guestWord(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return "гость";
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "гостя";
  }
  return "гостей";
}

function parsePbDate(value: string): Date | null {
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}
