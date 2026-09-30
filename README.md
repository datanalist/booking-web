# GlobalStay — кабинет владельца

Веб-кабинет владельца жилья. Макет — секция «Веб-сайт для владельцев жилья» в [Figma Booking](https://www.figma.com/design/zqPAmK0qrRQtqMp5IP3K5u/Booking?node-id=1-16219). Прод-домен: `website.booking.vallome.ru`.

Стек: Vite + React + TypeScript + React Router + Vitest + Tailwind CSS v4. Статика отдаётся Caddy (nginx нет).

## Первый срез

Вход / регистрация / восстановление пароля, онбординг, список объявлений, мастер из 6 шагов, предпросмотр и отправка на модерацию. Заглушки: бронирования, чаты, уведомления, профиль (с выходом). PocketBase не подключаем — моки в `localStorage`. Мок не ставит `published`.

Правое фото экранов входа и регистрации (`public/auth-side.jpg`) — полный кадр без белых полей. Скругление 20px со всех четырёх углов задаёт вёрстка, а не сам файл.

UI-примитивы кабинета — `src/ui/`. Логотип GlobalStay в сайдбаре — картинка 181×60 у нижнего края видимой колонки (на кадре 1020px это left 27 / top 928). Документация среза: [`docs/architecture.md`](docs/architecture.md), [`docs/screens.md`](docs/screens.md), [`docs/data-adapter.md`](docs/data-adapter.md).

## Мастер объявления

Шесть шагов: описание, фото, удобства, правила, дополнительные сведения, стоимость. Холст шага — отступ 32px от сайдбара (`p-8`), без отрицательных полей. Шаг «Удобства» использует `lucide-react`: после переключения на ветку нужен `npm install`.

Полная спека: [`docs/superpowers/specs/2026-09-20-owner-cabinet-first-slice-design.md`](docs/superpowers/specs/2026-09-20-owner-cabinet-first-slice-design.md)

План: [`docs/superpowers/plans/2026-09-20-owner-cabinet-first-slice.md`](docs/superpowers/plans/2026-09-20-owner-cabinet-first-slice.md)

## Бронирования — вкладка «Отменены»

Экран `/bookings` (кабинет владельца): вкладки Заявки | Подтверждены | Отклонены | Отменены.
Параметр `?tab=cancelled` открывает вкладку «Отменены» с мок-таблицей (ФИО, Чат, Жилье, Даты, Стоимость) без кнопок, статуса и сортировки.
Ряд вкладок + поиск в одну строку (`items-start justify-between`): вкладки `w-40` с `border-b border-orange-200`, активная — чёрный текст и `border-b-2 border-black`; поиск справа `w-80`, `bg-amber-400/5`, outline `neutral-600`.
Шапка столбцов: `bg-amber-400/20`, `h-12`, `font-bold`; ширины ФИО `w-56`, Чат `w-16`, Жилье `w-72`, Даты `w-36`, Стоимость `w-28`.
Строки данных `h-28`, текст ячеек `font-normal` (без `font-semibold` / text-stroke): имя и жильё `text-sm`, телефон и адрес `text-xs text-neutral-600`; аватар 48px, конверт outline 24px, фото жилья 48px с `p-1` (`public/bookings/`).
`?empty=1` и поиск без совпадений показывают пустой стейт. Остальные вкладки пока с заглушками пустого состояния.
Поиск: «Введите имя или номер гостя» (имя и телефон текущей вкладки).

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
