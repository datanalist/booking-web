# GlobalStay — кабинет владельца

Веб-кабинет владельца жилья. Макет — секция «Веб-сайт для владельцев жилья» в [Figma Booking](https://www.figma.com/design/zqPAmK0qrRQtqMp5IP3K5u/Booking?node-id=1-16219). Прод-домен: `website.booking.vallome.ru`.

Стек: Vite + React + TypeScript + React Router + Vitest + Tailwind CSS v4. Статика отдаётся Caddy (nginx нет).

## Первый срез

Вход / регистрация / восстановление пароля, онбординг, список объявлений, мастер из 6 шагов, предпросмотр и отправка на модерацию. Заглушки: чаты, уведомления, профиль (с выходом). Экран **Бронирования** (`/bookings`): вкладка **Отклонены** (`?tab=rejected`) с таблицей моков (ФИО с портретом, чат-конверт, жильё, даты, стоимость; без кнопок принять/отклонить и без колонки статуса) и пустым состоянием (`?empty=1`); поиск гостя в одном ряду с вкладками (`bg-amber-400/5`); остальные вкладки — пустые заглушки. PocketBase не подключаем — моки в `localStorage`. Мок не ставит `published`.

Правое фото экранов входа и регистрации (`public/auth-side.jpg`) — полный кадр без белых полей. Скругление 20px со всех четырёх углов задаёт вёрстка, а не сам файл.

UI-примитивы кабинета — `src/ui/`. Логотип GlobalStay в сайдбаре — картинка 181×60 у нижнего края видимой колонки (на кадре 1020px это left 27 / top 928). Документация среза: [`docs/architecture.md`](docs/architecture.md), [`docs/screens.md`](docs/screens.md), [`docs/data-adapter.md`](docs/data-adapter.md).

## Мастер объявления

Шесть шагов: описание, фото, удобства, правила, дополнительные сведения, стоимость. Холст шага — отступ 32px от сайдбара (`p-8`), без отрицательных полей. Шаг «Удобства» использует `lucide-react`: после переключения на ветку нужен `npm install`.

Полная спека: [`docs/superpowers/specs/2026-09-20-owner-cabinet-first-slice-design.md`](docs/superpowers/specs/2026-09-20-owner-cabinet-first-slice-design.md)

План: [`docs/superpowers/plans/2026-09-20-owner-cabinet-first-slice.md`](docs/superpowers/plans/2026-09-20-owner-cabinet-first-slice.md)

## Секреты

В репозитории секретов нет: не кладём `.env`, admin-токен PocketBase, пароли. Публичный URL API можно держать в коде или в `VITE_*` без секретов.

## Запуск

```bash
npm install
npm run dev
```

Локально: Vite (порт по умолчанию 5173). Viewport < 1280 показывает заглушку «Откройте сайт с компьютера».

```bash
npm test
```

```bash
npm run build
```

Сборка: `tsc -b` и `vite build` → каталог `dist/` (source maps выключены). Содержимое `dist/` выложить на Caddy; пример конфига: [`docs/caddy/Caddyfile.example`](docs/caddy/Caddyfile.example).

```bash
npm run preview
```
