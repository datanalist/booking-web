# PocketBase на мини-ПК — мультиагентный план

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Снова открыть `https://pb.booking.vallome.ru` с домашнего мини-ПК: PocketBase 0.40.4 в контейнере от uid 1000, схема пустой базы из поставленного `pb_schema.json`, Caddy и fail2ban на хосте, бэкапы по кабелю на `fox-pc`.

**Architecture:** Фаза 1 — три файлово-непересекающихся трека в отдельных git worktree. В каждом треке цикл «исполнитель → ревьюер → исполнитель → снятие worktree». Слияние в `dev-dns_local`, интеграционное ревью, локальный Docker smoke, затем cutover на мини-ПК по §5–§6 спецификации. Фаза 2 — отдельный эпик адаптера `booking-web` и Flutter; в этот выкат не входит.

**Tech Stack:** PocketBase 0.40.4 (JSVM / Goja), Docker Compose, Caddy (systemd, ACME), fail2ban + nftables, Debian 13, SSH/`rsync` по `192.168.50.0/30`. Фаза 2: TypeScript strict, Zod на границе HTTP.

**Спецификация:** [`docs/superpowers/specs/2026-10-18-pocketbase-mini-pc-design.md`](../specs/2026-10-18-pocketbase-mini-pc-design.md). Каталог полей [`docs/pocketbase-schema.md`](../../pocketbase-schema.md) старее этого документа: правила API, новые поля и контракт клиентов берутся из спецификации.

## Статус на 2026-10-19

Фаза 1 публично открыта. Треки A–C, слияние, интеграционное ревью и локальный smoke не переисполнять: они уже в `dev-dns_local` (слияние `68a2ce5`, ревью `39181b8`, правка фильтра fail2ban `fda94af`). Чекбоксы внутри треков ниже оставлены текстом задач.

Сделано на мини-ПК 19 октября:

- Кабель `eno1` = `192.168.50.2/30` без шлюза, маршрут по умолчанию через Wi-Fi, `ping -I wlp3s0 1.1.1.1` проходит. Параметр модуля `iwlwifi power_save=N`. Бинарника `iw` на хосте нет; unit `wifi-powersave-off.service` включён.
- PocketBase в контейнере, uid 1000, health 200 только на `127.0.0.1:8090`. Схема на диске совпадает с репозиторием. Есть `users`, `listings`, `listing_blocks`, `bookings`, поля `guests_forbidden`, `unique_prices`, `cancel_comment`. Суперпользователь в базе есть.
- Keenetic: адрес мини-ПК закреплён, TCP 80 и 443 проброшены на `192.168.1.43`. Порты 22 и 8090 на белый адрес не проброшены.
- A-записи `@`, `www`, `booking`, `pb.booking` в DNS Beget указывают на белый адрес роутера. Это подтвердили серверы имён Beget, `8.8.8.8` и `1.1.1.1`. Наблюдаемый TTL — 600, не 300. MX и TXT не менялись, AAAA нет. Сам адрес в git не записан.
- Caddy `active` и включён в автозапуск. Сертификаты Let's Encrypt на четыре имени, срок до 16 января 2027. `https://pb.booking.vallome.ru/api/health` — 200, `/_/` — 200, `https://booking.vallome.ru/` — заглушка 200, `vallome.ru` и `www` — 301 на `https://booking.vallome.ru/`. У `GET /api/realtime` нет `content-encoding`.
- LTE-проверка пройдена: `request.client_ip` у `/api/health` публичный, не адрес роутера. fail2ban `active` и включён с 01:01:57. Подняты jail `sshd`, `caddy-auth`, `caddy-magic`, `caddy-scan`, `recidive`. В живом `/etc/fail2ban/jail.local` плейсхолдера нет, в `ignoreip` уже стоит `/32` белого адреса. Ошибка сокета в ту же секунду была ранним `fail2ban-client`: сервер к этому моменту ещё не открыл сокет, затем jail стартовали без ошибок.

Осталось, и это ещё Фаза 1:

- Один ручной вход в `https://pb.booking.vallome.ru/_/`. Страница отдаётся, сессию суперпользователя в этой сессии не открывали.
- Таймер `pull-pb-backups` на хосте кабеля `192.168.50.1` не установлен. ZIP в 03:00 пишутся на мини-ПК и сюда сами не приезжают. Файлы юнита лежат в `deploy/minipc/backup/`.
- Запись с `false` в `pets_allowed` и `cancellation_allowed` на живой базе мини-ПК повторно не создавалась. На локальном smoke схема это уже позволяла.

Фаза 2 не начата. Пошаговый план адаптера кабинета и Flutter пишется отдельно, после этих трёх хвостов.

## Global Constraints

- Ветка интеграции: `dev-dns_local`. Имена машин в публичный DNS не входят.
- PocketBase **0.40.4**, архив `linux_amd64`. Чужой образ из реестра не используется. `ENTRYPOINT` образа пустой.
- Порт контейнера на хосте: только `127.0.0.1:8090:8090`. Порты 22 и 8090 на белый IP не пробрасываются.
- Процесс контейнера: `user: "1000:1000"`. Каталоги данных на хосте до первого старта принадлежат `1000:1000`.
- `init: true`, `stop_grace_period: 30s`, логи Docker `json-file` `max-size: 10m`, `max-file: 3`, `restart: unless-stopped`.
- Имя compose-файла в этом плане: `deploy/pocketbase/docker-compose.yml`. В тексте спецификации тот же файл назван `compose.yaml`; все команды плана используют одно имя.
- Хук настроек в JSVM 0.40.x вызывает `e.app.settings()` только после `e.next()`.
- `trustedProxy.headers = ["X-Real-IP"]`, `useLeftmostIP = false`. Клиентский `X-Forwarded-For` к PocketBase не прокидывается.
- Русские значения `select` и статус `pending` остаются в базе. Кабинет переводит их на границе DTO. `hidden: true` не ставится на `email`, `phone`, `balance`, `fcm_token`, `staff_tasks`.
- Календарные даты клиенты пишут как полночь UTC: `YYYY-MM-DD 00:00:00.000Z`.
- В git нет `.env`, `pb_data`, паролей, белого IP. В `ignoreip` адрес пишется как литерал `<WAN_PUBLIC_IP>/32` и подменяется только на мини-ПК.
- Ящик суперпользователя и ACME: `mikefro62@gmail.com`. Пароль новый, в команду и в git не пишется. SMTP, S3 и адрес отправителя этот срез не задаёт и хук настроек их не затирает.
- `ensure_*.py` и `seed_*.py` не запускаются. Коллекция `payouts` не создаётся. Домен `website.booking.vallome.ru` и выкладка `dist/` не входят. Raspberry Pi 5 не входит.
- Один файл хука — одна ответственность, ориентир ≤300 строк (жёсткий потолок 500). Публичные сигнатуры с явными типами там, где язык это позволяет; в JSVM — без стёртых контрактов в комментарии файла.

---

## 0. Оркестратор (до параллельного старта)

Оркестратор не пишет файлы треков. Он готовит базу и разводит worktree.

- [ ] **Step 1: Убедиться, что HEAD — `dev-dns_local` и рабочее дерево чистое относительно уже закоммиченного плана.** Незакоммиченные документы спецификации не смешивать с ветками треков: план и спецификация коммитятся на `dev-dns_local` отдельно, до `git worktree add`, либо остаются незакоммиченными вне каталогов треков. Ветки треков создаются от актуального `dev-dns_local`.

- [ ] **Step 2: Добавить в `.gitignore` изоляцию worktree и данные PocketBase, если строк ещё нет.**

```gitignore
.worktrees/
deploy/pocketbase/pb_data/
deploy/pocketbase/.env
```

Файл `.env.example` в ignore не попадает. Этот коммит делает оркестратор на `dev-dns_local`, не агент трека: `.gitignore` — общий файл, три трека его не правят.

- [ ] **Step 3: Создать три worktree от `dev-dns_local`.**

```bash
git worktree add -b feat/pb-docker-schema .worktrees/pb-docker-schema dev-dns_local
git worktree add -b feat/pb-jsvm-hooks .worktrees/pb-jsvm-hooks dev-dns_local
git worktree add -b feat/minipc-infra .worktrees/minipc-infra dev-dns_local
```

Дальше треки A, B и C идут параллельно. Общих файлов у них нет (матрица в §1).

---

## 1. Архитектура мультиагентной разработки

Параллелизм: три трека Фазы 1 не ждут друг друга. Изолированность: у каждого свой worktree и своя ветка, чужие пути не редактируются. Code review: отдельная модель, отдельный проход, замечания закрывает тот же исполнитель в той же ветке.

| Роль | Модель | Что делает |
| --- | --- | --- |
| Агент-исполнитель | `grok-4.7-high-fast` | Код трека, самопроверка, коммиты в `feat/<track>` |
| Агент-ревьюер | `gemini-4-argon-medium` | Сверка со спецификацией и правилами проекта, файл ревью |

Базовая ветка: `dev-dns_local`.

| Трек | Ветка | Worktree | Каталоги, которые трек имеет право менять |
| --- | --- | --- | --- |
| A | `feat/pb-docker-schema` | `.worktrees/pb-docker-schema` | `deploy/pocketbase/Dockerfile`, `deploy/pocketbase/docker-compose.yml`, `deploy/pocketbase/.env.example`, `deploy/pocketbase/pb_schema.json`, `deploy/pocketbase/pb_migrations/**` |
| B | `feat/pb-jsvm-hooks` | `.worktrees/pb-jsvm-hooks` | только `deploy/pocketbase/pb_hooks/**` |
| C | `feat/minipc-infra` | `.worktrees/minipc-infra` | только `deploy/minipc/**` |

Запрещено всем трём: `.gitignore`, `README.md`, `docs/pocketbase-server.md`, `src/**`, чужой `deploy/**`. Caddyfile живёт в `deploy/minipc/caddy/Caddyfile` (на мини-ПК его копируют в `/etc/caddy/Caddyfile`), чтобы не пересечься с Track A. Имя хука зачистки store в этом плане — `store_cleanup_cron.pb.js`; в §4.8 спецификации тот же хук назван `auth_store_sweep.pb.js`.

### Цикл внутри каждого трека

Рабочий каталог агентов трека — `.worktrees/<track>`. Коммиты только в `feat/<track>`.

1. **Исполнитель (`grok-4.7-high-fast`).** Реализует задачи трека. Самопроверка — команды из раздела трека. Коммит в ветку трека. В сообщение коммита не попадают секреты. Перед коммитом: поиск по диффу на пароли, приватные ключи, живой белый IP, `PB_ADMIN_PASSWORD=` с непустым значением.
2. **Ревьюер (`gemini-4-argon-medium`).** Читает спецификацию и diff ветки `feat/<track>` относительно `dev-dns_local`. Пишет `docs/superpowers/reviews/2026-10-18-review-<track>.md` и коммитит только этот файл (`docs: review <track>`). Код продукта ревьюер не меняет.
3. **Исполнитель (`grok-4.7-high-fast`).** Закрывает замечания в той же ветке, повторяет самопроверку, коммитит `fix: address review <track>`. Файл ревью не переписывает. Если ревьюер явно написал «замечаний нет», шаг фикса — пустой, отдельный пустой коммит не создаётся.
4. **Снятие worktree.** После коммита фиксов, из основного клона (не из каталога worktree):

```bash
git worktree remove .worktrees/<track>
```

Каталог `.worktrees/<track>` удаляется. Ветка `feat/<track>` остаётся и готова к merge в `dev-dns_local`.

### Чеклист ревьюера (каждый трек)

Ревьюер отвечает по пунктам «да / нет + файл»:

- Покрытие задач трека против спецификации (разделы, перечисленные в треке).
- Feature-first: новый код лежит в каталоге своей поставки (`deploy/pocketbase` или `deploy/minipc`), без расползания по `src/`.
- Гипермодульность: один файл — одна ответственность; хук ≤300 строк, либо в шапке одна причина, почему длиннее.
- Строгая типизация: на границе JSON схемы нет «сырого доверия» без проверки полей; в Фазе 2 (когда дойдёт) — Zod, без `as` на HTTP.
- Секреты: в diff нет пароля, `pb_data`, живого WAN IP, `.env` (кроме `.env.example` с пустым паролем).
- Расхождение с матрицей файлов трека: любая правка вне своих путей — блокер.

Имена файлов ревью:

- `docs/superpowers/reviews/2026-10-18-review-pb-docker-schema.md`
- `docs/superpowers/reviews/2026-10-18-review-pb-jsvm-hooks.md`
- `docs/superpowers/reviews/2026-10-18-review-minipc-infra.md`

---

## 2. Фаза 1 — три параллельных трека

### Track A — `feat/pb-docker-schema`

Worktree: `.worktrees/pb-docker-schema`. Источник схемы: `/home/mk/Projects/Booking/pb_schema.json` (читается, в тот репозиторий ничего не пишется).

#### Task A1: Образ PocketBase 0.40.4

**Files:**
- Create: `deploy/pocketbase/Dockerfile`

**Interfaces:**
- Consumes: релиз GitHub `v0.40.4`, файлы `pocketbase_0.40.4_linux_amd64.zip` и `checksums.txt` одного URL-префикса.
- Produces: образ с бинарником `/pb/pocketbase`, пустым `ENTRYPOINT`, `CMD` из спецификации §4.

- [ ] **Step 1: Написать Dockerfile.** Пустой `ENTRYPOINT` обязателен: `docker compose run pocketbase /pb/pocketbase …` должен подставить бинарник сам.

```dockerfile
FROM alpine:3.22

ARG PB_VERSION=0.40.4

RUN apk add --no-cache ca-certificates unzip wget \
  && wget -q -O /tmp/pb.zip "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip" \
  && wget -q -O /tmp/checksums.txt "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/checksums.txt" \
  && grep "pocketbase_${PB_VERSION}_linux_amd64.zip" /tmp/checksums.txt > /tmp/pb.sha256 \
  && (cd /tmp && sha256sum -c /tmp/pb.sha256) \
  && unzip /tmp/pb.zip -d /pb \
  && chmod +x /pb/pocketbase \
  && rm /tmp/pb.zip /tmp/checksums.txt /tmp/pb.sha256

EXPOSE 8090

ENTRYPOINT []
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/pb/pb_data", "--hooksDir=/pb/pb_hooks", "--migrationsDir=/pb/pb_migrations"]
```

Хеш в репозиторий не вшивается: проверка — `sha256sum -c` по строке архива из `checksums.txt` того же релиза, до `unzip`.

- [ ] **Step 2: Собрать образ из worktree.**

```bash
docker build -f deploy/pocketbase/Dockerfile deploy/pocketbase
```

Ожидание: сборка доходит до `sha256sum -c` и печатает `OK`, затем завершается успешно. Чужой `FROM` из Docker Hub с уже лежащим PocketBase не используется.

#### Task A2: Compose

**Files:**
- Create: `deploy/pocketbase/docker-compose.yml`

**Interfaces:**
- Consumes: образ из Task A1; каталоги `./pb_hooks`, `./pb_migrations`, файл `./pb_schema.json` (хуки физически появляются после merge с Track B; до merge каталог можно создать пустым только для локальной сборки и не коммитить пустышку, если её нет в задачах).
- Produces: сервис `pocketbase`, порт только на loopback, тома данных и поставки.

- [ ] **Step 1: Написать compose.**

```yaml
services:
  pocketbase:
    build: .
    restart: unless-stopped
    user: "1000:1000"
    init: true
    stop_grace_period: 30s
    ports:
      - "127.0.0.1:8090:8090"
    command:
      - /pb/pocketbase
      - serve
      - --http=0.0.0.0:8090
      - --dir=/pb/pb_data
      - --hooksDir=/pb/pb_hooks
      - --migrationsDir=/pb/pb_migrations
    volumes:
      - ${PB_DATA_DIR:-./pb_data}:/pb/pb_data
      - ./pb_hooks:/pb/pb_hooks:ro
      - ./pb_migrations:/pb/pb_migrations:ro
      - ./pb_schema.json:/pb/pb_schema.json:ro
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

На мини-ПК `PB_DATA_DIR=/opt/pocketbase/pb_data`. `.env` в образ и в контейнер не монтируется. `command` повторяет `CMD`, чтобы пустой `ENTRYPOINT` и `compose run /pb/pocketbase …` оставались согласованными.

- [ ] **Step 2: Проверить конфиг.**

```bash
docker compose -f deploy/pocketbase/docker-compose.yml config
```

Ожидание: в выводе есть `127.0.0.1:8090:8090`, `user: "1000:1000"`, `init: true`, `stop_grace_period: 30s`. Строки `0.0.0.0:8090` в публикации порта нет.

#### Task A3: Шаблон окружения

**Files:**
- Create: `deploy/pocketbase/.env.example`

**Interfaces:**
- Consumes: §4.1 (суперпользователь создаётся из `/opt/pocketbase/.env`, `chmod 600`).
- Produces: имена переменных `PB_ADMIN_EMAIL`, `PB_ADMIN_PASSWORD`, `PB_DATA_DIR` без пароля.

- [ ] **Step 1: Записать шаблон.**

```bash
# Копируется на мини-ПК в /opt/pocketbase/.env и получает chmod 600.
# Пароль в git не пишется. Белый IP сюда не кладётся.
PB_ADMIN_EMAIL=mikefro62@gmail.com
PB_ADMIN_PASSWORD=
PB_DATA_DIR=/opt/pocketbase/pb_data
```

- [ ] **Step 2: Убедиться, что `deploy/pocketbase/.env` не появляется в `git status`.**

#### Task A4: Исправленная схема

**Files:**
- Create: `deploy/pocketbase/pb_schema.json`

**Interfaces:**
- Consumes: дамп `/home/mk/Projects/Booking/pb_schema.json`.
- Produces: JSON, который миграция A5 импортирует в режиме extend/merge. Правила — §4.7. Поля — §4.5.

- [ ] **Step 1: Скопировать дамп в `deploy/pocketbase/pb_schema.json` и применить правки ниже.** Сырой дамп не коммитится под тем же именем без этих правок.

Правки полей `listings`:

| Поле | Итог |
| --- | --- |
| `pets_allowed`, `cancellation_allowed` | bool, `required: false` |
| `photos` | file, `required: false` |
| `price_14`, `price_28` | number, `required: false` |
| `title`, `address`, `city`, `description` | text, `required: false` |
| `max_guests`, `price_night` | number, `required: false` |
| `check_in_time`, `check_out_time` | text, `required: false` |
| `guests_forbidden` | новое, bool, `required: false` |
| `unique_prices` | новое, json, `required: false` |

В `bookings` добавить `cancel_comment`: text, `required: false`, `max` 500. Select `cancel_reason` сохраняет коды `guest`, `host`, `host_timeout`, `prepay_timeout`.

`hidden: true` снять или не ставить на `email`, `phone`, `balance`, `fcm_token`, `staff_tasks`.

Правила записать дословно.

`users`:

```text
listRule   = id = @request.auth.id
viewRule   = ""
createRule = null
deleteRule = id = @request.auth.id
updateRule =
  id = @request.auth.id &&
  (@request.body.account_status:isset = false || @request.body.account_status = account_status) &&
  (@request.body.verified_host:isset = false || @request.body.verified_host = verified_host) &&
  (@request.body.balance:isset = false || @request.body.balance = balance) &&
  (@request.body.rating:isset = false || @request.body.rating = rating) &&
  (@request.body.reviews_count:isset = false || @request.body.reviews_count = reviews_count) &&
  (@request.body.years_hosting:isset = false || @request.body.years_hosting = years_hosting) &&
  (@request.body.staff_tasks:isset = false || @request.body.staff_tasks = staff_tasks) &&
  (@request.body.roles:isset = false || @request.body.roles = roles)
```

`listings`:

```text
listRule = status = "published" || (@request.auth.id != "" && host = @request.auth.id)
viewRule = status = "published" || (@request.auth.id != "" && host = @request.auth.id)
deleteRule = @request.auth.id != "" && host = @request.auth.id
createRule =
  @request.auth.id != "" &&
  @request.body.host = @request.auth.id &&
  (@request.body.status = "draft" || @request.body.status = "pending") &&
  @request.body.rating:isset = false &&
  @request.body.reviews_count:isset = false &&
  @request.body.reject_reason:isset = false
updateRule =
  @request.auth.id != "" &&
  host = @request.auth.id &&
  (@request.body.host:isset = false || @request.body.host = host) &&
  (@request.body.status:isset = false || @request.body.status = "draft" || @request.body.status = "pending" || @request.body.status = "archived") &&
  (@request.body.rating:isset = false || @request.body.rating = rating) &&
  (@request.body.reviews_count:isset = false || @request.body.reviews_count = reviews_count) &&
  (@request.body.reject_reason:isset = false || @request.body.reject_reason = reject_reason)
```

`bookings`:

```text
listRule = @request.auth.id != "" && (guest = @request.auth.id || host = @request.auth.id)
viewRule = @request.auth.id != "" && (guest = @request.auth.id || host = @request.auth.id)
deleteRule = null
createRule =
  @request.auth.id != "" &&
  @request.body.guest = @request.auth.id &&
  @request.body.host = @request.body.listing.host &&
  @request.body.guest != @request.body.host &&
  @request.body.status = "pending_host"
updateRule =
  @request.auth.id != "" &&
  (guest = @request.auth.id || host = @request.auth.id) &&
  (@request.body.guest:isset = false || @request.body.guest = guest) &&
  (@request.body.host:isset = false || @request.body.host = host) &&
  (@request.body.listing:isset = false || @request.body.listing = listing) &&
  (@request.body.prepaid_at:isset = false || @request.body.prepaid_at = prepaid_at) &&
  (@request.body.total:isset = false || @request.body.total = total) &&
  (@request.body.prepay:isset = false || @request.body.prepay = prepay) &&
  (@request.body.remainder:isset = false || @request.body.remainder = remainder) &&
  (@request.body.commission:isset = false || @request.body.commission = commission) &&
  (@request.body.host_amount:isset = false || @request.body.host_amount = host_amount)
```

Если `listing_blocks` уже попадёт в JSON, её правила — как в Task A5, и миграция коллекцию не дублирует. Если поля в дампе нет, коллекцию создаёт миграция, не ручной JSON «с нуля на все 8 коллекций».

- [ ] **Step 2: Проверить JSON и инварианты.**

```bash
jq -e '
  def field($c; $n): .[] | select(.name == $c) | .fields[] | select(.name == $n);
  (field("listings"; "pets_allowed").required == false) and
  (field("listings"; "cancellation_allowed").required == false) and
  (field("listings"; "photos").required == false) and
  (field("listings"; "price_14").required == false) and
  (field("listings"; "price_28").required == false) and
  (field("listings"; "guests_forbidden").required == false) and
  (field("listings"; "unique_prices").type == "json") and
  (field("bookings"; "cancel_comment").required == false)
' deploy/pocketbase/pb_schema.json
```

Ожидание: `true`. Дополнительно `jq` по `users`, `listings`, `bookings`: в `updateRule` есть подстрока `:isset = false`; `users.createRule` — JSON `null`.

#### Task A5: Идемпотентная миграция

**Files:**
- Create: `deploy/pocketbase/pb_migrations/1729200000_import_schema.js`

**Interfaces:**
- Consumes: `/pb/pb_schema.json` (монтирование из A2), правила `listing_blocks` из §4.7.
- Produces: импорт коллекций дампа плюс коллекция `listing_blocks` (relation `listing` → `listings` required, `start` date required, `end` date required, индекс `(listing, start)`). Повторный запуск не удаляет строки и не плодит коллекцию.

- [ ] **Step 1: Написать миграцию.** Второй аргумент `importCollectionsByMarshaledJSON` — `false` (extend/merge). Down-функция данные и коллекции не сносит.

```js
migrate((app) => {
  const raw = toString($os.readFile("/pb/pb_schema.json"))
  app.importCollectionsByMarshaledJSON(raw, false)

  let blocks = null
  try {
    blocks = app.findCollectionByNameOrId("listing_blocks")
  } catch (_) {
    blocks = null
  }
  if (blocks) {
    return
  }

  const listings = app.findCollectionByNameOrId("listings")
  const collection = new Collection({
    name: "listing_blocks",
    type: "base",
    listRule: '@request.auth.id != "" && listing.host = @request.auth.id',
    viewRule: '@request.auth.id != "" && listing.host = @request.auth.id',
    createRule: '@request.auth.id != "" && @request.body.listing.host = @request.auth.id',
    updateRule:
      '@request.auth.id != "" && listing.host = @request.auth.id && (@request.body.listing:isset = false || @request.body.listing = listing)',
    deleteRule: '@request.auth.id != "" && listing.host = @request.auth.id',
    fields: [
      { name: "listing", type: "relation", required: true, collectionId: listings.id, maxSelect: 1, cascadeDelete: false },
      { name: "start", type: "date", required: true },
      { name: "end", type: "date", required: true },
    ],
    indexes: [
      "CREATE INDEX idx_listing_blocks_listing_start ON listing_blocks (listing, start)",
    ],
  })
  app.save(collection)
}, (app) => {
  // данные и коллекции вниз не сносятся
})
```

Сигнатуру `new Collection` исполнитель сверяет с JSVM 0.40.4 в момент реализации (имя класса и поля индекса). Контракт полей и правил не меняется. Если API конструктора другой — правка только способа создания, не состава полей.

- [ ] **Step 2: Коммит трека** после самопроверки A1–A5 (сборка образа + `jq` + `docker compose config`). Сообщение вроде `feat: add PocketBase image, schema, and import migration`.

---

### Track B — `feat/pb-jsvm-hooks`

Worktree: `.worktrees/pb-jsvm-hooks`. Исходники для хуков «без смены контракта»: `/home/mk/Projects/Booking/pb_hooks/`. На диск кладётся исправленная копия, не слепок как есть. Каждый файл — одна ответственность. В шапке файла одна фраза, зачем он меняется.

Общий контракт дат для хуков занятости: полночь UTC `YYYY-MM-DD 00:00:00.000Z`.

Занимающие статусы (`OCCUPYING`): `pending_host`, `awaiting_prepayment`, `confirmed`, `change_requested`. Не занимают и проверку пересечения пропускают: `cancelled`, `completed`, `cancel_requested`.

#### Task B1: `00_settings.pb.js`

**Files:**
- Create: `deploy/pocketbase/pb_hooks/00_settings.pb.js`

**Interfaces:**
- Produces: настройки §4.4 после инициализации базы. SMTP/S3/отправитель не записываются этим хуком.

- [ ] **Step 1: Хук.** Порядок правил rate limit сохраняется: первое совпадение побеждает, отдельные `POST /api/vallome/…` стоят выше общего `/api/`.

```js
onBootstrap((e) => {
  e.next()

  const settings = e.app.settings()
  settings.meta.appName = "vallome.booking"
  settings.meta.appURL = "https://pb.booking.vallome.ru"

  settings.trustedProxy.headers = ["X-Real-IP"]
  settings.trustedProxy.useLeftmostIP = false

  settings.rateLimits.enabled = true
  settings.rateLimits.rules = [
    { label: "*:auth", audience: "", duration: 60, maxRequests: 20 },
    { label: "*:create", audience: "", duration: 5, maxRequests: 20 },
    { label: "POST /api/vallome/magic-request", audience: "", duration: 600, maxRequests: 5 },
    { label: "POST /api/vallome/magic-auth", audience: "", duration: 60, maxRequests: 10 },
    { label: "GET /api/vallome/magic-auth", audience: "", duration: 60, maxRequests: 10 },
    { label: "GET /api/vallome/magic-wait", audience: "", duration: 60, maxRequests: 40 },
    { label: "POST /api/vallome/change-email", audience: "", duration: 3600, maxRequests: 5 },
    { label: "/api/batch", audience: "", duration: 1, maxRequests: 3 },
    { label: "/api/", audience: "", duration: 10, maxRequests: 300 },
  ]

  settings.backups.cron = "0 3 * * *"
  settings.backups.cronMaxKeep = 7

  settings.logs.maxDays = 7
  settings.logs.logIP = true
  settings.logs.logAuthId = true

  e.app.save(settings)
})
```

Вызова `e.app.settings()` до `e.next()` в файле нет.

#### Task B2: Пересечение броней

**Files:**
- Create: `deploy/pocketbase/pb_hooks/bookings_overlap.pb.js`

**Interfaces:**
- Consumes: коллекция `listing_blocks` (её создаёт миграция Track A; хук только читает).
- Produces: `onRecordCreateRequest` и `onRecordUpdateRequest` на коллекции `bookings`.

- [ ] **Step 1: Обёртка транзакции.** Внутри колбэка читать `txApp`, не `$app`. `e.app` после хука вернуть. Пересечение броней и `listing_blocks` (`start`/`end` против `check_in`/`check_out` и против `requested_*`, если заданы) — только через `txApp.findRecordsByFilter`. Пересечение — `BadRequestError`. Статус вне `OCCUPYING` — сразу `e.next()` и возврат, иначе отмена и cron таймаута получают «жильё уже занято».

```js
onRecordCreateRequest((e) => {
  const originalApp = e.app
  const record = e.record
  if (!record || OCCUPYING.indexOf(String(record.get("status") || "").trim()) === -1) {
    e.next()
    return
  }
  try {
    originalApp.runInTransaction((txApp) => {
      e.app = txApp
      e.next()
    })
  } finally {
    e.app = originalApp
  }
}, "bookings")
```

Та же обёртка на `onRecordUpdateRequest`. Поиск блокировок и чужих броней исполнитель переносит из `Booking/pb_hooks/bookings_overlap.pb.js`, заменяя `$app` на `txApp` и добавляя фильтр `listing_blocks`.

#### Task B3: Матрица статусов

**Files:**
- Create: `deploy/pocketbase/pb_hooks/bookings_status.pb.js`

**Interfaces:**
- Consumes: таблица §4.7. Запрос суперпользователя хук пропускает.
- Produces: отказ `400` на переход вне таблицы. Гость не ставит `confirmed` и не пишет `prepaid_at`.

| Кто | Из | В | Рядом |
| --- | --- | --- | --- |
| гость | `pending_host`, `awaiting_prepayment`, `confirmed`, `change_requested` | `cancelled` | `cancel_reason = guest`; `cancel_comment` по желанию |
| гость | `pending_host`, `awaiting_prepayment`, `confirmed` | `change_requested` | `requested_check_in` / `requested_check_out` |
| хозяин | `pending_host` | `awaiting_prepayment` | выставляет `prepay_until` |
| хозяин | `pending_host`, `awaiting_prepayment`, `confirmed`, `change_requested` | `cancelled` | `cancel_reason = host`; текст — в `cancel_comment` |
| cron | `pending_host` | `cancelled` | `cancel_reason = host_timeout` |
| cron | `awaiting_prepayment` | `cancelled` | `cancel_reason = prepay_timeout` |
| суперпользователь | любой | `confirmed`, `completed`, запись `prepaid_at` | оплата из админки |

- [ ] **Step 1: Реализовать матрицу отдельными функциями «кто / из / в», без второй ответственности в этом файле.** Cron пишет запись приложением, не токеном гостя; этот хук такой переход принимает только если причина `host_timeout` или `prepay_timeout` и автор — не клиентский токен (суперпользователь или отсутствие auth при вызове из cron — как принято в исходном хуке Booking, с явной веткой).

#### Task B4: Cron просрочки

**Files:**
- Create: `deploy/pocketbase/pb_hooks/bookings_expiry_cron.pb.js`

- [ ] **Step 1: Расписание `*/5 * * * *`.** Сравнение «меньше либо равно сейчас». Сохранение через приложение cron.

```js
cronAdd("expireStaleBookings", "*/5 * * * *", () => {
  // pending_host && host_respond_until <= now → cancelled, cancel_reason = host_timeout
  // awaiting_prepayment && prepay_until <= now → cancelled, cancel_reason = prepay_timeout
})
```

Исполнитель дописывает выборку и `save`. Имя cron — `expireStaleBookings`. Хук пересечений такой `cancelled` пропускает (Task B2).

#### Task B5: Страж публикации

**Files:**
- Create: `deploy/pocketbase/pb_hooks/listings_publish_guard.pb.js`

- [ ] **Step 1: На create и update `listings`.** Если итоговый `status` — `pending` или `published`, иначе пропуск (черновик и архив проходят с пустыми фото и `false` в bool). Проверка: непустые `title`, `address`, `city`, `description`, `check_in_time`, `check_out_time`; `max_guests >= 1`; `price_night > 0`; `photos.length >= 6`. Иначе `400`. `price_14` и `price_28` не проверять. `housing_type` остаётся одним из `Квартира`, `Дом`, `Комната`, `Отель`.

#### Task B6: Magic-link и зачистка store

**Files:**
- Create: `deploy/pocketbase/pb_hooks/magic_link.pb.js`
- Create: `deploy/pocketbase/pb_hooks/store_cleanup_cron.pb.js`
- Modify-by-copy: `deploy/pocketbase/pb_hooks/change_email.pb.js` (ключи в индекс зачистки)

**Interfaces:**
- `POST /api/vallome/magic-request` → `{ ok: true, waitToken }`. Поля `otpId` в этом JSON нет.
- `waitToken` = `$security.randomString(32)`. Код в ссылке письма — тоже `$security.randomString(32)`. Сравнение кода — `$security.equal`.
- Store `vallome_mcode_<otpId>`: email, код, `expires`, `waitToken`, `attempts`. После 5 неверных попыток ключ удаляется, ответ `403`; неверный код до лимита — `400`. Истёкший ключ удаляется. Верный код пишет сессию в `magicWait:<waitToken>` и удаляет `vallome_mcode_*`.
- `GET /api/vallome/magic-wait` опрашивается `waitToken`.
- Запасной замок `POST /api/vallome/magic-auth`: если клиент прислал `otpId`, вместе с `code` обязателен тот же `waitToken`. Одного `otpId` недостаточно.
- `GET /api/vallome/magic-auth` остаётся ссылкой из письма (`id` + `code`) — единственное место, где `otpId` уходит наружу, и только на почту.
- Индекс ключей: JSON `vallome_store_index`, его дописывают `magic_link.pb.js` и `change_email.pb.js`.

- [ ] **Step 1: Собрать `magic_link.pb.js` из `Booking/pb_hooks/magic_link.pb.js` с контрактом выше.** `otpId` не сериализуется в ответ `magic-request`.

- [ ] **Step 2: `store_cleanup_cron.pb.js`.** `$app.store()` список ключей не отдаёт. Cron `sweepAuthStore` с расписанием `*/10 * * * *` удаляет записи индекса с `expires` в прошлом и вычёркивает их. Префиксы: `vallome_mcode_*`, `magicWait:*`, `emailChange:*`, `emailChangeUser:*`. Рестарт по-прежнему стирает store целиком; cron лечит только ключи, к которым больше никто не обратился.

#### Task B7: Остальные хуки из `Booking/pb_hooks`

**Files:**
- Create: `deploy/pocketbase/pb_hooks/chats_sync_listing_host.pb.js`
- Create: `deploy/pocketbase/pb_hooks/chats_messages.pb.js`
- Create: `deploy/pocketbase/pb_hooks/occupied_listings.pb.js`
- Create: `deploy/pocketbase/pb_hooks/otp_signup.pb.js`
- Create: `deploy/pocketbase/pb_hooks/change_email.pb.js` (если ещё не создан в B6)

- [ ] **Step 1: `chats_sync_listing_host.pb.js`.** Удалить условие `e.collection?.name !== "listings"`. У `RecordEvent` в JSVM нет `e.collection`, из-за этого хук не делает ничего. Фильтр коллекции — второй аргумент `onRecordAfterUpdateSuccess(..., "listings")`. Остаётся `if (!record) return` и смена хозяина чатов.

- [ ] **Step 2: `occupied_listings.pb.js`.** В `findRecordsByFilter` уходит фильтр занимающих статусов и `check_out >= {:checkIn}` с привязкой `{:placeholder}`, по индексу `idx_bookings_status`. Полная выгрузка `id != ''` удаляется. Даты — полночь UTC.

- [ ] **Step 3: `chats_messages.pb.js` и `otp_signup.pb.js`.** Контракт Booking сохраняется. `otp_signup` не включает `emailVisibility`. `change_email.pb.js` дописывает свои ключи в `vallome_store_index`.

- [ ] **Step 4: Самопроверка и коммит.**

```bash
# сломанного обхода коллекции больше нет
! grep -R "e.collection" deploy/pocketbase/pb_hooks/chats_sync_listing_host.pb.js
# настройки только после next
grep -n "e.next()" deploy/pocketbase/pb_hooks/00_settings.pb.js | head -1
# ответ magic-request не содержит otpId как поле JSON-успеха — ревьюер читает файл
wc -l deploy/pocketbase/pb_hooks/*.pb.js
```

Ожидание: каждый файл < 300 строк, либо в шапке названа единая причина. Коммит: `feat: add PocketBase JSVM hooks`.

Компиляцию Goja этот трек сам не доказывает: бинарник собирает Track A. Доказательство — smoke Фазы интеграции. До merge самопроверка — статический grep и чтение.

---

### Track C — `feat/minipc-infra`

Worktree: `.worktrees/minipc-infra`. Всё под `deploy/minipc/`. На мини-ПК эти файлы раскладываются в `/etc` скриптом cutover; в репозитории они не притворяются уже установленными в `/etc`.

#### Task C1: Caddy

**Files:**
- Create: `deploy/minipc/caddy/Caddyfile`

**Interfaces:**
- Consumes: upstream `127.0.0.1:8090` (контейнер Track A).
- Produces: сайты `pb.booking.vallome.ru`, `booking.vallome.ru`, редирект `vallome.ru` / `www.vallome.ru`. ACME-ящик `mikefro62@gmail.com` задаётся в конфиге Caddy (`email`), не в git-секрете.

- [ ] **Step 1: Caddyfile.** SSE не сжимается. `flush_interval -1`. `read_timeout 360s`. `header_up X-Real-IP {client_ip}`. Тело `max_size 32MB`. Лог JSON в `/var/log/caddy/access.log`, ротация 20 МБ × 7, в записи есть `request.client_ip`.

```caddyfile
{
	email mikefro62@gmail.com
}

pb.booking.vallome.ru {
	log {
		output file /var/log/caddy/access.log {
			roll_size 20MiB
			roll_keep 7
		}
		format json
	}

	request_body {
		max_size 32MB
	}

	@not_sse {
		not path /api/realtime*
	}
	encode @not_sse zstd gzip

	reverse_proxy 127.0.0.1:8090 {
		header_up X-Real-IP {client_ip}
		header_up X-Forwarded-Proto {scheme}
		flush_interval -1
		transport http {
			read_timeout 360s
		}
	}
}

booking.vallome.ru {
	root * /var/www/booking
	file_server
}

vallome.ru, www.vallome.ru {
	redir https://booking.vallome.ru{uri} permanent
}
```

`header_up X-Forwarded-For` в этом блоке нет.

- [ ] **Step 2: Если на машине исполнителя есть `caddy`, выполнить `caddy validate --config deploy/minipc/caddy/Caddyfile`.** Если бинарника нет — в коммите это явно сказано в сообщении самопроверки ревьюеру; валидация становится блокером интеграционного smoke, не молчаливым пропуском.

#### Task C2: fail2ban

**Files:**
- Create: `deploy/minipc/fail2ban/jail.local`
- Create: `deploy/minipc/fail2ban/filter.d/caddy-auth.conf`
- Create: `deploy/minipc/fail2ban/filter.d/caddy-magic.conf`
- Create: `deploy/minipc/fail2ban/filter.d/caddy-scan.conf`

**Interfaces:**
- Jail включается только после LTE-проверки §4.3. В git остаётся литерал `<WAN_PUBLIC_IP>/32`.

- [ ] **Step 1: `jail.local`.** `backend = systemd` стоит у `[sshd]`, потому что в Debian 13 нет `/var/log/auth.log`. Jail Caddy читают файл `/var/log/caddy/access.log` (файловый backend). Общий `backend = systemd` в `[DEFAULT]` ломает файловые jail и сюда не копируется.

```ini
[DEFAULT]
ignoreip = 127.0.0.0/8 ::1 192.168.50.0/24 192.168.1.0/24 <WAN_PUBLIC_IP>/32
banaction = nftables

[sshd]
enabled = true
backend = systemd
mode = extra
maxretry = 4
findtime = 10m
bantime = 1h
bantime.increment = true
bantime.maxtime = 1w

[caddy-auth]
enabled = true
port = http,https
filter = caddy-auth
logpath = /var/log/caddy/access.log
maxretry = 5
findtime = 10m
bantime = 1h

[caddy-magic]
enabled = true
port = http,https
filter = caddy-magic
logpath = /var/log/caddy/access.log
maxretry = 5
findtime = 10m
bantime = 1h

[caddy-scan]
enabled = true
port = http,https
filter = caddy-scan
logpath = /var/log/caddy/access.log
maxretry = 6
findtime = 10m
bantime = 12h

[recidive]
enabled = true
maxretry = 3
findtime = 1d
bantime = 1w
```

`192.168.1.0/24` — Wi-Fi роутера. `192.168.50.0/24` шире рабочей `/30`, чтобы старый адрес на время переключения кабеля не попал под бан. `<WAN_PUBLIC_IP>/32` закрывает Hairpin NAT и на мини-ПК заменяется вычисленным адресом; результат замены в git не коммитится.

- [ ] **Step 2: Фильтры под одну строку JSON access-лога.** Порядок полей в образце Caddy: `client_ip` внутри `request`, затем `uri`, затем соседний `status`.

`caddy-auth.conf` — статусы 400/401/403 на:

- `/api/collections/*/auth-with-password`
- `/api/collections/*/auth-with-otp`
- `/api/collections/*/request-otp`
- `/api/vallome/magic-auth`
- `/api/vallome/change-email`

`caddy-magic.conf` — `POST` и статусы 400/401/403/429 только на `/api/vallome/magic-request`.

`caddy-scan.conf` — 401/403 на `/api/collections/_superusers` и пути сканеров `/.env`, `/.git`, `/wp-login.php`, `/wp-admin`, `/phpmyadmin`, `/admin.php`, `/.aws`. Плюс дословно:

```text
ignoreregex = ^.*"uri":"\/\.well-known\/.*$
```

- [ ] **Step 3: Прогнать `fail2ban-regex` на трёх синтетических строках** (совпадение auth, совпадение scan, игнорирование `/.well-known/acme-challenge`). Если утилиты нет локально — приложить строки в коммите и прогнать на интеграционной машине, где пакет есть.

#### Task C3: Сеть `/30` и Wi-Fi

**Files:**
- Create: `deploy/minipc/network/iwlwifi-powersave.conf`
- Create: `deploy/minipc/network/wlp3s0.interfaces.snippet`
- Create: `deploy/minipc/network/eno1.interfaces`
- Create: `deploy/minipc/network/wifi-powersave-off.service`
- Create: `deploy/minipc/network/switch-eno1-to-30.sh`

**Interfaces:**
- Хосты: `192.168.50.1/30` (`fox-pc`) и `192.168.50.2/30` (мини-ПК, `eno1`). Адрес `192.168.50.100` не используется. Шлюза на `eno1` нет.

- [ ] **Step 1: Конфиги энергосбережения.**

`iwlwifi-powersave.conf` (ставится в `/etc/modprobe.d/`):

```text
options iwlwifi power_save=0
options iwlmvm power_scheme=1
```

В сниппет `wlp3s0` добавить строку `post-up /usr/sbin/iw dev wlp3s0 set power_save off`.

`wifi-powersave-off.service`: `Type=oneshot`, `After=network-online.target`, `WantedBy=multi-user.target`, `ExecStart=/usr/sbin/iw dev wlp3s0 set power_save off`.

`eno1.interfaces` — итог после переключения:

```text
allow-hotplug eno1
iface eno1 inet static
    address 192.168.50.2/30
```

- [ ] **Step 2: `switch-eno1-to-30.sh` с аргументом `mini` или `fox`.** Скрипт не делает один `ifdown`. Режим `mini` по порядку §3.2: отказ, если нет ответа `ping -I wlp3s0 1.1.1.1`; `iw dev wlp3s0 set power_save off`; `ip addr add 192.168.50.2/30 dev eno1` рядом со старым адресом, без шлюза; ожидание подтверждения, что SSH с `fox-pc` на `.2` жив; только потом удаление старого адреса и запись `iface eno1 inet static`. Режим `fox`: поднять `192.168.50.1/30`, и только после живого SSH на `.2` напомнить оператору `sudo scripts/pxe.sh stop` в репозитории `pxe-minipc` и удалить default route через `eno1`, если он появился. DHCP `fox-pc` на кабеле после этого не остаётся включённым.

- [ ] **Step 3: `bash -n deploy/minipc/network/switch-eno1-to-30.sh`.**

#### Task C4: Стягивание бэкапов на fox-pc

**Files:**
- Create: `deploy/minipc/backup/pull-pb-backups.sh`
- Create: `deploy/minipc/backup/pull-pb-backups.service`
- Create: `deploy/minipc/backup/pull-pb-backups.timer`

**Interfaces:**
- Источник: ZIP в `/opt/pocketbase/pb_data/backups/` на `192.168.50.2` (их пишет cron PocketBase `0 3 * * *`, хранение на мини-ПК — 7). На `fox-pc` хранится 14 последних ZIP. Живой `data.db` / `data.db-wal` скрипт не копирует.

- [ ] **Step 1: Скрипт.** `rsync` по SSH только `*.zip` с `mk@192.168.50.2:/opt/pocketbase/pb_data/backups/`. После синхронизации оставить 14 новейших файлов в каталоге назначения на `fox-pc`, остальные ZIP удалить. Каталог назначения — аргумент или переменная `PB_BACKUP_DEST`, значение по умолчанию вне репозитория (`/var/backups/pocketbase`).

- [ ] **Step 2: Таймер** `OnCalendar=*-*-* 04:00:00` (после 03:00 на мини-ПК), `Persistent=true`. Юнит запускает скрипт от пользователя, у которого уже есть SSH-ключ на мини-ПК по кабелю. Ключ в репозиторий не кладётся.

- [ ] **Step 3: `bash -n` и коммит трека** `feat: add mini-PC Caddy, fail2ban, and backup pull`.

---

## 3. Фаза интеграции, smoke и cutover

Начинается, когда все три ветки прошли цикл ревью и worktree сняты (`git worktree list` не показывает `.worktrees/pb-*` и `.worktrees/minipc-infra`).

### Task I1: Слияние

- [x] **Step 1: Влить в `dev-dns_local` последовательно** (пересечения файлов нет, порядок фиксирует историю): `feat/pb-docker-schema`, затем `feat/pb-jsvm-hooks`, затем `feat/minipc-infra`. Сделано коммитом `68a2ce5`.

```bash
git checkout dev-dns_local
git merge --no-ff feat/pb-docker-schema
git merge --no-ff feat/pb-jsvm-hooks
git merge --no-ff feat/minipc-infra
```

- [x] **Step 2: Обновить описание хоста и `README.md`.** Отдельный `docs/pocketbase-server.md` со старыми адресами VPS в репозиторий не кладётся. Хост описан спецификацией и разделом README «Поставка мини-ПК». Секреты остаются в `/opt/pocketbase/.env` (`600`) и в локальном `.secrets/` (каталог в `.gitignore`).

### Task I2: Интеграционный ревьюер

- [x] **Step 1: Агент `gemini-4-argon-medium` читает слитый `dev-dns_local` против спецификации целиком** (не только diff одного трека). Отчёт: [`docs/superpowers/reviews/2026-10-18-integration-review.md`](../reviews/2026-10-18-integration-review.md), вердикт `APPROVED`. Блокеры: дыра в API Rules, хук до `e.next()`, порт не на `127.0.0.1`, секрет в git, файл хука с двумя ответственностями, Caddy прокидывает клиентский `X-Forwarded-For`.

- [x] **Step 2: Исполнитель закрывает блокеры коммитом на `dev-dns_local`.** Отдельных блокеров ревью не оставило. Поздняя правка разбора времени Caddy — `fda94af`, на базе, не в старых ветках треков.

### Task I3: Локальный Docker smoke

- [x] **Step 1: Каталог данных с владельцем 1000 и пустой `pb_hooks` не подменять чужим `pb_data`.** Временный контейнер `pb-smoke-test` из интеграционного ревью остановлен, каталоги `/tmp/pb_smoke_data.*` удалены.

```bash
mkdir -p deploy/pocketbase/pb_data
sudo chown -R 1000:1000 deploy/pocketbase/pb_data
docker compose -f deploy/pocketbase/docker-compose.yml up -d --build
```

- [x] **Step 2: Проверки.** Результат записан в интеграционном ревью: health 200, uid 1000, 12 хуков без panic, коллекции схемы и `listing_blocks`, повторный старт коллекцию не дублирует. `caddy validate` — `Valid configuration`.

```bash
curl -fsS http://127.0.0.1:8090/api/health
ss -ltnp | grep 8090
docker compose -f deploy/pocketbase/docker-compose.yml exec pocketbase id
docker compose -f deploy/pocketbase/docker-compose.yml logs pocketbase
```

Ожидание:

- health — HTTP 200;
- `8090` слушает `127.0.0.1`, не `0.0.0.0` и не адрес LAN;
- `id` внутри контейнера — `uid=1000`;
- в логах нет panic Goja (`onBootstrap`, синтаксис хуков). Все файлы `deploy/pocketbase/pb_hooks/*.pb.js` загружены: число загруженных хуков в логе старта совпадает с числом файлов;
- миграция накатилась. В базе есть коллекции исправленного `pb_schema.json` плюс `listing_blocks`. Ожидаемое число — 8 (коллекции дампа Flutter и `listing_blocks`, если её не было в JSON). Имена сверяются с JSON, минимум по §5: `users`, `listings`, `listing_blocks`, `bookings`;
- у `pets_allowed` и `cancellation_allowed` в схеме `required: false`;
- поля `guests_forbidden`, `unique_prices`, `cancel_comment` существуют.

Повторный рестарт контейнера не дублирует `listing_blocks` и не стирает созданную суперпользователем запись (суперпользователя на локальном smoke можно создать тем же `compose run` из §4.1 с локальным `.env` вне git).

- [x] **Step 3: Если health или схема не сошлись, DNS не менять.** Чинить на месте, smoke повторить. Расхождения не было, DNS меняли уже после smoke.

### Task I4: Cutover на мини-ПК

Человек делает шаги панели роутера и Beget. Агент готовит команды и сверяет проверки. Порядок — §5 спецификации, без перестановки.

- [x] **Step 1: Мини-ПК.** Wi-Fi со шлюзом по умолчанию, `ping -I wlp3s0 1.1.1.1` проходит, `eno1` уже `192.168.50.2/30`. Power save выключен параметром модуля (`power_save=N`); команды `iw` на хосте нет, поэтому формулировка `iw dev wlp3s0 get power_save` не проверялась. Docker-сборка, каталоги `1000:1000`, хуки, миграция, `pb_schema.json` и `/opt/pocketbase/.env` (`600`) на месте. `caddy validate` прошёл до запуска сервиса.

- [x] **Step 2: Человек в панели роутера** закрепляет Wi-Fi мини-ПК по MAC `wlp3s0` и пробрасывает только TCP 80 и 443 на `192.168.1.43`. Форма Keenetic — «Трансляция сетевых адресов (NAT)»: интерфейс провайдера, «Пакеты на адрес» и маска пустые, протокол TCP, порт 80 или 443. Порты 22 и 8090 на белый адрес отвечают отказом.

- [x] **Step 3: `docker compose up -d` на мини-ПК.** Суперпользователь — одноразовый контейнер от `1000:1000`, пароль из `.env`, не из истории:

```bash
set -a
. /opt/pocketbase/.env
set +a
docker compose -f /opt/pocketbase/docker-compose.yml run --rm pocketbase \
  /pb/pocketbase superuser upsert "$PB_ADMIN_EMAIL" "$PB_ADMIN_PASSWORD" --dir=/pb/pb_data
```

С мини-ПК `http://127.0.0.1:8090/api/health` — 200. В базе есть `users`, `listings`, `listing_blocks`, `bookings`, одна запись суперпользователя. Контейнер `pocketbase` слушает только `127.0.0.1:8090`.

- [x] **Step 4: Человек в панели Beget** меняет A у `@`, `www`, `booking`, `pb.booking` на белый IP, снятый с роутера в момент переключения. MX (`mx1.beget.com`, `mx2.beget.com`) и TXT (`v=spf1 redirect=beget.com`) не менялись. AAAA нет. Значение IP в репозиторий не кладётся. Серверы имён Beget, `8.8.8.8` и `1.1.1.1` отдают этот адрес. Фактический TTL в ответе — 600. После этого Caddy запущен и получил сертификаты Let's Encrypt.

- [x] **Step 5: LTE-проверка до fail2ban.** С телефона через мобильный интернет открыт `https://pb.booking.vallome.ru/api/health`. `request.client_ip` этой строки публичный, не `192.168.1.1` и не другой LAN-адрес. В живом `ignoreip` белый адрес уже стоял как `/32`. fail2ban включён, пять jail стартовали. Сам IP телефона и белый адрес в git не записываются.

- [ ] **Step 6: Чеклист §6.** Публичные проверки ниже пройдены 19 октября. Не закрыто: ручной вход в `/_/` и запись `false` в `pets_allowed` / `cancellation_allowed` на живой базе. Таймер бэкапов на `192.168.50.1` — отдельный хвост, файлы уже в `deploy/minipc/backup/`.

До DNS, на мини-ПК: маршрут по умолчанию через Wi-Fi; power save off; `eno1` = `192.168.50.2/30` без шлюза; SSH с `fox-pc` (`192.168.50.1/30`) на `.2`; health 200 на loopback; 8090 не на `0.0.0.0`; uid контейнера 1000; поля `guests_forbidden`, `unique_prices`, `cancel_comment` и коллекция `listing_blocks`; запись bool `false` в `pets_allowed` / `cancellation_allowed` создаётся.

После сертификатов, с LTE:

| Проверка | Ожидание |
| --- | --- |
| `https://pb.booking.vallome.ru/api/health` | JSON, 200 |
| `request.client_ip` этой строки | публичный IP телефона |
| `https://pb.booking.vallome.ru/_/` | 200, страница входа |
| `https://booking.vallome.ru/` | 200, заглушка |
| `https://vallome.ru/` и `www` | 301 на `https://booking.vallome.ru/` |
| сертификат | Let's Encrypt, эти имена в SAN |
| белый IP, порты 22 и 8090 | закрыты |
| `GET /api/realtime` через Caddy | нет `content-encoding` на этот путь |

Вход в `/_/` — один ручной раз. С `fox-pc` health проверяется так (запрос на белый IP из ответа `8.8.8.8` проверкой не считается):

```bash
curl --resolve pb.booking.vallome.ru:443:<LAN_IP_МИНИ_ПК> https://pb.booking.vallome.ru/api/health
```

Отката на VPS нет.

---

## 4. Фаза 2 — отдельный эпик

В Фазу 1 не входит. `https://pb.booking.vallome.ru/api/health` с LTE уже открывается. Детальный пошаговый план этого эпика ещё не написан: его пишут после хвостов из раздела «Статус на 2026-10-19» (вход в `/_/`, таймер бэкапов, запись `false` в два bool-поля). Ниже — границы, чтобы эпик сразу разошёлся по изолированным трекам.

Тот же цикл: worktree `.worktrees/<track>`, ветка `feat/<track>` от `dev-dns_local`, исполнитель `grok-4.7-high-fast`, ревьюер `gemini-4-argon-medium`, затем `git worktree remove`.

**Прелюдия (одна ветка, до параллели):** `feat/pb-shared-client`, каталог `src/shared/api/`. Тонкий клиент PocketBase и разбор фильтра `{:placeholder}`. Четыре фичи только потребляют публичный API этого модуля и не правят его файлы. Монолит `src/api/listings.ts` новым адаптером не наращивается.

**Параллельные треки** (после merge прелюдии), каждый — своя фича, DTO и репозитории только в её `data/`:

| Трек | Ветка | Куда ложится код | Контракт |
| --- | --- | --- | --- |
| auth | `feat/pb-web-auth` | `src/features/auth/` | `magic-request` читает только `{ ok: true, waitToken }`. `otpId` из JSON не требуется. Опрос `GET /api/vallome/magic-wait`. Zod на ответе. |
| listings | `feat/pb-web-listings` | `src/features/listings/data/` | `PbListingSchema`. `pending` ↔ `moderation` в маппере. `rejected` при чтении не становится `moderation`. Таблица жилья и удобств §4.6 (`apartment`/`apartments`/`studio`/`house`/`room`, `Отель` не подменяется). `guests_forbidden` ↔ `guestsForbidden`, `unique_prices` ↔ `uniquePrices`. Даты — полночь UTC. |
| bookings | `feat/pb-web-bookings` | `src/features/bookings/data/` | `PbBookingSchema`. `cancel_comment` пишет модалка отмены. Денежные поля и `guest`/`host`/`listing` клиент не подменяет в обход правил. |
| profile | `feat/pb-web-profile` | `src/features/profile/data/` | `PbUserSchema`. `balance`, почта и телефон своей сессии читаются без `hidden: true` на этих полях. Id — брендированный тип. |

Общие правила эпика:

- Ответ PocketBase парсится Zod в доменный тип один раз на границе. `JSON.parse(...) as Session` / `as Listing[]` на HTTP, `localStorage` и записях базы не используется.
- Один файл — одна публичная сущность (`fromPbRecord`, `toPbFormData`, репозиторий, схема — разные файлы).
- Русские `select` остаются значениями базы. Слаги кабинета живут в маппере фичи.
- Flutter в том же эпике обновляет `AuthRepository.requestEmailOtp`: ответ без `otpId`, опрос по `waitToken`. Пока сборка старая, вход по письму закрывается ошибкой отправки и не получает id для перебора. Репозиторий Flutter — отдельный worktree в `/home/mk/Projects/Booking`, не в дереве `booking-web`.

Вне эпика по-прежнему: выкладка `website.booking.vallome.ru`, `dist/`, настройка SMTP, `payouts`, запуск `ensure_*.py` до приведения их правил к §4.7.

---

## Покрытие спецификации

| Раздел спецификации | Где в плане |
| --- | --- |
| §1 цель, пустая база, uid 1000 | Global Constraints, Track A, I3 |
| §2 имена и DNS | C1, I4 |
| §3 сеть, `/30`, power save | C3, I4 |
| §4 Dockerfile, compose, тома, `.env` | A1–A3 |
| §4.1 суперпользователь | I4, команда `superuser upsert` |
| §4.2 Caddy и SSE | C1, чеклист I4 |
| §4.3 fail2ban и LTE до включения | C2, I4 Step 5 |
| §4.4 настройки и rate limit | B1 |
| §4.5 схема и новые поля | A4, A5 |
| §4.6 контракт русских select | Фаза 2, трек listings |
| §4.7 API Rules и матрица статусов | A4, A5, B3 |
| §4.8 хуки | B1–B7 |
| §5 порядок включения | I4 |
| §6 проверки | I3, I4 Step 6 |
| §7 кабинет | Фаза 2 |
| §8 не входит | Global Constraints и конец §4 |

## Как исполнять

1. **Subagent-Driven (рекомендуется).** Оркестратор создаёт три worktree и на каждый трек назначает исполнителя `grok-4.7-high-fast`, затем ревьюера `gemini-4-argon-medium`, затем снова исполнителя. После `git worktree remove` — интеграция, smoke, cutover.
2. **Inline.** Те же задачи по порядку внутри одного трека за раз; параллелить треки только если у каждого свой worktree. Skill: `superpowers:executing-plans`.
