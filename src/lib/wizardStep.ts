export function parseStep(raw: string | null): 1 | 2 | 3 | 4 | 5 | 6 {
  const n = Number(raw);
  if (n >= 1 && n <= 6) {
    return n as 1 | 2 | 3 | 4 | 5 | 6;
  }
  return 1;
}
