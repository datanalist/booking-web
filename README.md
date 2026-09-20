# GlobalStay — кабинет владельца

Веб-кабинет владельца жилья. Макет — секция «Веб-сайт для владельцев жилья» в [Figma Booking](https://www.figma.com/design/zqPAmK0qrRQtqMp5IP3K5u/Booking?node-id=1-16219). Прод-домен: `website.booking.vallome.ru`.

Каркас: Vite + React + TypeScript + Vitest + Tailwind CSS v4.

## Первый срез

Вход / регистрация, список объявлений, мастер создания (6 шагов + предпросмотр + модерация). PocketBase не подключаем: данные в моке. Стек: Vite + React + TypeScript, статика за Caddy на VPS.

Полная спека: [`docs/superpowers/specs/2026-09-20-owner-cabinet-first-slice-design.md`](docs/superpowers/specs/2026-09-20-owner-cabinet-first-slice-design.md)

Продуктовое ТЗ (все роли): [`docs/technical spec.md`](docs/technical%20spec.md)

## Секреты

В репозиторий не кладём `.env`, admin-токен PocketBase, пароли. Публичный URL API можно держать в коде или в `VITE_*` без секретов.

## Запуск

```bash
npm install
npm run dev
```

Локальная разработка: Vite dev-сервер (порт по умолчанию — 5173).

```bash
npm test
```

Однократный прогон Vitest (`vitest run`).

```bash
npm run build
```

Сборка: `tsc -b` (проверка типов) и `vite build`. Артефакты — каталог `dist/` (отдаётся Caddy на VPS).

```bash
npm run preview
```

Предпросмотр production-сборки локально.
