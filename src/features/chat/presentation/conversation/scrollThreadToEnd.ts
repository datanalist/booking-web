/** Прокручивает ленту вниз, если браузер умеет scrollIntoView. */
export function scrollThreadToEnd(node: HTMLElement | null): void {
  if (node === null || typeof node.scrollIntoView !== "function") {
    return;
  }
  node.scrollIntoView({ block: "nearest" });
}
