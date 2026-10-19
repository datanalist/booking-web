const BLOCKING_STYLESHEET = '<link rel="stylesheet" href="/src/index.css" />';

/**
 * В dev Vite вырезает обычный link на CSS и подключает его из JS,
 * поэтому браузер успевает нарисовать форму до стилей.
 * Ссылку добавляем после HTML-трансформа Vite, только на dev-сервере.
 * В сборке её быть не должно: иначе Vite вставляет сырой исходник data-url.
 */
export function injectBlockingDevCss(html: string): string {
  if (html.includes('href="/src/index.css"')) return html;
  return html.replace(
    "</head>",
    `    ${BLOCKING_STYLESHEET}\n  </head>`,
  );
}
