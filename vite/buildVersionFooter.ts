/** Единая причина изменения: номер сборки виден в HTML футера до запуска React, его можно сверить curl. */

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * Вписывает номер из package.json в статичный футер index.html.
 * Повторный вызов не дублирует футер: версия уже вшита.
 */
export function injectBuildVersionFooter(html: string, version: string): string {
  if (!html.includes("</body>")) {
    throw new Error("В index.html нет </body>");
  }
  if (html.includes("data-build-version=")) return html;
  const safe = escapeHtml(version.trim());
  const footer = `<footer data-build-version="${safe}" style="flex:none;position:relative;z-index:1;margin:0;padding:2px 12px;background:#fffdf8;color:#525252;font-family:'Noto Sans',sans-serif;font-size:12px;line-height:16px;text-align:right;pointer-events:none">Сборка ${safe}</footer>`;
  return html.replace("</body>", () => `    ${footer}\n  </body>`);
}
