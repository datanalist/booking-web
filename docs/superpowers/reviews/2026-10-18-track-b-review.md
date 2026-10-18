**Исправлено:** все 5 замечаний устранены (2026-10-18). `magic_link.pb.js` — 345 строк, `occupied_listings.pb.js` — 175. Индекс `vallome_store_index`, cron `sweepAuthStore`, ключи `magicWait:`, `emailChange:` и `emailChangeUser:`. Переход `change_requested -> confirmed` копирует или сохраняет даты, JSON-запрос magic-auth требует `waitToken`.

# Ревью Track B (`feat/pb-jsvm-hooks`)

Дата: 2026-10-18  
Модель ревьюера: `gemini-4-argon-medium`  
Ветка: `feat/pb-jsvm-hooks` (база: `dev-dns_local`)  
Вердикт: **`CHANGES_REQUESTED`**

---

## Чеклист ревьюера по плану

- **Покрытие задач трека против спецификации (§4.4, §4.7, §4.8):** **Нет** — есть расхождения по ключам store/индекса (`magic_link.pb.js`, `change_email.pb.js`, `store_cleanup_cron.pb.js`) и по обработке перехода `change_requested -> confirmed` в `bookings_status.pb.js`.
- **Feature-first:** **Да** — все 12 файлов созданы строго внутри `deploy/pocketbase/pb_hooks/`, расползания по `src/` нет (`deploy/pocketbase/pb_hooks/*.pb.js`).
- **Гипермодульность (`hypermodularity.mdc`):** **Нет** — `magic_link.pb.js` содержит **694 строки**, что превышает hard limit **500 строк**; `occupied_listings.pb.js` содержит **316 строк** (>300 warning) и совмещает два маршрута (`occupied-listings` и `occupied-dates`). Кроме того, ряд функций превышает лимит 40/50 строк (`magicAuthHandler`, `magicRequestHandler`, `guardBookingDates`, `bookings_status.pb.js` и др.).
- **Изоляция Goja JSVM (PocketBase v0.23+ / v0.40.x):** **Да** — ни в одном из 12 файлов нет обращений из колбэков (`onRecord*`, `routerAdd`, `cronAdd`, `onBootstrap`) к переменным или хелперам верхнего уровня файла. Все хелперы объявлены внутри самих обработчиков.
- **Строгая типизация / безопасность границ:** **Да** — в `findRecordsByFilter` везде используются параметризованные плейсхолдеры `{:placeholder}`, конкатенации сырого пользовательского ввода в фильтры нет; в `occupied_listings.pb.js` убрана полная выгрузка `id != ''`.
- **Секреты:** **Да** — в diff нет паролей, токенов, `.env`, `pb_data` или реального WAN IP.
- **Матрица файлов трека:** **Да** — изменены исключительно `deploy/pocketbase/pb_hooks/*.pb.js` (12 файлов).

---

## Блокеры и обязательные замечания (`CHANGES_REQUESTED`)

### 1. [БЛОКЕР] Превышение hard limit 500 строк в `magic_link.pb.js` (`hypermodularity.mdc`)

- **Файл:** `deploy/pocketbase/pb_hooks/magic_link.pb.js` (**694 строки** при hard limit **500 строк** и warning **300 строк**).
- **Дополнительно:** `deploy/pocketbase/pb_hooks/occupied_listings.pb.js` (**316 строк** — выше порога warning 300 строк, содержит 2 отдельных маршрута).
- **Проблема:** `magic_link.pb.js` объединяет 4 точки входа (`onMailerRecordOTPSend`, `POST /api/vallome/magic-request`, `GET|POST /api/vallome/magic-auth`, `GET /api/vallome/magic-wait`), из-за изоляции Goja JSVM трижды дублирует `str`, `htmlEscape`, `queryEscape`, дважды — `appUrl` и HTML-шаблон письма, а также хранит HTML-верстку страниц подтверждения/успеха/ошибки. Кроме того, функции-обработчики (`magicAuthHandler` — 378 строк, `magicRequestHandler` — 164 строки) кратно превышают лимит 50 строк на функцию.
- **Как исправить (сохраняя изоляцию Goja JSVM):**
  1. Сократить `magic_link.pb.js` минимум до **≤ 300–450 строк** (строго **≤ 500 строк**), компактно оформив инлайн HTML-шаблоны и убрав мёртвый/избыточный код (например, трёхэтажные `try/catch` вокруг простых операций и неиспользуемый fallback `consumeOtp`, если OTP-коллекция заменена store, либо уплотнить его).
  2. Либо (предпочтительно по правилу «одна ответственность — один файл», если матрица трека `deploy/pocketbase/pb_hooks/**` позволяет) разделить ответственности или вынести общие чистые хелперы в локальный CommonJS-модуль, загружаемый внутри каждого хелпера через `require(`${__hooks}/...`)` (в Goja JSVM PocketBase `require()` внутри колбэка работает штатно), или сократить каждый файл до ≤300 строк.
  3. В `occupied_listings.pb.js` (316 строк) уплотнить код ниже 300 строк (сейчас 316 строк из-за переносов аргументов `collectRanges`), чтобы уложиться в порог без warning.

---

### 2. [КРИТИЧНО] Несоответствие ключей `$app.store()`, имени индекса и имени cron спецификации §4.8 и плану (Task B6)

- **Файлы:** `deploy/pocketbase/pb_hooks/magic_link.pb.js`, `deploy/pocketbase/pb_hooks/change_email.pb.js`, `deploy/pocketbase/pb_hooks/store_cleanup_cron.pb.js`
- **Проблема:** Спецификация (§4.8) и план (Task B6) явно фиксируют имена ключей store, имя индекса и имя задачи cron:
  | Сущность | Требование спецификации (§4.8) и плана (Task B6) | Фактически в коде |
  | --- | --- | --- |
  | Индекс ключей store | `vallome_store_index` | `vallome_store_keys` |
  | Имя cron-задачи зачистки | `sweepAuthStore` | `cleanupVallomeStore` |
  | Ключ ожидания (`magic-wait`) | `magicWait:<waitToken>` | `vallome_mwait_<waitToken>` |
  | Ключ смены почты (по email) | `emailChange:<email>` | `vallome_echg_<email>` |
  | Ключ смены почты (по userId) | `emailChangeUser:<userId>` | `vallome_echg_user_<userId>` |
  | Ключ кода письма | `vallome_mcode_<otpId>` | `vallome_mcode_<otpId>` (совпадает) |
- **Как исправить:** Привести имена ключей и cron в `magic_link.pb.js`, `change_email.pb.js` и `store_cleanup_cron.pb.js` в точное соответствие со спецификацией §4.8:
  - индекс: `vallome_store_index`;
  - cron ID: `sweepAuthStore`;
  - префиксы ключей в store и в `allowed(key)` хука зачистки: `vallome_mcode_`, `magicWait:`, `emailChange:`, `emailChangeUser:`.

---

### 3. [КРИТИЧНО] Переход `change_requested -> confirmed` и защита полей дат в `bookings_status.pb.js`

- **Файл:** `deploy/pocketbase/pb_hooks/bookings_status.pb.js` (строки 62–129)
- **Проблема:**
  1. **Акцепт переноса дат хозяином (`change_requested -> confirmed`):** В строке 96 хук разрешает хозяину переход `change_requested -> confirmed` (и `cancel_requested -> confirmed`). Однако при акцепте переноса (`from === "change_requested" && to === "confirmed"`), если клиент владельца передаёт только `{ status: "confirmed" }` (или не обнуляет `requested_check_in` / `requested_check_out`), основные даты `check_in` / `check_out` останутся старыми, а `requested_check_in` / `requested_check_out` останутся висеть в записи (и продолжат блокировать старый и новый диапазоны в `bookings_overlap.pb.js` и `occupied_listings.pb.js`). Хук должен при `from === "change_requested" && to === "confirmed"` переносить `requested_check_in` → `check_in` и `requested_check_out` → `check_out` (если `check_in`/`check_out` ещё не обновлены в запросе до этих значений) и очищать `requested_check_in = ""`, `requested_check_out = ""`. При отклонении переноса хозяином (возврат из `change_requested` в `confirmed` без смены `check_in`/`check_out` или если даты не меняются) — либо очищать `requested_*`, либо явно различать акцепт/отказ.
  2. **Защита `check_in` / `check_out` от произвольной подмены:** В API Rules `bookings.updateRule` (§4.7) не зафиксирован запрет на изменение `check_in` и `check_out`. Значит, без проверки в `bookings_status.pb.js` гость при любом обновлении (например, `from === to` при редактировании `guest_note`/`adults` или при переходе) может напрямую перезаписать `check_in` и `check_out` в обход процедуры `change_requested`! В `bookings_status.pb.js` нужно запретить не-суперпользователю менять `check_in` / `check_out`, **кроме** случая, когда хозяин принимает перенос из `change_requested` в `confirmed` на даты `requested_check_in` / `requested_check_out`.
  3. **Валидация `datesOrdered()` при запросе переноса гостем:** В строках 62–66:
     ```javascript
     function datesOrdered() {
       const start = dayKey(record.get("requested_check_in"))
       const end = dayKey(record.get("requested_check_out"))
       if (!start && !end) return true
       return !!(start && end && start < end)
     }
     ```
     Если гость переводит бронь в `change_requested`, но **не передаёт** `requested_check_in` и `requested_check_out` (оба пустые), `datesOrdered()` возвращает `true`! При переходе `to === "change_requested"` обе даты `requested_check_in` и `requested_check_out` должны быть **обязательно заданы** (`!!(start && end && start < end)`).
  4. **Переходы вне таблицы §4.7 (`cancel_requested`):** В спецификации §4.7 таблица разрешённых переходов не содержит `confirmed -> cancel_requested` для гостя и `cancel_requested -> confirmed / cancelled` для хозяина (в §4.8 указано, что `cancel_requested` не занимает даты). Если `cancel_requested` оставлен для совместимости со схемой Booking, при возврате `cancel_requested -> confirmed` или `change_requested -> confirmed` важно убедиться, что `requested_check_in`/`requested_check_out` приводятся в консистентное состояние.

---

### 4. [ВАЖНО] Удаление ключа на 5-й неверной попытке и коды ответа в `magic_link.pb.js`

- **Файл:** `deploy/pocketbase/pb_hooks/magic_link.pb.js` (строки 348–357, 366–375, 432–448)
- **Проблема:**
  1. В `consumePending`:
     ```javascript
     const entry = loadPending(otpId)
     if (!entry) return ""
     ```
     Если ключ `vallome_mcode_<otpId>` был удалён (после 5 неудачных попыток или по истечении времени) либо изначально не существовал, `loadPending` возвращает `null`, `consumePending` возвращает `""`, и код в строке 434 проваливается в `consumeOtp(id, code)`, который бросает `"not found"`, и клиенту возвращается `400` вместо `403` (при исчерпании попыток). Это допустимо для уже удалённого ключа, **но** важно проверить саму 5-ю попытку: на 5-й неверной попытке `attempts` становится `5` (`attempts >= 5`), `burnAttempt` вызывает `forgetKey(entry.key)` и бросает `new Error("locked")`, а `catch` возвращает `403` (`LOCKED_MSG`). Это работает корректно!
  2. Однако в `POST /api/vallome/magic-auth` при переходе по ссылке из письма браузер отправляет форму `<form method="post" action="/api/vallome/magic-auth">` с полями `id` и `code` (без `otpId`). При этом `sentOtpId = hasName("otpId")` равен `false`. Если же клиент вызывает `POST /api/vallome/magic-auth` напрямую с JSON `{ id: "...", code: "..." }` (используя параметр `id` вместо `otpId`), то `sentOtpId` будет `false`, и **запасной замок `requireWait` (проверка `waitToken`) будет пропущен**!
  - **Спецификация §4.8:** *«Запасной замок, если клиент когда-нибудь снова пришлёт `otpId` в `POST /api/vallome/magic-auth`: вместе с `otpId` и `code` обязателен тот же `waitToken`, который выдал `magic-request`. Одного `otpId` недостаточно.»*
  - Чтобы злоумышленник не обошёл проверку `waitToken` на JSON-запросе простой заменой имени поля `otpId` на `id`, стоит проверять `sentOtpId` или требовать `waitToken` всегда, когда запрос приходит с JSON (`Content-Type: application/json`) или с полем `otpId`.

---

### 5. [НЕЗНАЧИТЕЛЬНО] Безопасность чтения `listing_blocks` в `bookings_overlap.pb.js` до создания коллекции

- **Файл:** `deploy/pocketbase/pb_hooks/bookings_overlap.pb.js` (строки 104–120)
- **Наблюдение:** В `occupied_listings.pb.js` перед запросом к `listing_blocks` есть проверка `collectionExists("listing_blocks")`, а в `bookings_overlap.pb.js` `txApp.findRecordsByFilter("listing_blocks", ...)` вызывается без `try/catch` или проверки существования коллекции. Поскольку миграция `1729200000_import_schema.js` гарантированно создаёт `listing_blocks` при старте, в штатном режиме это работает, но обёртка или единообразие с `occupied_listings.pb.js` сделает хук устойчивее.

---

## Детальная проверка всех 12 файлов `deploy/pocketbase/pb_hooks/`

| № | Файл | Строк | Изоляция Goja JSVM | Соответствие спецификации | Статус |
| --- | --- | --- | --- | --- | --- |
| 1 | `00_settings.pb.js` | 36 | ОК | `e.next()` первой строкой в `onBootstrap`; `trustedProxy` (`["X-Real-IP"]`, `useLeftmostIP = false`); все 9 правил `rateLimits` (включая `POST` и `GET /api/vallome/magic-auth`, `magic-request`, `magic-wait`, `change-email`, `*:auth`, `*:create`, `/api/batch`, `/api/`); `backups` (`0 3 * * *`, 7); `logs` (7 дней, `logIP`, `logAuthId`); `routerUse($apis.bodyLimit(32 * 1024 * 1024))` | **OK** |
| 2 | `bookings_overlap.pb.js` | 141 | ОК (все хелперы внутри `guardBookingDates` / транзакции) | `originalApp.runInTransaction((txApp) => { e.app = txApp; ... e.next() })` с `finally { e.app = originalApp }`; нет вызовов `$app` внутри транзакции; пропуск не-`OCCUPYING` статусов; проверка `bookings` и `listing_blocks` (включая `requested_*`) | **OK** |
| 3 | `bookings_status.pb.js` | 131 | ОК | Проверка `prepaid_at` только для суперпользователя; матрица ролей; выставление `prepay_until`; вызывает `e.next()`. **Замечание №3:** обработка дат при `change_requested -> confirmed`, запрет произвольной смены `check_in`/`check_out`, обязательность `requested_*` при `to === "change_requested"` | **Нужна доработка** |
| 4 | `bookings_expiry_cron.pb.js` | 31 | ОК | Cron `expireStaleBookings` (`*/5 * * * *`), `<= {:now}`, переводит `pending_host` (`host_timeout`) и `awaiting_prepayment` (`prepay_timeout`) в `cancelled` внутри транзакции | **OK** |
| 5 | `listings_publish_guard.pb.js` | 82 | ОК | Пропускает `draft` и `archived`; для `pending` и `published` проверяет `title`, `city`, `address`, `description`, `check_in_time`, `check_out_time`, `housing_type`, `max_guests >= 1`, `price_night > 0`, минимум 6 фото (`listedPhotos() + uploadedPhotos()`). *(Примечание: если при `update` часть фото уже в записи, а часть догружается в том же запросе, лучше проверять `listedPhotos() >= 6 || uploadedPhotos() >= 6 || (listedPhotos() + uploadedPhotos()) >= 6`)* | **OK** |
| 6 | `magic_link.pb.js` | 694 | ОК | Не возвращает `otpId` в `magic-request` (`{ ok: true, waitToken }`); 32-символьные `code` и `waitToken`; `$security.equal`; удаление после 5 попыток (`403`). **Замечания №1, №2, №4:** 694 строки (>500 hard limit), имена ключей store/индекса (`vallome_store_keys` вместо `vallome_store_index`, `vallome_mwait_` вместо `magicWait:`, `vallome_echg_` вместо `emailChange:`), проверка замка `waitToken` | **Нужна доработка** |
| 7 | `store_cleanup_cron.pb.js` | 64 | ОК | Расписание `*/10 * * * *`, очистка просроченных ключей. **Замечание №2:** имя cron `cleanupVallomeStore` вместо `sweepAuthStore`, ключ индекса `vallome_store_keys` вместо `vallome_store_index`, префиксы в `allowed()` | **Нужна доработка** |
| 8 | `change_email.pb.js` | 165 | ОК | Очередь смены почты с записью в индекс зачистки. **Замечание №2:** ключи `vallome_echg_*` / `vallome_echg_user_*` и `vallome_store_keys` вместо `emailChange:*` / `emailChangeUser:*` и `vallome_store_index` | **Нужна доработка** |
| 9 | `otp_signup.pb.js` | 5 | ОК | Только `e.next()`, не создаёт запись в `users` и не включает `emailVisibility` | **OK** |
| 10 | `chats_sync_listing_host.pb.js` | 46 | ОК | Условие `e.collection?.name !== "listings"` удалено; фильтр коллекции вторым аргументом `"listings"`; синхронизирует `chats` и `bookings` | **OK** |
| 11 | `chats_messages.pb.js` | 188 | ОК | Проверка уникальности чата и наличия брони на create `"chats"`; обновление `last_message`, `last_message_at` и уведомления на create `"messages"`; нет `e.collection?.name` | **OK** |
| 12 | `occupied_listings.pb.js` | 316 | ОК | Полная выгрузка `id != ''` убрана; в `findRecordsByFilter` передаются занимающие статусы и `check_out > {:from}` с полночью UTC `YYYY-MM-DD 00:00:00.000Z`. **Замечание №1:** 316 строк (>300 warning) — слегка уплотнить до ≤300 строк | **Нужна мелкая правка** |
