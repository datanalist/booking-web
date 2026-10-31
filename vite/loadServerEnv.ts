import { readFileSync } from "node:fs";
import path from "node:path";

function unquote(value: string): string {
  if (value.length < 2) {
    return value;
  }
  const first = value[0];
  const last = value[value.length - 1];
  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return value.slice(1, -1);
  }
  return value;
}

/** Дописывает пустые переменные процесса из `.env.local`. Значения не логирует. */
export function loadServerEnv(cwd = process.cwd()): void {
  let text = "";
  try {
    text = readFileSync(path.join(cwd, ".env.local"), "utf8");
  } catch {
    return;
  }
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq <= 0) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      continue;
    }
    const value = unquote(trimmed.slice(eq + 1).trim());
    const current = process.env[key];
    if (current === undefined || current === "") {
      process.env[key] = value;
    }
  }
}
