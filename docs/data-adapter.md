# Адаптер данных

В первом срезе данные живут в `localStorage` за интерфейсами `AuthApi` и `ListingsApi`.

## Ключи

| Ключ | Содержимое |
| --- | --- |
| `gs.session` | Текущая `Session` (без пароля) |
| `gs.users` | Массив `UserRecord` (email + `passwordHash`) |
| `gs.listings` | Массив `Listing` |
| `gs.reset.<token>` | email для сброса пароля |

Фабрика: `createApi()` в `src/api/index.ts` → `createAuthApi` / `createListingsApi`.

## PocketBase позже

1. Реализовать те же интерфейсы поверх клиента PB.
2. Подставить новую фабрику в `src/api/index.ts`.
3. Удалить чтение/запись ключей `gs.*` из адаптера.
4. Admin-токен и секреты PB **не** класть в клиент и не в `VITE_*`.

Мок никогда не пишет `status: "published"`. Статуса `rejected` нет.
