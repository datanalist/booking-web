# Code Review: Track A (`feat/pb-docker-schema`)

**Дата:** 2026-10-18  
**Ревьюер:** Gemini 4 Argon Medium  
**Ветка:** `feat/pb-docker-schema` (база: `dev-dns_local`, коммит `fc3a114`)  
**Вердикт:** `APPROVED`

---

## 1. Общая сводка

Исполнитель Track A подготовил Docker-образ PocketBase `0.40.4`, конфигурацию `docker-compose.yml`, шаблон окружения `.env.example`, выверенную схему `pb_schema.json` и идемпотентную миграцию `1729200000_import_schema.js`. Все требования спецификации (§4, §4.1, §4.5, §4.6, §4.7) и мультиагентного плана соблюдены, границы трека не нарушены.

---

## 2. Чеклист ревьюера

| Критерий | Статус | Файлы / Комментарий |
| --- | --- | --- |
| Покрытие задач трека против спецификации (§4, §4.1, §4.5, §4.6, §4.7) | Да | `deploy/pocketbase/Dockerfile`, `deploy/pocketbase/docker-compose.yml`, `deploy/pocketbase/.env.example`, `deploy/pocketbase/pb_schema.json`, `deploy/pocketbase/pb_migrations/1729200000_import_schema.js` |
| Feature-first: код в каталоге своей поставки, без расползания по `src/` | Да | Только `deploy/pocketbase/**` |
| Гипермодульность: один файл — одна ответственность, ≤300 строк | Да | `Dockerfile` (18 строк), `docker-compose.yml` (23 строки), `.env.example` (5 строк), `1729200000_import_schema.js` (48 строк); `pb_schema.json` — декларативный дамп схемы PocketBase |
| Строгая типизация и валидация схемы на границе | Да | В `1729200000_import_schema.js` проверяется наличие `listing_blocks` и точный `listings.id === "pbc_3660939671"`; правила API используют строгие проверки `:isset = false` |
| Секреты: нет паролей, `pb_data`, живого WAN IP, `.env` | Да | В `deploy/pocketbase/.env.example` пустые `PB_ADMIN_EMAIL=` и `PB_ADMIN_PASSWORD=`; `.env` и `pb_data` отсутствуют |
| Расхождение с матрицей файлов трека (`pb_hooks/`, `deploy/minipc/`, общие файлы) | Нет (чисто) | Затронуты ровно 5 файлов из матрицы Track A |

---

## 3. Построчная сверка артефактов

### 3.1. `deploy/pocketbase/Dockerfile`
- Базовый образ `alpine:3.21`, версия `ARG PB_VERSION=0.40.4`.
- Контрольная сумма `ARG PB_SHA256=9042ec818570e79c3628dadcd0a756c1496d9e1173918ec409d133c02f82e5fa` для `pocketbase_0.40.4_linux_amd64.zip` проверяется через `sha256sum -c -` до распаковки. *(Примечание для этапа слияния I1: синхронизировать этот официальный хеш в тексте спецификации, если там упоминалось чтение `checksums.txt` или иной хеш).*
- Жёсткий `ENTRYPOINT` отсутствует, что позволяет выполнять `docker compose run --rm pocketbase /pb/pocketbase superuser upsert ...`.
- `CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/pb/pb_data", "--hooksDir=/pb/pb_hooks", "--migrationsDir=/pb/pb_migrations"]` полностью соответствует §4 спецификации.

### 3.2. `deploy/pocketbase/docker-compose.yml`
- Порт опубликован строго на loopback: `"127.0.0.1:8090:8090"`.
- Контейнер запускается от непривилегированного пользователя: `user: "1000:1000"`.
- Корректное завершение SQLite/WAL обеспечено `init: true` и `stop_grace_period: 30s`.
- Тома смонтированы с нужными правами: `./pb_data:/pb/pb_data`, `./pb_hooks:/pb/pb_hooks:ro`, `./pb_migrations:/pb/pb_migrations:ro`, `./pb_schema.json:/pb/pb_schema.json:ro`.
- Ротация логов `json-file`: `max-size: "10m"`, `max-file: "3"`.
- Настроен `healthcheck` на `http://127.0.0.1:8090/api/health`.

### 3.3. `deploy/pocketbase/.env.example`
- Содержит `PB_PUBLIC_URL=https://pb.booking.vallome.ru`, `PB_ADMIN_EMAIL=`, `PB_ADMIN_PASSWORD=`.
- Реальные пароли и белый IP отсутствуют.

### 3.4. `deploy/pocketbase/pb_schema.json`
- **Коллекция `users` (`_pb_users_auth_`):**
  - `email.required = false`, `hidden: false` на полях `email`, `phone`, `balance`, `staff_tasks`, `fcm_token`.
  - Правила доступа (`listRule`, `viewRule`, `createRule`, `updateRule`, `deleteRule`) дословно совпадают с §4.7 (`createRule: null`, защита служебных полей `account_status`, `verified_host`, `balance`, `rating`, `reviews_count`, `years_hosting`, `staff_tasks`, `roles` через `:isset = false || @request.body.<field> = <field>`).
- **Коллекция `listings` (`pbc_3660939671`):**
  - Снят `required` (`required: false`) с булевых полей `pets_allowed`, `cancellation_allowed` и полей черновика (`title`, `city`, `address`, `photos`, `description`, `max_guests`, `check_in_time`, `check_out_time`, `price_night`, `price_14`, `price_28`).
  - Добавлены поля `guests_forbidden` (`bool`, `required: false`) и `unique_prices` (`json`, `required: false`, `maxSize: 200000`).
  - Сохранены русские значения `select` для `housing_type` (`Квартира`, `Дом`, `Комната`, `Отель`), `amenities` (9 значений) и `extras` (8 значений), а также `status` (`draft`, `pending`, `published`, `rejected`, `archived`).
  - Правила `listRule`, `viewRule`, `createRule`, `updateRule`, `deleteRule` дословно соответствуют §4.7.
- **Коллекция `bookings` (`pbc_986407980`):**
  - Добавлено поле `cancel_comment` (`text`, `required: false`, `max: 500`), сохранены коды `cancel_reason` (`guest`, `host`, `host_timeout`, `prepay_timeout`).
  - Правила `listRule`, `viewRule`, `createRule`, `updateRule`, `deleteRule = null` дословно соответствуют §4.7.

### 3.5. `deploy/pocketbase/pb_migrations/1729200000_import_schema.js`
- Вызывает `app.importCollectionsByMarshaledJSON(raw, false)` в режиме extend/merge без удаления данных.
- Идемпотентно проверяет наличие `listing_blocks` через `app.findCollectionByNameOrId("listing_blocks")`.
- Проверяет инвариант `listings.id === "pbc_3660939671"` и создаёт коллекцию `listing_blocks` с `relation` на `pbc_3660939671` (`required: true`, `maxSelect: 1`, `cascadeDelete: false`), полями `start` и `end` (`date`, `required: true`), индексом `idx_listing_blocks_listing_start` на `(listing, start)` и правилами доступа `listing.host = @request.auth.id` из §4.7.
- Down-миграция не удаляет коллекции и данные.

---

## 4. Замечания

Замечаний, блокирующих слияние (`CHANGES_REQUESTED`), **нет**.

*Неблокирующая памятка для оркестратора на этапе интеграции (Task I1):*
- При финальной синхронизации документации учесть проверенный SHA256 `9042ec818570e79c3628dadcd0a756c1496d9e1173918ec409d133c02f82e5fa` для `pocketbase_0.40.4_linux_amd64.zip` и имя файла `docker-compose.yml`.
