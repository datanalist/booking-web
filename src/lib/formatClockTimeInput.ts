/** Маска ввода времени: только цифры, авто-двоеточие, clamp до валидных HH:MM. */
export function formatClockTimeInput(raw: string): string {
  let digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length === 0) {
    return "";
  }

  const first = digits.charAt(0);
  if (first > "2") {
    digits = `0${digits}`.slice(0, 4);
  }

  const hourTens = digits.charAt(0);

  let hourOnes = "";
  if (digits.length >= 2) {
    const h1 = digits.charAt(1);
    hourOnes = hourTens === "2" && h1 > "3" ? "3" : h1;
  }

  let minuteTens = "";
  if (digits.length >= 3) {
    const m0 = digits.charAt(2);
    minuteTens = m0 > "5" ? "5" : m0;
  }

  const minuteOnes = digits.length >= 4 ? digits.charAt(3) : "";

  const hours = `${hourTens}${hourOnes}`;
  if (digits.length <= 2) {
    return hours;
  }
  return `${hours}:${minuteTens}${minuteOnes}`;
}
