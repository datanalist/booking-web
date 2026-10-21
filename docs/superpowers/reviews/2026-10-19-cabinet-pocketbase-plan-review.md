# Ревью плана: кабинет на PocketBase

**Дата:** 2026-10-19  
**Ревьюер:** `gemini-4-argon-medium`  
**Предмет:** [`docs/superpowers/plans/2026-10-19-cabinet-pocketbase.md`](../plans/2026-10-19-cabinet-pocketbase.md)  
**Код на момент ревью:** `dev` @ `e1f5d12`  
**Вердикт ревьюера:** **`WITH FIXES`**

**Статус плана:** замечания 1–12 внесены в [`docs/superpowers/plans/2026-10-19-cabinet-pocketbase.md`](../plans/2026-10-19-cabinet-pocketbase.md). Текст ниже оставлен как исходное ревью и не переписывался.

План ещё не реализован. Замечания ниже — про то, что сломалось бы при реализации против живого PocketBase и против текущих экранов.

---

## Сильные стороны

1. Три волны (контракт → четыре изолированных адаптера → сборка фабрики) не дают параллельным агентам править `src/api/index.ts` и `src/app/session.tsx` одновременно.
2. Точное сравнение `VITE_DATA_SOURCE === "pocketbase"` оставляет текущий Vitest на моках и без сети.
3. План переиспользует `pbClient.ts`, `userMapper.ts`, `listingMapper.ts`, `pbBookingMapper.ts` и `pbChatMapper.ts`.
4. Admin-токен и `POCKETBASE_SU_PASSWORD` в клиент не попадают. Без `VITE_POCKETBASE_URL` остаётся `PUBLIC_POCKETBASE_URL`.

---

## Critical

### 1. Смена email через `getRecord` не увидит новый адрес

**Где:** план, Task 2 (после `updateRecord` снова читать пользователя через `getRecord`); `src/api/pocketbase/pbClient.ts` (`updateRecord` уже возвращает запись); `deploy/pocketbase/pb_hooks/change_email.pb.js`.

`POST /api/vallome/change-email` кладёт заявку в `$app.store()` и возвращает `pending: true`. Поле `email` в `users` до подтверждения ссылки не меняется. Повторный `getRecord` вернёт старый email. Если `emailVisibility` выключен, поле может ещё и не прийти клиенту.

**Почему важно:** после «Сохранить» в профиле пользователь увидит прежний email.

**Как исправить:** сессию собирать из ответа `updateRecord`. Если `changeEmail` вернул `{ email, pending }`, в `Session` писать этот email и не ждать, что запись `users` уже обновлена.

### 2. Таблица «Мои объявления» после загрузки остаётся на `localStorage`

**Где:** план, Task 3; `src/features/listings/AllListingsStore.tsx`; `src/pages/ListingsPage.tsx`; `src/pages/ListingPreviewPage.tsx`; `deploy/pocketbase/pb_schema.json` (`listings.updateRule`).

Расхождения:

- В интерфейсе `loadAllListingsFromPocketBase(client, hostId)`, в шаге реализации — вызов `list()` и `listingToTableRow`. В `Consumes` указан `pbListingToTableRow`.
- `remove`, `setStatus` и `upsert` пишут только в `localStorage`.
- Меню «Удалить», «Снять с публикации» и «Опубликовать» вызывает `useAllListings()`, не `useSession().listings`.
- «Опубликовать» ставит табличный статус `published`. Правило обновления `listings` хозяину разрешает только `draft`, `pending` и `archived`.
- Провайдер не подписан на `session.userId`.

**Почему важно:** список один раз придёт с сервера, а удаление, снятие и публикация пропадут после перезагрузки. Прямая публикация на сервер не пройдёт.

**Как исправить:** грузить через `client.listRecords` и `pbListingToTableRow(record, client.baseUrl)`. В режиме `pocketbase` связать `remove` с `listings.remove`, снятие с `listings.archive`, а «опубликовать» и «на модерацию» с `listings.submitForModeration`.

### 3. Фото мастера объявления не доходят до PocketBase

**Где:** план, Task 3 `saveDraft`; `src/features/listings/uploadPhoto.ts`; `src/api/pocketbase/listingPhotos.ts`; `deploy/pocketbase/pb_hooks/listings_publish_guard.pb.js`.

Сейчас фото уходят в Vite `POST /api/files` и возвращаются как `/data/...`. `photosToPb` отбрасывает такие строки. Поле `listings.photos` принимает новые файлы только как `multipart/form-data`. Хук публикации требует не меньше 6 фото в записи, иначе `400`.

**Почему важно:** черновик сохранится без фото, отправка на модерацию упрётся в хук.

**Как исправить:** в Task 3 явно описать `FormData` с `Blob` в `createRecord` / `updateRecord`. `pbClient` уже пропускает `FormData` без JSON-заголовка.

### 4. Действия броней не доходят до `BookingsSource`

**Где:** план, Task 4; `src/features/bookings/presentation/BookingsPage.tsx`; `BookingsTabBody.tsx`; `RequestsPanel.tsx`; `ConfirmedBookingsPanel.tsx`; `CancelledBookingsPanel.tsx`; `RejectRequestModal.tsx`.

- `BookingsTabBody.tsx` стоит между страницей и панелями и не входит в список файлов Task 4. Пропсы из `BookingsPage` до панелей не доедут.
- `RequestsPanel` кладёт моки в `useState` при первом рендере. Поздний проп после `load` этот state не обновит.
- «Принять» и «Отклонить» меняют только локальный массив. `onSubmit` модалки отказа вызывается без текста причины, хотя модалка её передаёт.
- Подтверждённые и отменённые читают синглтоны `confirmedBookingsStore` и `cancelledBookingsStore`, не проп снимка.

**Почему важно:** ручной шаг «Принять шлёт PATCH `awaiting_prepayment`» из Task 7 из текущего UI не выполнится.

**Как исправить:** добавить `BookingsTabBody.tsx` в файлы Task 4. В `RequestsPanel` синхронизировать пришедшие строки и прокинуть `onAccept` / `onReject(id, comment)`. Снимок подтверждённых и отменённых класть в их сторы или читать из пропа, а не из мок-синглтона.

### 5. Чат не отправляет сообщения и не считает непрочитанные

**Где:** план, Task 5; `src/features/chat/presentation/ChatPage.tsx`; `OpenChatConversation.tsx`; `ChatConversation.tsx`; `src/features/chat/pocketbase/pbChatMapper.ts`; `pbChatFormat.ts`.

- Функции даты вида «10 сентября» в `pbChatFormat.ts` нет. Там только время `ЧЧ:ММ`, интервал проживания и URL файла. Агенту Task 5 этот файл править нельзя.
- `ChatConversation` копит исходящие в `useOutgoingMessages` и не принимает `onSend`. Файла нет в списке Task 5, поэтому `sendText` из UI не вызывается.
- `pbChatToThread` считает непрочитанные по массиву `messages`. Без сообщений бейдж всегда пустой.
- `selectedChatId` считается в `useState` от начальных тредов. Асинхронная подмена `threads` выбор не обновит.

**Почему важно:** пункт проверки «отправка текста создаёт `messages`» недостижим, бейджи непрочитанных пустые.

**Как исправить:** `dateLabel` собрать внутри `createPbChatSource.ts` через `Intl.DateTimeFormat`. Добавить `ChatConversation.tsx` в файлы Task 5 и необязательный `onSendMessage`. При открытии треда вызывать `markRead`. Непрочитанные считать отдельным запросом сообщений или полем, которое маппер умеет без ленты.

---

## Important

### 6. `pbAuthRoutes.ts` указан и нигде не создаётся

**Где:** план, таблица волны 0, карта файлов и `Files` Task 1 против шага 3 и `git add`.

Методы сброса пароля добавляются в `pbClient.ts`. `pbAuthRoutes.ts` в коммит не входит.

**Как исправить:** убрать файл из карты либо реально вынести туда маршруты и добавить его в шаг 3 и `git add`.

### 7. Фильтр архива объявлений без скобок захватит чужие записи

**Где:** план, Task 3 `list`; `src/api/listings.ts`; `src/api/pocketbase/listingStatusMap.ts`.

Мок на вкладке `published` возвращает пустой список. План для PB фильтрует `status="published"`. Для архива склейка `host="user1" && status="archived" || status="rejected"` из-за приоритета `||` отдаст чужие `rejected`.

`pbListingToTableRow` кладёт PB `draft` в табличный `draft`, а `rejected` и `archived` в `unpublished`. Вкладка «Архив» на странице показывает `unpublished` и `draft`.

**Как исправить:** `host="${userId}" && (status="archived" || status="rejected")`.

### 8. `register` не выдаёт токен и не заполняет `account_status`

**Где:** план, Task 2; `deploy/pocketbase/pb_schema.json` (`users.account_status` required, `createRule` закрыт).

Тело create не содержит `account_status`. `createRecord` не возвращает auth-токен. `RegisterPage` ведёт на онбординг, а `completeOnboarding` без `gs.pb.token` получит 401.

**Как исправить:** передавать `account_status: "active"` и сразу после create вызывать `authWithPassword`. Закрытый `createRule` на живом сервере от этого сам не откроется: регистрация хозяина останется отказом PB, вход паролем — рабочий путь.

### 9. Аватар онбординга и профиля не уходит в `users.avatar`

**Где:** план, Task 2; `src/api/pocketbase/userMapper.ts` (`sessionOrInputToPbUserPatch` принимает только имя и телефон); `OnboardingPage`; `saveProfileEdit.ts`.

Кроп кладёт data URL. Патч его не отправляет. Ответ PB перезапишет сессию без нового фото.

**Как исправить:** слать `avatar` как `FormData` либо явно оставить переданный `photoUrl` в `Session` и записать это ограничение в Task 2.

### 10. Мапперы броней и чатов без `baseUrl` дают относительные `/api/files`

**Где:** план, Task 3–5; `pbBookingMapper.ts`; `pbChatMapper.ts`.

Без базового URL картинки запрашиваются с `http://127.0.0.1:5173/api/files/...`.

**Как исправить:** во все `pbBookingTo*`, `pbChatToHeading` и `pbMessageToChatMessage` передавать `client.baseUrl`.

---

## Minor

### 11. Три экрана сами создают клиент и могут забыть токен

**Где:** план, Task 3–5.

`listings.listRule`, `bookings` и `chats` требуют `@request.auth.id`. Клиент без `token: () => readPbToken(storage)` получит пустые списки.

**Как исправить:** в волне 0 одна фабрика `createCabinetPbClient(storage)`, её вызывают таблица объявлений, брони, чат и `createPocketBaseApi`.

### 12. `ensureForEdit` не может создать запись с моковым `id`

**Где:** план, Task 3; `pb_schema.json`, поле `listings.id` (`min`/`max` 15, `pattern: "^[a-z0-9]+$"`).

Короткий моковый id или UUID с дефисами `createRecord` не примет.

**Как исправить:** передавать `id` только если он уже `/^[a-z0-9]{15}$/`. Иначе id назначает PocketBase.

---

## Рекомендации ревьюера

1. В волне 0 завести `createCabinetPbClient(storage)`, чтобы ни один экран не собрал клиент без токена.
2. До старта параллельных агентов добавить в Task 4 файл `BookingsTabBody.tsx`, в Task 5 — `ChatConversation.tsx`.
3. В шагах Task 3–5 прямо написать передачу `client.baseUrl` в мапперы.

---

## Вердикт

**К реализации:** с исправлениями.

Волны и владение файлами согласованы. Без правок карты файлов Task 4 и Task 5, без загрузки фото в PocketBase и без привязки кнопок таблицы, броней и чата к адаптерам агенты либо не соберут типы, либо оставят действия на моках.
