import { chatMessageId, type ChatMessageId } from "../domain/ChatMessageId";

/**
 * Id пузыря. UUID записи сохраняется у единственной части,
 * остальные части получают устойчивый UUID от id и суффикса.
 */
export function messageIdFor(recordId: string, part: string): ChatMessageId {
  if (part === "primary") {
    const direct = chatMessageId(recordId);
    if (direct !== null) {
      return direct;
    }
  }
  const parsed = chatMessageId(deterministicUuid(`${recordId}:${part}`));
  if (parsed === null) {
    throw new Error("Не удалось собрать id сообщения");
  }
  return parsed;
}

function deterministicUuid(source: string): string {
  const chunks: string[] = [];
  for (let round = 0; round < 4; round += 1) {
    const hex = fnv1a(`${round}:${source}`, 0x811c9dc5 ^ round)
      .toString(16)
      .padStart(8, "0");
    chunks.push(hex);
  }
  const hex = chunks.join("");
  const timeLow = hex.slice(0, 8);
  const timeMid = hex.slice(8, 12);
  const timeHigh = `4${hex.slice(13, 16)}`;
  const clockSeq = `a${hex.slice(17, 20)}`;
  const node = hex.slice(20, 32);
  return `${timeLow}-${timeMid}-${timeHigh}-${clockSeq}-${node}`;
}

function fnv1a(text: string, seed: number): number {
  let hash = seed >>> 0;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}
