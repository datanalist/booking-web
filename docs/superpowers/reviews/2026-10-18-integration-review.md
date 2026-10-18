# Финальное интеграционное ревью: PocketBase 0.40.4 и инфраструктура мини-ПК

**Дата:** 2026-10-18  
**Ревьюер:** `gemini-4-argon-medium`  
**Целевая ветка:** `dev-dns_local`  
**Слитые ветки:** `feat/pb-docker-schema` (Track A), `feat/pb-jsvm-hooks` (Track B), `feat/minipc-infra` (Track C)  
**Вердикт:** **`APPROVED`**

---

## 1. Сводка интеграции

Выполнено чистое octopus-слияние трёх изолированных веток Фазы 1 (`feat/pb-docker-schema`, `feat/pb-jsvm-hooks`, `feat/minipc-infra`) в `dev-dns_local` без конфликтов. Все рабочие деревья треков (`.worktrees/pb-docker-schema`, `.worktrees/pb-jsvm-hooks`, `.worktrees/minipc-infra`) сняты и переведены в git-ветки. В спецификации [`docs/superpowers/specs/2026-10-18-pocketbase-mini-pc-design.md`](../specs/2026-10-18-pocketbase-mini-pc-design.md) зафиксирован проверенный официальный SHA-256 архива `pocketbase_0.40.4_linux_amd64.zip`: `9042ec818570e79c3628dadcd0a756c1496d9e1173918ec409d133c02f82e5fa`.

Отчёты по трекам:
- Track A (`feat/pb-docker-schema`): [`2026-10-18-track-a-review.md`](2026-10-18-track-a-review.md) — `APPROVED`
- Track B (`feat/pb-jsvm-hooks`): [`2026-10-18-track-b-review.md`](2026-10-18-track-b-review.md) — все 5 замечаний ревью устранены коммитом `453a254` (`APPROVED`)
- Track C (`feat/minipc-infra`): [`2026-10-18-track-c-review.md`](2026-10-18-track-c-review.md) — `APPROVED`

---

## 2. Межтрековая консистентность и соответствие спецификации

| Стык между треками | Проверено | Статус |
| --- | --- | --- |
| **Caddy (Track C) ↔ PocketBase (Track A + B)** | `Caddyfile` проксирует на `127.0.0.1:8090`, сбрасывает клиентский `X-Forwarded-For` (`header_up -X-Forwarded-For`) и выставляет `X-Real-IP {client_ip}`; `00_settings.pb.js` настраивает `trustedProxy.headers = ["X-Real-IP"]` и `useLeftmostIP = false`. Лимит тела `32MB` синхронизирован в `Caddyfile` и `$apis.bodyLimit(32 * 1024 * 1024)`. SSE `/api/realtime*` не сжимается (`@not_sse`) и не буферизуется (`flush_interval -1`, `read_timeout 360s`). | **OK** |
| **fail2ban (Track C) ↔ Маршруты и коды хуков (Track B)** | Фильтры `caddy-auth.conf`, `caddy-magic.conf` и `caddy-scan.conf` точно соответствуют путям `/api/vallome/magic-request`, `/api/vallome/magic-auth`, `/api/vallome/change-email`, `/api/collections/*/auth-*` и возвращаемым HTTP-кодам (`400`/`401`/`403`/`429`). ACME `/.well-known/` исключён через `ignoreregex`. | **OK** |
| **Миграция и схема (Track A) ↔ JSVM-хуки (Track B)** | Миграция `1729200000_import_schema.js` импортирует `pb_schema.json` в режиме `extend/merge` (`false`) и идемпотентно создаёт `listing_blocks` с связью на `listings` (`pbc_3660939671`). Хуки `bookings_overlap.pb.js` и `occupied_listings.pb.js` работают с `listing_blocks` (`start`, `end`) и `bookings` (`check_in`, `check_out`, `requested_check_in`, `requested_check_out`). | **OK** |
| **Автобэкап PocketBase (Track B) ↔ Выгрузка на `fox-pc` (Track C)** | `00_settings.pb.js` включает ежедневный бэкап `0 3 * * *` (`cronMaxKeep = 7`) в `/opt/pocketbase/pb_data/backups/`. Таймер `pull-pb-backups.timer` (`03:30:00`) запускает `pull-pb-backups.sh`, который стягивает по SSH (`192.168.50.2`) только `*.zip`, не трогая живые файлы `data.db` / `data.db-wal`. | **OK** |
| **Индекс `$app.store()` внутри Track B** | `magic_link.pb.js`, `change_email.pb.js` и `store_cleanup_cron.pb.js` используют единый индекс `vallome_store_index`, cron `sweepAuthStore` (`*/10 * * * *`) и префиксы `vallome_mcode_`, `magicWait:`, `emailChange:`, `emailChangeUser:`. | **OK** |
| **Архитектурные правила репозитория** | Код поставки изолирован в `deploy/pocketbase/` и `deploy/minipc/`, `src/` не затронут. Все файлы укладываются в лимит гипермодульности (максимум — `magic_link.pb.js`, 345 строк с обоснованием в шапке; `occupied_listings.pb.js` — 175 строк). Секреты, пароли, `.env`, `pb_data` и реальный WAN IP в репозитории отсутствуют. | **OK** |

---

## 3. Результаты локального Docker Smoke-теста

Собран образ `deploy/pocketbase/Dockerfile` (`pocketbase_0.40.4_linux_amd64.zip`, `SHA256=9042ec818570e79c3628dadcd0a756c1496d9e1173918ec409d133c02f82e5fa`) и запущен временный контейнер со всеми 12 хуками, миграцией и `pb_schema.json`:

1. **Контейнер и права (`1000:1000`):**
   - `docker exec pb-smoke-test id` → `uid=1000 gid=1000 groups=1000`.
   - Подтверждено на практике требование §4 спецификации: каталог `pb_data` на хосте обязан принадлежать `1000:1000` до старта контейнера.
2. **Миграция `1729200000_import_schema.js` и схема БД:**
   - Созданы все пользовательские коллекции: `users` (`_pb_users_auth_`), `listings` (`pbc_3660939671`), `bookings` (`pbc_986407980`), `notifications` (`pbc_2301922722`), `reviews` (`pbc_4163081445`), `favorites` (`pbc_2151843437`), `chats` (`pbc_3861817060`), `messages` (`pbc_2605467279`), `tickets` (`pbc_3306545694`), `listing_blocks` (`pbc_234799420`).
   - В `listings`: `guests_forbidden` (`bool`, `required: false`), `unique_prices` (`json`, `required: false`), `pets_allowed` (`bool`, `required: false`), `cancellation_allowed` (`bool`, `required: false`).
   - В `bookings`: `cancel_comment` (`text`, `required: false`, `max: 500`).
   - В `listing_blocks`: поля `listing`, `start`, `end`, индекс `idx_listing_blocks_listing_start` и правила доступа `listing.host = @request.auth.id`.
   - Повторный рестарт контейнера (`docker restart`) прошёл без ошибок и не продублировал `listing_blocks`.
3. **Загрузка JSVM-хуков и `00_settings.pb.js`:**
   - Все 12 файлов `*.pb.js` в `/pb/pb_hooks/` загрузились без синтаксических ошибок и без panic Goja JSVM.
   - Проверка `/api/settings` подтвердила применение `appName = "vallome.booking"`, `appURL = "https://pb.booking.vallome.ru"`, `trustedProxy.headers = ["X-Real-IP"]`, `useLeftmostIP = false`, 9 правил `rateLimits`, `backups.cron = "0 3 * * *"` (`cronMaxKeep = 7`), `logs.maxDays = 7` (`logIP = true`, `logAuthId = true`).
4. **Проверка HTTP-эндпоинтов:**
   - `GET /api/health` → `200 OK` (`{"message":"API is healthy.","code":200,"data":{}}`).
   - `GET /api/vallome/occupied-listings?checkIn=2026-11-01&checkOut=2026-11-05` → `200 OK` (`{"listingIds":[]}`).
   - `GET /api/vallome/occupied-dates?listing=testlistingid12` → `200 OK` (`{"ranges":[]}`).
   - `POST /api/vallome/magic-request` с невалидным email → `400 Bad Request` (`{"message":"Введите корректный email"}`).
   - `POST /api/vallome/magic-request` с валидным email (при локальном тестовом SMTP-приёмнике) → `200 OK` (`{"ok":true,"waitToken":"<32-char-token>"}`), поле `otpId` в ответе отсутствует.
   - `GET /api/vallome/magic-wait?waitToken=<token>` → `200 OK` (`{"token":""}`).
5. **Валидация `Caddyfile`:**
   - `caddy validate --config /etc/caddy/Caddyfile` через `caddy:2-alpine` → `Valid configuration`.
6. **Очистка:**
   - Временный контейнер `pb-smoke-test` остановлен и удалён, временные каталоги `/tmp/pb_smoke_data.*` полностью очищены.
