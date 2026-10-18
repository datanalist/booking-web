# Ревью спецификации: «PocketBase и Caddy на мини-ПК» (`2026-10-18-pocketbase-mini-pc-design.md`)

**Статус:** все замечания К-1…К-5, В-1…В-5, С-1…С-5 и У-1…У-3 учтены и внесены в основную спецификацию [`2026-10-18-pocketbase-mini-pc-design.md`](2026-10-18-pocketbase-mini-pc-design.md) (правка 2026-10-18). Текст ниже — исходное ревью, его формулировки не переписывались.

**Дата ревью:** 2026-10-18  
**Объект ревью:** [`docs/superpowers/specs/2026-10-18-pocketbase-mini-pc-design.md`](2026-10-18-pocketbase-mini-pc-design.md)  
**Смежные артефакты, проверенные в ходе ревью:**
- Документация в `booking-web`: [`docs/pocketbase-schema.md`](../../pocketbase-schema.md), [`docs/pocketbase-server.md`](../../pocketbase-server.md), [`docs/architecture.md`](../../architecture.md), [`docs/data-adapter.md`](../../data-adapter.md), [`docs/technical spec.md`](../../technical%20spec.md), [`docs/superpowers/specs/2026-09-20-owner-cabinet-first-slice-design.md`](2026-09-20-owner-cabinet-first-slice-design.md)
- Код `booking-web`: `package.json`, `src/config/index.ts`, `src/api/*`, `src/features/*`
- Репозиторий Flutter/PB (`/home/mk/Projects/Booking`): `pb_schema.json`, `pb_hooks/*.pb.js` (7 файлов), `scripts/ensure_*.py`, `scripts/enable_email_otp.py`, `scripts/seed_*.py`
- Репозиторий инфраструктуры мини-ПК (`/home/mk/Projects/pxe-minipc`): `README.md`, `ethernet.md`, `scripts/pxe.sh`, `config/late.sh.tmpl`

---

## Резюме ревью

Целевая спецификация лаконично описывает базовый перенос `pb.booking.vallome.ru` с удалённого VPS Beget на домашний мини-ПК (Debian 13) с Caddy на хосте и PocketBase 0.40.4 в Docker-контейнере. Однако при сверке спецификации с реальными файлами хуков (`pb_hooks/`), скриптами схемы (`scripts/ensure_*.py`), дампом `pb_schema.json`, сетевой конфигурацией `pxe-minipc` и кодом фронтенда `booking-web` выявлен ряд **критических архитектурных, инфраструктурных и секьюрити-проблем**, которые приведут либо к неработоспособности деплоя/схемы, либо к уязвимостям (Account Takeover, Privilege Escalation, самобан всего трафика через fail2ban, double booking).

Ниже приведены замечания, сгруппированные по приоритетам, с описанием риска и конкретным предложением по исправлению.

---

## 1. Критические замечания (Blocker / High Risk)

### К-1. Риск полной блокировки сайта или неработающего `fail2ban` из-за NAT роутера и `ignoreip` (§3, §4)
- **Проблема / риск:**
  В §4 указано: *«В `ignoreip` входят `127.0.0.0/8`, `::1` и подсеть Wi-Fi роутера»*.
  При пробросе портов TCP 80/443 (Port Forwarding) многие домашние роутеры (особенно при включённом NAT Loopback / Hairpin NAT или некорректном правиле SNAT/Masquerade на LAN-интерфейсе) подменяют адрес источника (`src IP`) входящих из интернета пакетов на внутренний IP роутера (например, `192.168.1.1`).
  - Если роутер подменяет `src IP` на `192.168.1.1`, а вся подсеть Wi-Fi (`192.168.1.0/24`) внесена в `ignoreip`, то **`fail2ban` никогда никого не забанит**, так как любой внешний атакующий будет виден в `/var/log/caddy/access.log` как `192.168.1.1`.
  - Если же IP роутера не в `ignoreip`, то первая же атака из интернета приведёт к бану IP роутера, что **отключит сайт для всех пользователей интернета одновременно**.
  - Кроме того, в PocketBase по умолчанию не настроены `TrustedProxy` заголовки: без них сам PocketBase видит все запросы приходящими с IP Docker-сети (`172.17.0.1` / `127.0.0.1`).
- **Предложение по исправлению:**
  1. В §6 («Проверки») добавить обязательную проверку: выполнить запрос с мобильного интернета (LTE, вне Wi-Fi) и убедиться в `/var/log/caddy/access.log`, что поле `request.remote_ip` / `client_ip` содержит реальный публичный IP мобильного оператора, а **не** LAN-адрес роутера (`192.168.x.1`).
  2. В `ignoreip` в `/etc/fail2ban/jail.local` включать `127.0.0.0/8 ::1` и конкретные статические LAN-адреса доверенных машин (или LAN-подсеть только после подтверждения, что WAN-трафик не маскарадится роутером).
  3. В настройки PocketBase (`Settings -> Application -> User IP proxy headers` или через миграцию/скрипт) обязательно прописать доверие заголовку `X-Real-IP` (или `X-Forwarded-For`) при работе за `127.0.0.1` / Docker-сетью.

---

### К-2. Пробел в восстановлении схемы БД: `ensure_*.py` упадут без `listings`, а существующий `pb_schema.json` забыт (§1, §4, §5, §7)
- **Проблема / риск:**
  В §1, §4 и §5 сказано, что база поднимается пустой, каталога `pb_migrations` нет, а в §5 и §7 написано: *«Скрипты `ensure_*.py` и `seed_*.py` из репозитория Flutter в это окно не запускаются. Коллекция `listings` ими не создаётся. Это следующий шаг»*.
  При проверке `/home/mk/Projects/Booking/scripts/` обнаружено:
  1. Скрипта `ensure_listings.py` **действительно не существует**, а скрипты `ensure_bookings.py`, `ensure_favorites.py`, `ensure_chats.py`, `ensure_reviews.py` жестко требуют уже существующую коллекцию `listings` (`if not listings or not users: raise RuntimeError("Need existing listings and users collections")`)! То есть «следующим шагом» запустить `ensure_*.py` на пустой базе **невозможно** — они упадут.
  2. При этом в корне `/home/mk/Projects/Booking/pb_schema.json` **уже лежит полный актуальный дамп всех коллекций** (включая `users`, `listings`, `favorites`, `bookings`, `reviews`, `chats`, `messages`, `notifications`, `tickets` со всеми полями и индексами), который вообще не упомянут в спецификации!
  3. Пока схема не импортирована, смонтированные в §4 хуки (`occupied_listings.pb.js`, `bookings_overlap.pb.js`, `chats_messages.pb.js`, `chats_sync_listing_host.pb.js`, `magic_link.pb.js`) при обращении к отсутствующим коллекциям/полям будут сыпать ошибками.
- **Предложение по исправлению:**
  1. Указать в спецификации `pb_schema.json` как основной источник восстановления схемы пустой базы (импорт через Admin UI `Settings -> Import collections` или автоматически через `pb_migrations` / CLI / API при инициализации).
  2. Скопировать или версионировать `pb_schema.json` (или сгенерировать из него начальную миграцию в `deploy/pocketbase/pb_migrations/`) в репозитории, чтобы контейнер PocketBase сразу поднимался с консистентной схемой всех коллекций без ручных шагов.

---

### К-3. Уязвимость Account Takeover (перебор 5-значного кода magic-link без лимита попыток и мимо `fail2ban`)
- **Проблема / риск:**
  В хуке `magic_link.pb.js` (который монтируется в контейнер по §4):
  1. Эндпоинт `POST /api/vallome/magic-request` генерирует 5-значный цифровой код `randomCode()` (`10000`–`99999` или `00000`–`99999` — всего $10^5$ комбинаций), сохраняет его в `$app.store()` под ключом `magicPending:<otpId>` на 10 минут и **возвращает `otpId` прямо в теле HTTP-ответа** (`{ otpId: otpId }`) любому неавторизованному клиенту.
  2. Эндпоинт `POST /api/vallome/magic-auth` принимает `id` (`otpId`) и `code`. При неверном `code` функция `consumePending` выбрасывает `new Error("invalid")`, **НЕ удаляет** `magicPending:<otpId>` и **НЕ увеличивает счётчик попыток**, возвращая HTTP `400`.
  3. Jail `caddy-auth` в `fail2ban` (§4) отслеживает только `/api/collections/*/auth-with-password`, поэтому запросы к `/api/vallome/magic-auth` и `/api/vallome/magic-request` **не блокируются `fail2ban`**.
  Злоумышленник может запросить вход на любой чужой email (включая `host` и `staff`), получить `otpId` из ответа и за несколько секунд перебрать 5-значный `code`, получив валидный `authToken` любого пользователя!
- **Предложение по исправлению:**
  1. В `magic_link.pb.js`:
     - Заменить 5-значный цифровой код в `magicPending` на криптостойкий токен минимум из 32 символов (`$security.randomString(32)`), так как пользователь переходит по кнопке-ссылке из письма, а не вводит код вручную.
     - Если короткий код нужен, хранить счётчик попыток `attempts` в `magicPending:<otpId>` и удалять запись после 3–5 неудачных попыток.
     - Использовать constant-time сравнение (`$security.equal(pending.code, password)`).
  2. В `fail2ban` (§4) расширить регулярное выражение фильтра `caddy-auth` на маршруты:
     - `/api/collections/*/auth-with-*`
     - `/api/collections/*/request-otp`
     - `/api/vallome/magic-request`
     - `/api/vallome/magic-auth`
     - `/api/vallome/change-email`
  3. Включить встроенный Rate Limiter PocketBase для маршрутов аутентификации и кастомных хуков.

---

### К-4. Критические уязвимости в API Rules коллекций (`users`, `bookings`, `listings`, `reviews`)
- **Проблема / риск:**
  При проверке `pb_schema.json` и `scripts/ensure_*.py`, которые соответствуют `docs/pocketbase-schema.md`:
  1. **Privilege Escalation и накрутка баланса в `users`**:
     В `pb_schema.json` у коллекции `users` задано правило `updateRule: "id = @request.auth.id"`. Никаких ограничений на изменяемые поля нет! Любой авторизованный пользователь может отправить `PATCH /api/collections/users/records/<id>` с JSON `{"roles": ["guest", "host", "staff"], "balance": 1000000, "verified_host": true, "account_status": "active", "rating": 5, "reviews_count": 999}` и получить права сотрудника (`staff`) и любой баланс.
  2. **Утечка ПДн и секретов в `users` (`viewRule: ""`)**:
     В `seed_listings.py` (`ensure_user_view_rule`) и `pb_schema.json` у коллекции `users` стоит публичный `viewRule: ""` (чтобы гости могли делать `expand=host` у объявления). При этом поля `phone`, `birthdate`, `balance`, `fcm_token`, `staff_tasks`, `account_status` имеют `"hidden": false`! Любой аноним из интернета может выгрузить телефоны, даты рождения, балансы и push-токены всех пользователей.
  3. **Подмена статуса оплаты и стоимости в `bookings`**:
     В `ensure_bookings.py` `updateRule` проверяет только неизменность `guest`, `host` и `listing`:
     `(guest = @request.auth.id || host = @request.auth.id) && (@request.body.guest:isset = false || ...)`.
     Гость может сам отправить `PATCH` с `{"status": "confirmed", "prepaid_at": "2026-10-18 12:00:00Z", "total": 0, "prepay": 0}`, подтвердив себе бронь без согласия хозяина и без оплаты!
  4. **Невозможность работы кабинета владельца (`booking-web`) с коллекцией `listings`**:
     В `pb_schema.json` у `listings` правила `createRule`, `updateRule`, `deleteRule` равны `null` (только superuser). Владелец жилья из `booking-web` вообще не сможет создавать, редактировать или архивировать свои объявления.
- **Предложение по исправлению:**
  1. Для `users`:
     - Пометить поля `balance`, `fcm_token`, `staff_tasks` (и при необходимости `birthdate`) как `hidden: true` или вынести публичный профиль хозяина во `view`-коллекцию `host_profiles`.
     - В `users.updateRule` запретить пользователю менять защищённые поля:
       ```text
       id = @request.auth.id &&
       (@request.body.roles:isset = false) &&
       (@request.body.account_status:isset = false) &&
       (@request.body.verified_host:isset = false) &&
       (@request.body.years_hosting:isset = false) &&
       (@request.body.rating:isset = false) &&
       (@request.body.reviews_count:isset = false) &&
       (@request.body.balance:isset = false) &&
       (@request.body.staff_tasks:isset = false)
       ```
  2. Для `bookings`:
     - Запретить прямое изменение денежных полей (`total`, `prepay`, `remainder`, `commission`, `host_amount`, `prepaid_at`) через `updateRule`, а переходы статусов (`pending_host -> awaiting_prepayment`, `awaiting_prepayment -> confirmed`, отмена) валидировать в хуке `onRecordUpdateRequest("bookings")` в зависимости от того, кто вызывает запрос (`guest` или `host`).
  3. Для `listings`:
     - Задать `createRule: "@request.auth.id != '' && @request.body.host = @request.auth.id && (@request.body.status = 'draft' || @request.body.status = 'pending')"`
     - Задать `updateRule: "host = @request.auth.id && (@request.body.host:isset = false || @request.body.host = host) && (@request.body.status:isset = false || @request.body.status = 'draft' || @request.body.status = 'pending' || @request.body.status = 'archived') && (@request.body.rating:isset = false) && (@request.body.reviews_count:isset = false)"`.

---

### К-5. Race Condition (Double Booking) и игнорирование `listing_blocks` в `bookings_overlap.pb.js`
- **Проблема / риск:**
  Хук `/home/mk/Projects/Booking/pb_hooks/bookings_overlap.pb.js`, который монтируется в контейнер по §4, имеет три серьёзных дефекта:
  1. **Отсутствие транзакционной изоляции (Race Condition / TOCTOU):**
     Хук подписан на `onRecordCreateRequest` / `onRecordUpdateRequest` (уровень HTTP-запроса до старта транзакции записи). Два параллельных запроса на бронирование одного жилья на одни и те же даты одновременно выполняют `e.app.findRecordsByFilter(...)`, оба видят, что пересечений нет, и оба вызывают `e.next()`, создавая две пересекающиеся брони (double booking).
  2. **Игнорирование `listing_blocks`:**
     В `occupied_listings.pb.js` блокировки календаря хозяина (`listing_blocks`) учитываются, а в `bookings_overlap.pb.js` проверка `listing_blocks` **полностью отсутствует**! Гость может отправить POST `/api/collections/bookings/records` и забронировать даты, заблокированные хозяином.
  3. **Блокировка отмены брони при проверке `onRecordUpdateRequest`:**
     В `rejectIfOverlap(e)` вообще не проверяется статус *самой* обновляемой записи (`record.get("status")`). Если запись переводится в `cancelled` или `completed`, хук всё равно проверяет её даты на пересечение и может выбросить `BadRequestError("На эти даты жилье уже занято")`, не давая отменить или завершить бронь!
- **Предложение по исправлению:**
  1. В начале `rejectIfOverlap` проверять статус самой записи: если ` OCCUPYING.indexOf(str(record.get("status")).trim()) === -1`, сразу вызывать `e.next()`.
  2. Добавить в `rejectIfOverlap` проверку пересечения с коллекцией `listing_blocks` (аналогично `occupied_listings.pb.js`).
  3. Перенести проверку пересечений внутрь транзакции (`$app.runInTransaction((txApp) => { ... })` или использовать модельный хук `onRecordCreate` / `onRecordUpdate` с проверкой через транзакционный `e.app`), чтобы SQLite в режиме WAL сериализовал конкурирующие записи через `BEGIN IMMEDIATE`.

---

## 2. Замечания высокого приоритета (High Priority)

### В-1. Несогласованность моделей данных между `booking-web` и `docs/pocketbase-schema.md` (`pb_schema.json`)
- **Проблема / риск:**
  Спецификация готовит PocketBase для экосистемы `vallome.ru` (где живёт и мобильное приложение Flutter, и веб-кабинет владельца `booking-web`). Однако модели в `booking-web` (`src/api/types.ts`, `src/config/index.ts`) и схема БД PocketBase (`docs/pocketbase-schema.md` / `pb_schema.json`) несовместимы по ряду полей `listings`:
  1. **Статусы объявления (`status`)**: в `booking-web` используется `"moderation"`, а в PocketBase схеме — `"pending"` (плюс `"rejected"`).
  2. **Типы жилья (`housing_type`)**: в `booking-web` ключи `"apartment" | "apartments" | "studio" | "house" | "room"` (5 вариантов, включая «Апартаменты» и «Студия»), а в PocketBase `select` — только 4 русских значения `["Квартира", "Дом", "Комната", "Отель"]`.
  3. **Обязательные поля при сохранении черновика (`draft`)**: в `booking-web` черновик создаётся после шага 1 мастера (`photos: []`, `maxGuests: 0`, `checkInTime: ""`, `priceNight: 0`, поля `city` нет вовсе). В `pb_schema.json` у коллекции `listings` поля `city`, `photos`, `description`, `max_guests`, `check_in_time`, `check_out_time`, `price_night`, `price_14`, `price_28` имеют `required: true`! PocketBase отклонит создание черновика на шаге 1.
  4. **Отсутствующие в схеме БД поля из `booking-web`**: `uniquePrices: { date: IsoDate; base: number }[]` (уникальные цены на конкретные даты шага 6 мастера) и `guestsForbidden: boolean` отсутствуют в `docs/pocketbase-schema.md` и `pb_schema.json`.
- **Предложение по исправлению:**
  Зафиксировать в `docs/pocketbase-schema.md` и маппере адаптера `booking-web`:
  - Маппинг статуса `moderation` (UI) ↔ `pending` (PB) и кодов удобств/типов жилья, а также расширить `housing_type` в PB значениями `Апартаменты` и `Студия` (или хранить `placement_type`).
  - Для черновиков (`status = 'draft'`) в коллекции `listings` снять флаг `required: true` на уровне БД с полей шагов 2–6 (`photos`, `max_guests`, `check_in_time`, `check_out_time`, `price_night`, `price_14`, `price_28`), перенеся строгую проверку заполненности всех полей и минимум 6 фото в хук при переводе `status` в `pending` / `published`.
  - Добавить JSON-поле `unique_prices` (или отдельную коллекцию) и `guests_forbidden` в схему `listings`.

---

### В-2. Конфликт `encode gzip` и отсутствие `flush_interval` в Caddyfile для Realtime SSE (`/api/realtime`) (§4)
- **Проблема / риск:**
  В §4 для `pb.booking.vallome.ru` указано:
  `pb.booking.vallome.ru — gzip, тело до 32 МБ, reverse_proxy 127.0.0.1:8090 с X-Real-IP, X-Forwarded-For, X-Forwarded-Proto и read_timeout 360s`.
  PocketBase использует Server-Sent Events (`GET /api/realtime`) для чатов и уведомлений в реальном времени. Если Caddy сжимает поток `text/event-stream` через `encode gzip`, фреймы сжатия буферизуются в памяти компрессора до заполнения окна, из-за чего события чата (`PB_CONNECT`, новые сообщения) не доходят до клиента вовремя или обрываются.
- **Предложение по исправлению:**
  В `deploy/pocketbase/Caddyfile` для `pb.booking.vallome.ru`:
  1. Исключить `text/event-stream` из сжатия (в Caddy 2 `encode gzip` по умолчанию имеет фильтр MIME-типов, но для надёжности явно задать matcher `not path /api/realtime*` или `not header Accept *text/event-stream*`).
  2. Добавить `flush_interval -1` внутри блока `reverse_proxy 127.0.0.1:8090` для немедленной отправки чанков SSE.

---

### В-3. Передача пароля суперпользователя через CLI и отсутствие бинарника на хосте (§4, §5)
- **Проблема / риск:**
  В §4 сказано: *«Суперпользователь создаётся CLI PocketBase на мини-ПК... Пароль новый, в git и в логи команд не пишется»*.
  Однако:
  1. PocketBase работает **внутри Docker-контейнера**, на самом хосте мини-ПК бинарника `/opt/pocketbase/pocketbase` нет.
  2. Команда `./pocketbase superuser upsert email password` принимает пароль позиционным аргументом командной строки. Если выполнить её напрямую в шелле или через `docker exec ... /pb/pocketbase superuser upsert mikefro62@gmail.com '<ПАРОЛЬ>'`, пароль попадёт в историю команд, список процессов `ps aux` и журнал `sudo`/Docker daemon.
- **Предложение по исправлению:**
  В §4 и §5 явно прописать безопасный способ создания суперпользователя внутри контейнера без записи пароля в историю и логи команд (например, чтение пароля из файла с правами `0600` в tmpfs `/run/user/...` или передача через переменную окружения контейнера при одноразовом запуске):
  ```bash
   HISTCONTROL=ignorespace
   read -r -s -p "PB Superuser Password: " PB_SU_PASS && export PB_SU_PASS
   docker compose -f /opt/pocketbase/compose.yaml run --rm -e PB_SU_PASS pocketbase \
     sh -c '/pb/pocketbase superuser upsert mikefro62@gmail.com "$PB_SU_PASS" --dir=/pb/pb_data'
   unset PB_SU_PASS
  ```

---

### В-4. Ошибка в хуке `chats_sync_listing_host.pb.js` (`e.collection?.name` в JSVM)
- **Проблема / риск:**
  В файле `/home/mk/Projects/Booking/pb_hooks/chats_sync_listing_host.pb.js` (строка 8), который входит в список 7 монтируемых хуков (§4), написано:
  ```js
  onRecordAfterUpdateSuccess((e) => {
    const record = e.record
    if (!record || e.collection?.name !== "listings") return
  ```
  При этом в соседнем файле `chats_messages.pb.js` (строки 8–9 и 69–71) авторы уже наступали на этот баг и оставили комментарий:
  `// Не проверять e.collection?.name: в PB JSVM оно часто undefined, и тогда превью чата молча не обновлялось`.
  В PocketBase v0.23+ у события `RecordEvent` (`onRecordAfterUpdateSuccess`) нет свойства `e.collection` (коллекция доступна через `e.record.collection().name`, и кроме того хук уже отфильтрован вторым аргументом `"listings"`). Из-за `e.collection?.name !== "listings"` (где `undefined !== "listings"` всегда `true`) хук `chats_sync_listing_host.pb.js` **вообще никогда не выполняется**!
- **Предложение по исправлению:**
  Убрать проверку `e.collection?.name !== "listings"` из `chats_sync_listing_host.pb.js` (оставить `if (!record) return`, так как фильтр `"listings"` уже передан вторым аргументом `onRecordAfterUpdateSuccess(..., "listings")`).

---

### В-5. Риск потери SSH-доступа к мини-ПК при перенастройке `eno1` в §3 и §5
- **Проблема / риск:**
  В §3 указано: *«Сразу после входа на `eno1` записывается статический адрес без шлюза, маршрут по умолчанию через кабель удаляется, затем `pxe.sh lan` останавливается. DHCP с fox-pc не должен остаться включённым: он снова выдаст шлюз»*.
  Согласно `/home/mk/Projects/pxe-minipc/ethernet.md`, на мини-ПК в `/etc/network/interfaces` прописано `allow-hotplug eno1` и `iface eno1 inet dhcp`, а Wi-Fi настроен в `/etc/network/interfaces.d/wlp3s0`.
  Если агент, подключённый по SSH через `192.168.50.100`, остановит DHCP-клиент (`dhclient`/`ifdown eno1`), прежде чем поднимется статический адрес `192.168.50.100/24`, или если на `wlp3s0` в этот момент ещё не получен default route от домашнего роутера, мини-ПК потеряет связь по обоим интерфейсам.
  Кроме того, пока `eno1` не имеет шлюза, а `wlp3s0` подключён к роутеру, мини-ПК скачивает пакеты (`apt`, `docker build`) через Wi-Fi, а не через NAT `fox-pc`. Если Wi-Fi ещё не поднят или нестабилен, `docker build` и установка `caddy` упадут.
- **Предложение по исправлению:**
  Уточнить последовательность в §3 и §5:
  1. Сначала убедиться, что `wlp3s0` подключён к домашнему Wi-Fi, получил фиксированный LAN-IP от роутера и пингует интернет (`ping -I wlp3s0 1.1.1.1`), и что SSH на Wi-Fi-адрес мини-ПК открывается.
  2. Заменить в `/etc/network/interfaces` секцию `iface eno1 inet dhcp` на:
     ```text
     allow-hotplug eno1
     iface eno1 inet static
         address 192.168.50.100/24
     ```
  3. Применить адрес без разрыва TCP-сессии (`sudo ip addr replace 192.168.50.100/24 dev eno1 && sudo ip route del default via 192.168.50.1 dev eno1 || true`, а также остановить DHCP-клиент на `eno1`).
  4. На `fox-pc` выполнить `sudo scripts/pxe.sh stop`.

---

## 3. Замечания среднего приоритета (Medium Priority)

### С-1. Отсутствие автоматических бэкапов `pb_data` и риск повреждения SQLite на мини-ПК
- **Проблема / риск:**
  В §1 констатируется: *«VPS Beget удалён, копия `pb_data` не сохранилась»*. При переносе на домашний мини-ПК риск внезапного отключения питания или деградации накопителя ещё выше, чем в дата-центре. Однако в спецификации вообще не предусмотрены бэкапы `pb_data` и правила работы с SQLite в режиме WAL (`data.db-wal`, `data.db-shm`). Обычное копирование `cp -a /opt/pocketbase/pb_data` (как было в старом `docs/pocketbase-server.md`) на работающем контейнере без остановки или `VACUUM INTO` может дать битый бэкап.
- **Предложение по исправлению:**
  1. Включить встроенный автобэкап PocketBase (`Settings -> Backups -> Enable auto backups`, например `0 3 * * *`, хранение 7 архивов локально в `pb_data/backups` или выгрузка в S3). PocketBase делает горячий консистентный снапшот SQLite через встроенный механизм бэкапа.
  2. Добавить на `fox-pc` (или внешнем хранилище) периодический pull зашифрованных архивов из `/opt/pocketbase/pb_data/backups/*.zip`.
  3. В `compose.yaml` добавить `stop_grace_period: 30s` и `init: true`, чтобы при `docker compose down` / перезагрузке мини-ПК PocketBase успевал штатно закрыть соединения и сделать checkpoint WAL-файла.

---

### С-2. Отсутствие cron-хука для автоотмены броней по таймауту 12 часов (`host_respond_until` / `prepay_until`)
- **Проблема / риск:**
  В `docs/pocketbase-schema.md` (§ `bookings`) и ТЗ указано:
  - У владельца есть 12 часов на ответ (`host_respond_until`), иначе автоотмена (`status = 'cancelled'`, `cancel_reason = 'host_timeout'`).
  - У гостя есть 12 часов на предоплату (`prepay_until`), иначе автоотмена (`status = 'cancelled'`, `cancel_reason = 'prepay_timeout'`).
  При этом статусы `pending_host` и `awaiting_prepayment` входят в массив `OCCUPYING` в `bookings_overlap.pb.js` и `occupied_listings.pb.js`.
  В списке из 7 хуков (§4) **нет cron-хука (`cronAdd`)**, который бы отменял просроченные брони! В результате любая неоплаченная или проигнорированная бронь **навсегда блокирует даты объявления**.
- **Предложение по исправлению:**
  Добавить в `pb_hooks/` хук `bookings_timeouts.pb.js` с `cronAdd("bookings_timeouts", "*/5 * * * *", ...)`, который находит записи `bookings` со статусом `pending_host` (`host_respond_until < now`) и `awaiting_prepayment` (`prepay_until < now`) и переводит их в `status = "cancelled"` с соответствующим `cancel_reason`.

---

### С-3. Хранение состояния `magic_link.pb.js` и `change_email.pb.js` в `$app.store()` (in-memory) и утечка памяти
- **Проблема / риск:**
  Хуки `magic_link.pb.js` и `change_email.pb.js` хранят токены ожидания входа (`magicPending:*`, `magicWait:*`) и заявки на смену email (`emailChange:*`, `emailChangeUser:*`, TTL 24 часа) в оперативной памяти `$app.store()`.
  1. Любой рестарт контейнера PocketBase стирает все активные ссылки входа и все 24-часовые заявки на смену email.
  2. Если пользователь запросил `magic-request` или `change-email`, но не перешёл по ссылке, ключи с истёкшим `expires` **никогда не удаляются из `$app.store()`** до тех пор, пока к этому же ключу не обратятся снова. При большом числе запросов это приводит к утечке ОЗУ на мини-ПК.
- **Предложение по исправлению:**
  Либо добавить периодическую очистку просроченных ключей в `$app.store()` через `cronAdd`, либо хранить ожидания в системной/служебной таблице БД с TTL.

---

### С-4. Полное сканирование таблицы `bookings` в `occupied_listings.pb.js` и сдвиг дат из-за часовых поясов
- **Проблема / риск:**
  1. В `occupied_listings.pb.js` (строка 148) вызывается `collectListingIds("bookings", "id != ''", {})` — хук **при каждом поисковом запросе гостя выгружает вообще все брони из БД** (включая `completed` и `cancelled` за все годы, до 10 000 штук) и фильтрует их циклом в JS!
  2. Функции `dayKey(value)` в `occupied_listings.pb.js` и `bookings_overlap.pb.js` отрезают первые 10 символов `YYYY-MM-DD` от строки даты в PocketBase. Так как PocketBase хранит все поля типа `date` в UTC (`YYYY-MM-DD HH:MM:SS.sssZ`), передача клиентом полуночи по местному времени (например, `2026-10-20T00:00:00+03:00` → в UTC `2026-10-19 21:00:00.000Z`) приведёт к тому, что `dayKey` вернёт `2026-10-19` вместо `2026-10-20` (сдвиг на сутки назад).
- **Предложение по исправлению:**
  1. В `occupied_listings.pb.js` передавать фильтр по статусам `status = 'pending_host' || status = 'awaiting_prepayment' || status = 'confirmed' || status = 'change_requested'` и `check_out >= {:checkIn}` прямо в SQL-фильтр `findRecordsByFilter` (используя индекс `idx_bookings_status`).
  2. Зафиксировать в контракте API (`docs/pocketbase-schema.md`), что все календарные даты заезда/выезда (`check_in`, `check_out`, `start`, `end`) записываются клиентами строго как полночь UTC (`YYYY-MM-DD 00:00:00.000Z` / `YYYY-MM-DDT00:00:00Z`), без смещения локального часового пояса устройства.

---

### С-5. Особенности Debian 13 (`trixie`), Wi-Fi энергосбережения и Docker на мини-ПК (§3, §4)
- **Проблема / риск:**
  1. На мини-ПК используется Wi-Fi карта Intel Wireless 3165 (`wlp3s0`, см. `pxe-minipc/README.md`). По умолчанию модуль `iwlwifi` включает энергосбережение (`power_save on`), из-за чего при работе в качестве сервера входящие соединения (TCP 80/443 с роутера и SSH) страдают от скачков пинга, потерь ARP и обрывов соединения.
  2. В Dockerfile (§4) скачивается релиз `pocketbase_0.40.4_linux_amd64.zip`, но не указана проверка SHA256-чексуммы (`checksums.txt`), хотя в прежнем `docs/pocketbase-server.md` проверка `sha256sum -c` требовалась.
  3. В `compose.yaml` не указано ограничение размера логов Docker (`logging`), из-за чего JSON-логи контейнера могут переполнить диск мини-ПК.
  4. В Debian 13 (`trixie`) `fail2ban` для `sshd` требует `backend = systemd` (так как `/var/log/auth.log` по умолчанию отсутствует), а для работы дефолтного `banaction = nftables` пакет `nftables` должен быть установлен.
- **Предложение по исправлению:**
  1. На мини-ПК отключить энергосбережение Wi-Fi (`iw dev wlp3s0 set power_save off` через hook в `/etc/network/if-up.d/` или `udev`).
  2. В `deploy/pocketbase/Dockerfile` добавить проверку SHA256 архива `pocketbase_0.40.4_linux_amd64.zip`.
  3. В `deploy/pocketbase/compose.yaml` задать `logging: { driver: "json-file", options: { "max-size": "10m", "max-file": "5" } }`, `init: true`, `stop_grace_period: 30s`.
  4. В §4 явно указать для `fail2ban` на Debian 13 проверку наличия пакета `nftables` и `backend = systemd` для jail `sshd`.

---

## 4. Улучшения и рекомендации по соответствию правилам репозитория (`booking-web`)

### У-1. Строгая типизация на границе API (`strict-typing.mdc`) и подключение PocketBase в `booking-web`
- **Проблема / риск:**
  По правилам репозитория (`strict-typing.mdc`):
  - Запрещены невалидируемые касты `as Type` на внешних границах (`localStorage`, HTTP, БД).
  - На границах обязателен парсинг через схемы (`Zod` / `Valibot`) и доменные/брендированные типы для ID.
  Сейчас в `booking-web` (`src/api/auth.ts`, `src/api/listings.ts`, `src/api/index.ts`) используется `JSON.parse(raw) as Session` / `as Listing[]`, а в `package.json` ещё не добавлены `zod` и `pocketbase`.
- **Предложение по исправлению:**
  При подготовке следующего шага (подключение `booking-web` к `https://pb.booking.vallome.ru` и выкладка `website.booking.vallome.ru`):
  1. Добавить `zod` в `package.json` и описать схемы ответов PocketBase (`PbUserSchema`, `PbListingSchema`, `PbBookingSchema`) с трансформацией в доменные типы (`Parse, don't validate`).
  2. Заменить все `JSON.parse(...) as ...` на безопасный парсинг через схему.

---

### У-2. Feature-first архитектура (`feature-architecture.mdc`) и гипермодульность (`hypermodularity.mdc`)
- **Проблема / риск:**
  В `booking-web` часть модулей уже организована по `src/features/{bookings,chat,listings,profile}`, но `src/api/` (`auth.ts` — 271 строка, `listings.ts` — 178 строк) и `src/pages/` живут вне папок фич.
- **Предложение по исправлению:**
  При реализации PocketBase-адаптера не раздувать монолитные файлы в `src/api/`:
  - Базовый клиент PocketBase и общие примитивы фильтрации (`pbFilter` с `{:placeholder}` по аналогии с Flutter-репозиторием) разместить в `src/shared/api/` (или `src/api/` как тонкий фасад композиции).
  - DTO-модели, мапперы (`fromPbRecord` / `toPbFormData`) и репозитории разнести по слоям `data/` соответствующих фич (`src/features/listings/data/`, `src/features/bookings/data/`, `src/features/chat/data/`, `src/features/profile/data/`), соблюдая лимит гипермодульности (1 файл = 1 публичная сущность).

---

### У-3. Сетевой доступ к `pb.booking.vallome.ru` с рабочей станции `fox-pc` (§2, §6)
- **Проблема / риск:**
  В §2 описан split-DNS на роутере на случай отсутствия Hairpin NAT в домашней сети Wi-Fi. Важно учесть, что `fox-pc` также находится в домашней сети: когда агент на `fox-pc` в §5 п. 6 проверяет ответы `8.8.8.8` и `1.1.1.1`, публичные резолверы вернут **белый IP роутера** (даже если на роутере включён split-DNS для локального DNS). Если после этого агент с `fox-pc` выполнит `curl https://pb.booking.vallome.ru/api/health`, системный резолвер `fox-pc` (если он использует `8.8.8.8`/`1.1.1.1` или `systemd-resolved` поверх них, а не DNS роутера) пойдёт на белый IP и упрётся в отсутствие Hairpin NAT!
- **Предложение по исправлению:**
  В §6 явно указать: если роутер не поддерживает Hairpin NAT, для проверки из локальной сети с `fox-pc` (и работы скриптов `ensure_*.py` / `seed_*.py` с `fox-pc`) использовать `--resolve pb.booking.vallome.ru:443:<LAN_IP_МИНИ_ПК>` в `curl` и запись в `/etc/hosts` на `fox-pc` (либо убедиться, что `systemd-resolved` на `fox-pc` использует DNS роутера со split-DNS).
