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

## Связка полей с PocketBase

Страницы не вызывают PocketBase. Поля коллекций собираются в моделях сайта в трёх адаптерах:

| Адаптер | Путь | Коллекции |
| --- | --- | --- |
| Сессия и объявления | `src/api/pocketbase/` | `users`, `listings` |
| Брони и занятость | `src/features/bookings/pocketbase/` | `bookings`, `listing_blocks` |
| Чаты и уведомления | `src/features/chat/pocketbase/` | `chats`, `messages`, `notifications` |

Файлы PocketBase: `/api/files/{collection}/{id}/{filename}`. Базовый URL инстанса дописывается спереди, если он передан в маппер.

`Session.balance` подключён к `users.balance`. `ProfilePageModel.balanceRub` читает `session?.balance` и, если поля нет, берёт `PROFILE_DEMO.balanceRub`.

Чат (`src/features/chat/pocketbase/`):

- `pbChatToThread` — строка списка: роль из `kind` / `staff`, имя из `expand.guest` (для поддержки — «Поддержка»; у модератора сначала `expand.staff`, иначе гость или «Модератор»), превью из `last_message`, время `ЧЧ:ММ` из `last_message_at` или `updated`, непрочитанные — входящие новее `host_last_read` (пробел в дате PocketBase читается как `T`, потолок 99).
- `pbChatToHeading` — шапка: `direct` для поддержки, иначе карточка жилья из `expand.listing` и дат/гостей из `expand.booking`.
- `pbMessageToChatMessage` — текст (`messages.text`) и фото (`messages.images`); `files` в ленту фото не входят.
- `buildPbSendMessagePayload` — создание `messages` (`chat`, `author`, `text` или `images`).
- `buildPbMarkChatReadPayload` — `{ host_last_read }`.
- `countUnreadNotifications` — бейдж сайдбара, записи `notifications` с `read = false`.

Admin-токен и секреты PB **не** класть в клиент и не в `VITE_*`. Мок никогда не пишет `status: "published"`. Статуса `rejected` в моке нет.

### Соответствие полей

| Модель сайта | Поле сайта | Коллекция | Поле PocketBase |
| --- | --- | --- | --- |
| `Session` | `userId` | `users` | `id` |
| `Session` | `email` | `users` | `email` |
| `Session` | `name` | `users` | `name`, иначе `first_name` + `last_name` |
| `Session` | `phone` | `users` | `phone` |
| `Session` | `photoUrl` | `users` | `avatar` |
| `Session` | `balance` | `users` | `balance` |
| `ProfilePageModel` | `balanceRub` | `users` | `balance` |
| `Listing` | `ownerId` | `listings` | `host` |
| `Listing` | `title` | `listings` | `title` |
| `Listing` | `address` | `listings` | `address` |
| `Listing` | `city` | `listings` | `city` |
| `Listing` | `housingType` | `listings` | `housing_type` + `placement_type` |
| `Listing` | `description` | `listings` | `description` |
| `Listing` | `photos` | `listings` | `photos` |
| `Listing` | `amenityIds` | `listings` | `amenities` |
| `Listing` | `extraAmenityIds` | `listings` | `extras` |
| `Listing` | `maxGuests` | `listings` | `max_guests` |
| `Listing` | `guestsForbidden` | `listings` | `guests_forbidden` |
| `Listing` | `petsAllowed` | `listings` | `pets_allowed` |
| `Listing` | `cancellationAllowed` | `listings` | `cancellation_allowed` |
| `Listing` | `checkInTime` / `checkOutTime` | `listings` | `check_in_time` / `check_out_time` |
| `Listing` | `accessInfo` / `houseRules` / `extraInfo` | `listings` | `access_info` / `house_rules` / `extra_info` |
| `Listing` | `priceNight` / `priceFrom14` / `priceFrom28` | `listings` | `price_night` / `price_14` / `price_28` |
| `Listing` | `uniquePrices` | `listings` | `unique_prices` |
| `Listing` | `status` | `listings` | `status` (`moderation` на сайте ↔ `pending` в PB) |
| `Listing` | `rejectReason` | `listings` | `reject_reason` |
| `BookingStay` | `checkIn` / `checkOut` | `bookings` | `check_in` / `check_out` |
| `ConfirmedBooking` | `status` | `bookings` | `status` |
| бронь | гость, хозяин, жильё | `bookings` | `guest`, `host`, `listing` |
| бронь | взрослые, дети, питомцы | `bookings` | `adults`, `children`, `pets` |
| бронь | суммы | `bookings` | `total`, `prepay`, `remainder`, `commission`, `host_amount` |
| бронь | комментарий отмены | `bookings` | `cancel_comment` |
| календарь занятости | начало / конец | `listing_blocks` | `start` / `end` (`listing` → `listings`) |
| `ChatThread` | `id` | `chats` | `id` |
| `ChatThread` | `counterpartRole` | `chats` | `kind=support` → `support`; иначе непустой `staff` → `moderator`; иначе `guest` |
| `ChatThread` | `counterpartName` | `chats` | «Поддержка»; у модератора имя `expand.staff`, иначе `expand.guest` или «Модератор»; иначе имя `expand.guest` |
| `ChatThread` | `preview` | `chats` | `last_message`, иначе текст последнего `messages` |
| `ChatThread` | `sentAt` | `chats` | `last_message_at`, иначе `updated` |
| `ChatThread` | `unread` | `chats`, `messages` | входящие с `created` позже `host_last_read` (оба времени разбираются, пробел между датой и временем → `T`) |
| `ConversationHeading` | карточка жилья | `chats` expand | `listing.title`, `listing.city`, первое `listing.photos`; даты `booking.check_in`–`check_out`; гости `adults` + `children` |
| `ChatMessage` | `author` | `messages` | `author` = текущий пользователь → `self`, иначе `peer` |
| `ChatMessage` | `body` | `messages` | `text` |
| `ChatMessage` | `photo` | `messages` | `images` → `/api/files/messages/{id}/{filename}` |
| бейдж уведомлений | число | `notifications` | записи с `read = false` |
