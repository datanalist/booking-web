/** Единая причина изменения: точный текст плашек обложки из полей объявления, без выдумок модели. */

export type CoverCardInput = {
  title: string;
  address: string;
  priceNight: number;
  maxGuests: number;
  hasKitchen: boolean;
};

export type CoverBadgeLine = {
  text: string;
  role: "title" | "detail";
};

const TITLE_MAX = 180;
const ADDRESS_MAX = 240;

/**
 * Строки карточки сверху вниз. Пустые поля не попадают в список.
 * После «для» — родительный падеж, как на макете: «ДЛЯ 1 ГОСТЯ», «ДЛЯ 2 ГОСТЕЙ», «ДЛЯ 5 ГОСТЕЙ».
 * Именительный ряд «1 гость, 2 гостя, 5 гостей» здесь даёт «гостя» для 1/21 и «гостей» для остальных.
 */
export function coverBadgeLines(input: CoverCardInput): CoverBadgeLine[] {
  const lines: CoverBadgeLine[] = [];
  const title = upper(input.title, TITLE_MAX);
  if (title.length > 0) {
    lines.push({ text: title, role: "title" });
  }
  const address = upper(input.address, ADDRESS_MAX);
  if (address.length > 0) {
    lines.push({ text: address, role: "detail" });
  }
  const price = priceLine(input.priceNight);
  if (price.length > 0) {
    lines.push({ text: price, role: "detail" });
  }
  const guests = guestLine(input.maxGuests);
  if (guests.length > 0) {
    lines.push({ text: guests, role: "detail" });
  }
  if (input.hasKitchen === true) {
    lines.push({ text: "ЕСТЬ КУХНЯ", role: "detail" });
  }
  return lines;
}

/** «гость / гостя / гостей» в именительном падеже: 1 гость, 2 гостя, 5 гостей. */
export function guestWord(count: number): string {
  const value = Math.trunc(count);
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return "гость";
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "гостя";
  }
  return "гостей";
}

/** Родительный падеж после «для»: 1 гостя, 2 гостей, 5 гостей, 21 гостя, 11 гостей. */
export function guestWordAfterDlya(count: number): string {
  const value = Math.trunc(count);
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return "гостя";
  }
  return "гостей";
}

export function guestLine(count: number): string {
  if (!Number.isFinite(count)) {
    return "";
  }
  const value = Math.trunc(count);
  if (value < 1 || value > 99) {
    return "";
  }
  return `ДЛЯ ${value} ${guestWordAfterDlya(value).toLocaleUpperCase("ru-RU")}`;
}

function priceLine(priceNight: number): string {
  if (!Number.isFinite(priceNight) || priceNight <= 0 || priceNight > 1_000_000_000) {
    return "";
  }
  const amount = Math.round(priceNight);
  if (amount < 1) {
    return "";
  }
  return `ДО ${amount}₽/СУТКИ`;
}

function upper(value: string, max: number): string {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length === 0) {
    return "";
  }
  return trimmed.slice(0, max).toLocaleUpperCase("ru-RU");
}
