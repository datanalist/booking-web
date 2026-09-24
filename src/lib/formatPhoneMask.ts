export function formatPhoneMask(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 11);
  const local = d.startsWith("7") ? d.slice(1) : d.startsWith("8") ? d.slice(1) : d;
  const parts = [
    local.slice(0, 3),
    local.slice(3, 6),
    local.slice(6, 8),
    local.slice(8, 10),
  ].filter(Boolean);
  if (parts.length === 0) {
    return "+7";
  }
  let result = "+7";
  if (parts[0]) {
    result += ` (${parts[0]}`;
  }
  if (parts[0]?.length === 3) {
    result += ")";
  }
  if (parts[1]) {
    result += ` ${parts[1]}`;
  }
  if (parts[2]) {
    result += `-${parts[2]}`;
  }
  if (parts[3]) {
    result += `-${parts[3]}`;
  }
  return result;
}
