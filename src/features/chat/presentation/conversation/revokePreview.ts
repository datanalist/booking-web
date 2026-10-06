/** Освобождает превью, если слот ещё держит объектный URL. */
export function revokePreview(slot: { current: string | null }): void {
  if (slot.current === null) {
    return;
  }
  URL.revokeObjectURL(slot.current);
  slot.current = null;
}
