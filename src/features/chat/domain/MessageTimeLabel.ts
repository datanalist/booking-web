declare const messageTimeLabelBrand: unique symbol;

/** Подпись времени сообщения, только `ЧЧ:ММ`. */
export type MessageTimeLabel = string & {
  readonly [messageTimeLabelBrand]: true;
};

const MESSAGE_TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Парсит подпись времени. Строка без часов и минут не становится меткой. */
export function messageTimeLabel(value: string): MessageTimeLabel | null {
  if (!MESSAGE_TIME_RE.test(value)) {
    return null;
  }
  return value as MessageTimeLabel;
}
