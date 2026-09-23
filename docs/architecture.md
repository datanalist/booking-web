# Архитектура первого среза

Кабинет владельца GlobalStay — Vite SPA. Слои:

| Слой | Путь | Роль |
| --- | --- | --- |
| UI | `src/ui/` | Примитивы только на пропсах, без сессии и API |
| Pages | `src/pages/` | Экраны; вызывают только `src/api` через `useSession` |
| API | `src/api/` | Интерфейсы `AuthApi` / `ListingsApi` и мок-адаптер |
| App | `src/app/` | Сессия, роутер, гарды, порог viewport |
| Config | `src/config/` | Комиссия, ширины, подписи enum |

Правила:

- Страницы не трогают `localStorage` и PocketBase напрямую.
- `SERVICE_COMMISSION_RATE` живёт только в `src/config`; в JSX число `0.09` не копировать.
- Секретов в `VITE_*` нет. Source maps в production выключены (`build.sourcemap: false`).
- Смена адаптера данных — новая фабрика в `src/api/index.ts`, экраны не меняются.
- Viewport `< 1280`: заглушка «Откройте сайт с компьютера». Холст кабинета не уже 1440.
