/** Время суток HH:MM (24 часа); нельзя сконструировать без parseClockTime. */
export type ClockTime = string & { readonly __brand: unique symbol };

const CLOCK_TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function parseClockTime(raw: string): ClockTime | null {
  const trimmed = raw.trim();
  if (!CLOCK_TIME_RE.test(trimmed)) {
    return null;
  }
  return trimmed as ClockTime;
}
