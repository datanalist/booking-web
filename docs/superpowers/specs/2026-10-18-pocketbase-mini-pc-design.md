# PocketBase и Caddy на мини-ПК

Дата: 2026-10-18  
Статус: ревью учтено (К-1…К-5, В-1…В-5, С-1…С-5, У-1…У-3)  
Ветка: `dev-dns_local`  
Схема данных: [`docs/pocketbase-schema.md`](../../pocketbase-schema.md) — каталог полей; правила API, новые поля и контракт клиентов в этом документе новее каталога, пока каталог не обновлён  
Прежний VPS Beget снят. Runbook с живыми адресами в репозиторий не входит; актуальное описание хоста — этот документ.

## 1. Цель

Снова открыть `https://pb.booking.vallome.ru` с домашнего мини-ПК. VPS Beget удалён, копия `pb_data` не сохранилась. Сид был расходным: база поднимается пустой, схема накатывается миграцией из поставленного `pb_schema.json`, а не скриптами `ensure_*.py`.

Caddy стоит на хосте и остаётся общим входом. PocketBase 0.40.4 работает в контейнере от uid `1000`. Позже на этом мини-ПК будут другие контейнеры; каждый получит свой порт на `127.0.0.1` и свой сайт в Caddy.

PocketBase обслуживает два клиента одной базой:

- мобильное приложение Flutter (`/home/mk/Projects/Booking`);
- веб-кабинет владельца (`booking-web`).

Русские значения `select` и статус `pending` остаются в базе. Кабинет переводит их в свои слаги на границе DTO. Обратное — ломает Flutter.

## 2. Имена

Публичное имя принадлежит приложению. Контур (домашний белый IP или будущий SaaS) — это значение DNS-записи и upstream в Caddy, не часть имени.

| Имя | Роль | Запись |
| --- | --- | --- |
| `vallome.ru`, `www.vallome.ru` | витрина | A на белый IP, редирект на `https://booking.vallome.ru` |
| `booking.vallome.ru` | веб бронирования | A на белый IP, заглушка |
| `pb.booking.vallome.ru` | PocketBase этого приложения | A на белый IP, прокси на контейнер |

Правило следующего сервиса: `{приложение}.vallome.ru` для входа пользователя, `{сервис}.{приложение}.vallome.ru` для его бэкенда. Имена машин в публичный DNS не входят. Почта Beget (MX, TXT) не меняется. AAAA нет.

Белый IP роутера статический. Четыре A-записи пишутся один раз. Значение снимается с роутера в момент переключения и в репозиторий не кладётся. В `ignoreip` fail2ban оно попадает как `<WAN_PUBLIC_IP>/32` уже на мини-ПК, не в git.

Сертификат выпускается на каждое имя отдельно. Сайта на голом IP нет.

Если с домашнего Wi‑Fi публичное имя не открывается, а с мобильного интернета открывается, на роутере для своей сети то же имя отвечает LAN-адресом мини-ПК. `fox-pc` в той же домашней сети: публичные резолверы `8.8.8.8` и `1.1.1.1` всё равно отдают белый IP. Проверка health с `fox-pc` идёт через `--resolve` или `/etc/hosts` (§6), иначе запрос упирается в отсутствие Hairpin NAT.

Имя кабинета `website.booking.vallome.ru` из этого переноса не входит. Обязательства адаптера кабинета — в §7.

## 3. Сеть

Интернет приходит на белый IP. Роутер пробрасывает только TCP 80 и 443 на закреплённый адрес мини-ПК в Wi‑Fi. Адрес закрепляется резервацией DHCP по MAC `wlp3s0` до проброса портов. Порты 22 и 8090 на белый IP не пробрасываются.

Caddy на хосте слушает 80 и 443. PocketBase внутри контейнера слушает `0.0.0.0:8090`, на хост публикуется только `127.0.0.1:8090`.

SSH с других устройств в Wi‑Fi идёт на LAN-адрес мини-ПК, порт 22. Шлюз по умолчанию мини-ПК — только роутер по Wi‑Fi. На `eno1` шлюза нет: иначе ответы на проброшенные 80/443 уйдут в кабель.

### 3.1 Кабель `/30`

В подсети `192.168.50.0/30` четыре адреса: сеть `.0`, два хоста и broadcast `.3`. Валидные хосты — `192.168.50.1/30` (`fox-pc`) и `192.168.50.2/30` (мини-ПК, `eno1`). Адрес `192.168.50.100` в этой маске не является хостом и не используется.

Пока идёт переключение, на `eno1` может одновременно висеть старый адрес из установки PXE и новый `.2/30`. Старый адрес снимается только после успешного SSH на `.2`.

### 3.2 Порядок переключения `eno1`

Связь не рвётся одним `ifdown`. Шаги по порядку:

1. На мини-ПК `wlp3s0` уже в домашнем Wi‑Fi, имеет закреплённый LAN-адрес, маршрут по умолчанию через роутер и отвечает на `ping -I wlp3s0 1.1.1.1`. SSH на Wi‑Fi-адрес мини-ПК с другого устройства в LAN открывается. Пока этого нет, `eno1` не трогают: и `apt`, и `docker build` идут через Wi‑Fi.
2. Энергосбережение Wi‑Fi выключено (§3.3) до того, как на этот интерфейс сядут 80/443.
3. На `eno1` добавляется `192.168.50.2/30` рядом со старым адресом, без шлюза на этом интерфейсе: `ip addr add 192.168.50.2/30 dev eno1`. Старый адрес остаётся.
4. С `fox-pc` открывается SSH на `192.168.50.2`. Пока эта сессия не жива, старый адрес и `pxe.sh` не останавливаются.
5. `fox-pc` переводится на `192.168.50.1/30`. После этого кабель видит только пару `.1` ↔ `.2`.
6. На мини-ПК удаляется старый адрес `eno1`, из `/etc/network/interfaces` уходит `iface eno1 inet dhcp`. Остаётся:

```text
allow-hotplug eno1
iface eno1 inet static
    address 192.168.50.2/30
```

7. На `fox-pc` выполняется `sudo scripts/pxe.sh stop` в репозитории `pxe-minipc`. DHCP с `fox-pc` не остаётся включённым: он снова выдаст шлюз на кабель. Маршрут по умолчанию через `eno1`, если он появился, удаляется. Шлюз мини-ПК после этого — только Wi‑Fi.

Raspberry Pi 5 (запасной SSH, если пропадёт Wi‑Fi мини-ПК) в эту работу не входит. Пока Wi‑Fi мини-ПК лежит, публичный сайт тоже лежит.

### 3.3 Wi‑Fi Intel 3165 (`wlp3s0`)

Модуль `iwlwifi` по умолчанию включает энергосбережение. На сервере из‑за этого растут задержки, теряется ARP и рвутся TCP 80/443 и SSH. Экономия выключается тремя слоями.

`/etc/modprobe.d/iwlwifi-powersave.conf` (действует при следующей загрузке модуля):

```text
options iwlwifi power_save=0
options iwlmvm power_scheme=1
```

`/etc/network/interfaces.d/wlp3s0` — в секцию интерфейса добавляется строка:

```text
post-up /usr/sbin/iw dev wlp3s0 set power_save off
```

Юнит `wifi-powersave-off.service` (oneshot, `After=network-online.target`, `WantedBy=multi-user.target`):

```text
[Service]
Type=oneshot
ExecStart=/usr/sbin/iw dev wlp3s0 set power_save off
```

Проверка: `iw dev wlp3s0 get power_save` печатает `Power save: off`.

## 4. Что стоит на мини-ПК

Мини-ПК — Debian 13 (trixie), amd64. Docker уже поставлен установкой PXE. Образ PocketBase официально не публикуется. Контейнер собирается по минимальному Dockerfile из документации PocketBase, версия **0.40.4**, архив `linux_amd64`. Чужой образ из реестра не используется.

Dockerfile скачивает `pocketbase_0.40.4_linux_amd64.zip` релиза GitHub и до распаковки выполняет `sha256sum -c` по проверенной официальной контрольной сумме `PB_SHA256=9042ec818570e79c3628dadcd0a756c1496d9e1173918ec409d133c02f82e5fa` (из `checksums.txt` релиза `v0.40.4`). `ENTRYPOINT` у образа пустой. `CMD`:

```text
/pb/pocketbase serve --http=0.0.0.0:8090 --dir=/pb/pb_data --hooksDir=/pb/pb_hooks --migrationsDir=/pb/pb_migrations
```

Пустой `ENTRYPOINT` нужен, чтобы `docker compose run pocketbase /pb/pocketbase …` подставил бинарник сам, а не дописал его вторым аргументом к уже заданной точке входа.

`deploy/pocketbase/compose.yaml`:

- `restart: unless-stopped`;
- порт `127.0.0.1:8090:8090`;
- `user: "1000:1000"` — процесс в контейнере не root;
- `init: true` и `stop_grace_period: 30s`, чтобы при остановке PocketBase успел закрыть SQLite и сделать checkpoint WAL (`data.db-wal`, `data.db-shm`);
- логи Docker:

```yaml
logging:
  driver: json-file
  options:
    max-size: "10m"
    max-file: "3"
```

Перед первым стартом каталоги данных на хосте принадлежат `1000:1000` (`chown -R 1000:1000`). Иначе процесс без root не создаст `data.db` и `backups/`.

| Путь на хосте | В контейнере | Содержимое |
| --- | --- | --- |
| `/opt/pocketbase/pb_data` | `/pb/pb_data` | пустая база, затем данные и `backups/` |
| `/opt/pocketbase/pb_hooks` | `/pb/pb_hooks` | хуки из §4.8, уже с правками этого документа |
| `/opt/pocketbase/pb_migrations` | `/pb/pb_migrations` | `1729200000_import_schema.js` |
| `/opt/pocketbase/pb_schema.json` | `/pb/pb_schema.json` (только чтение) | схема для миграции |
| `/opt/pocketbase/.env` | не монтируется в образ | `PB_ADMIN_EMAIL`, `PB_ADMIN_PASSWORD`; режим `600` |

`.env`, `pb_data`, пароли и белый IP в git не коммитятся. `.env` уже покрыт ignore; новые файлы с секретами туда же.

В репозитории появятся `deploy/pocketbase/Dockerfile`, `deploy/pocketbase/compose.yaml`, `deploy/pocketbase/Caddyfile`, `deploy/pocketbase/pb_schema.json`, `deploy/pocketbase/pb_migrations/1729200000_import_schema.js` и каталог `deploy/pocketbase/pb_hooks/`. На мини-ПК это лежит в `/opt/pocketbase` (Caddyfile — в `/etc/caddy/Caddyfile`). Описание удалённого VPS в репозиторий не кладётся: его заменяет этот документ.

### 4.1 Суперпользователь

Бинарника PocketBase на хосте нет, команда `/pb/pocketbase` выполняется только в контейнере. Пароль в историю команд не вводится: оболочка читает `/opt/pocketbase/.env` (`chmod 600`) и подставляет переменные.

```bash
set -a
. /opt/pocketbase/.env
set +a
docker compose -f /opt/pocketbase/compose.yaml run --rm pocketbase \
  /pb/pocketbase superuser upsert "$PB_ADMIN_EMAIL" "$PB_ADMIN_PASSWORD" --dir=/pb/pb_data
```

Ящик — `mikefro62@gmail.com` (тот же, что ACME у Caddy), он записан в `PB_ADMIN_EMAIL`. Пароль новый, в git и в текст команды не пишется. Контейнер `run` одноразовый (`--rm`) и тоже идёт от `user: "1000:1000"`, поэтому база создаётся с тем же владельцем, что и основной процесс.

### 4.2 Caddy

Caddy ставится из официального репозитория и работает как systemd. ACME-ящик — `mikefro62@gmail.com`. Лог доступа — JSON в `/var/log/caddy/access.log`, ротация 20 МБ × 7. В JSON есть `request.client_ip`: по нему §6 отличает публичный IP клиента от LAN-адреса роутера.

Сайт `pb.booking.vallome.ru`:

```caddyfile
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
```

`/api/realtime*` не сжимается и не буферизуется: это SSE чатов и уведомлений (`text/event-stream`). `flush_interval -1` отдаёт чанки сразу. `X-Real-IP` ставит сам Caddy из `{client_ip}`; клиентский `X-Forwarded-For` к PocketBase не прокидывается и в `trustedProxy` не входит. `read_timeout 360s` держит длинное SSE-соединение. Тело запроса обрезается на 32 МБ до прокси.

Остальные сайты:

- `booking.vallome.ru` — файлы из `/var/www/booking`;
- `vallome.ru`, `www.vallome.ru` — постоянный редирект на `https://booking.vallome.ru{uri}`.

### 4.3 fail2ban

Пакет `nftables` установлен. `banaction` — штатный `nftables` Debian, набор iptables с VPS Beget не копируется. Jail `sshd` читает журнал через `backend = systemd`: в Debian 13 файла `/var/log/auth.log` нет.

**До включения jail** с телефона через LTE (не через домашний Wi‑Fi) открывается `https://pb.booking.vallome.ru/api/health`. В `/var/log/caddy/access.log` поле `request.client_ip` этой строки — публичный IP телефона. Если там `192.168.1.1` или другой LAN-адрес роутера, роутер подменяет источник (SNAT на LAN), и jail не включаются: бан этого адреса погасил бы сайт для всего интернета, а попадание его в `ignoreip` выключило бы баны целиком. Сначала исправляется проброс на роутере, проверка повторяется.

Когда в логе виден настоящий публичный IP, в `/etc/fail2ban/jail.local`:

```text
ignoreip = 127.0.0.0/8 ::1 192.168.50.0/24 192.168.1.0/24 <WAN_PUBLIC_IP>/32
```

`192.168.1.0/24` — Wi‑Fi роутера, `192.168.50.0/24` — кабель до `fox-pc` (шире, чем рабочая `/30`, чтобы временный старый адрес на время §3.2 не попал под бан). `<WAN_PUBLIC_IP>/32` закрывает Hairpin NAT: запрос из дома на публичное имя часто приходит на мини-ПК уже с белого адреса роутера, и бан этого адреса отрезал бы дом от собственного сайта. В git этот адрес не пишется.

| Jail | Условие | maxretry / окно | Бан |
| --- | --- | --- | --- |
| `sshd` | журнал `sshd`, `backend = systemd`, `mode = extra` | 4 / 10 мин | 1 ч, растёт до 1 недели |
| `caddy-auth` | 400/401/403 на auth-маршрутах ниже | 5 / 10 мин | 1 ч |
| `caddy-magic` | 400/401/403/429 на `POST /api/vallome/magic-request` | 5 / 10 мин | 1 ч |
| `caddy-scan` | пути сканеров и 401/403 на `/api/collections/_superusers` | 6 / 10 мин | 12 ч |
| `recidive` | 3 бана за сутки | 3 / 1 день | 1 неделя |

`filter.d/caddy-auth.conf` ловит те же коды на:

- `/api/collections/*/auth-with-password`;
- `/api/collections/*/auth-with-otp`;
- `/api/collections/*/request-otp`;
- `/api/vallome/magic-auth` (и GET письма, и POST);
- `/api/vallome/change-email`.

`magic-request` вынесен в отдельный jail `caddy-magic` и свой фильтр: это рассылка писем, у неё другой бюджет, чем у проверки кода. В `filter.d/caddy-scan.conf`:

```text
ignoreregex = ^.*"uri":"\/\.well-known\/.*$
```

Путь `/.well-known/` (ACME) фильтр сканера не трогает. Порт 8090 снаружи закрыт привязкой к localhost.

Встроенный rate limit PocketBase (§4.4) и счётчик попыток magic-кода (§4.8) работают даже когда fail2ban ещё выключен проверкой LTE.

### 4.4 Настройки при старте (`00_settings.pb.js`)

Хук `pb_hooks/00_settings.pb.js`. В JSVM v0.23+ (сюда входит 0.40.x) база в `onBootstrap` появляется только после `e.next()`. Вызов `e.app.settings()` до `e.next()` роняет процесс в panic.

```js
onBootstrap((e) => {
  e.next()

  const settings = e.app.settings()
  settings.meta.appName = "vallome.booking"
  settings.meta.appURL = "https://pb.booking.vallome.ru"

  settings.trustedProxy.headers = ["X-Real-IP"]
  settings.trustedProxy.useLeftmostIP = false

  settings.rateLimits.enabled = true
  settings.rateLimits.rules = [ /* таблица ниже */ ]

  settings.backups.cron = "0 3 * * *"
  settings.backups.cronMaxKeep = 7

  settings.logs.maxDays = 7
  settings.logs.logIP = true
  settings.logs.logAuthId = true

  e.app.save(settings)
})
```

Хук меняет уже загруженный объект и сохраняет его. SMTP, S3 и адрес отправителя он не затирает: их настройка в этот срез не входит и переживёт рестарт.

`trustedProxy` верит только `X-Real-IP`, который подставил Caddy. `useLeftmostIP = false`: левый адрес из цепочки, который мог приписать клиент, не используется. Без этого PocketBase видит все запросы как IP моста Docker.

PocketBase выбирает **первое** подходящее правило rate limit и дальше не идёт. Порядок сопоставления: точный тег, тег `*:…`, `МЕТОД + точный путь`, префикс метода, точный путь, префикс пути. Поэтому отдельные `POST /api/vallome/…` перекрывают общий `/api/`, а не складываются с ним. Кастомные маршруты хуков не несут тег `*:auth` — их закрывают строковые метки. Метка проходит regex PocketBase `(\w+ /[\w/-]*|…)`; дефис в `magic-request` допустим.

`duration` — секунды, `audience` пустой (и гость, и сессия). Числа:

| label | duration | maxRequests | Зачем |
| --- | --- | --- | --- |
| `*:auth` | 60 | 20 | auth коллекций. Заводские 2 запроса / 3 с режут обычный повтор входа и `auth-refresh` |
| `*:create` | 5 | 20 | заводской бюджет создания записей |
| `POST /api/vallome/magic-request` | 600 | 5 | рассылка писем |
| `POST /api/vallome/magic-auth` | 60 | 10 | подбор кода POST-ом |
| `GET /api/vallome/magic-auth` | 60 | 10 | то же письмо открывается GET-ом; отдельный счётчик, потолок попыток всё равно 5 в store |
| `GET /api/vallome/magic-wait` | 60 | 40 | Flutter опрашивает раз в 2 с (30/мин) плюс запас |
| `POST /api/vallome/change-email` | 3600 | 5 | смена почты |
| `/api/batch` | 1 | 3 | заводской бюджет batch |
| `/api/` | 10 | 300 | общий потолок всего остального API |

Автобэкап PocketBase — горячий снимок SQLite, не `cp` живых `data.db-wal`. Каждый день в 03:00 ZIP пишется в `pb_data/backups/`, хранятся 7 последних. `fox-pc` забирает эти ZIP по SSH с кабеля (трафик уже внутри SSH) и держит копию у себя, отдельно от диска мини-ПК. Ручное копирование каталога `pb_data` у работающего контейнера не используется.

Логи приложения: 7 дней, с IP и id авторизованной записи.

### 4.5 Схема

Источник коллекций — `/home/mk/Projects/Booking/pb_schema.json`. В поставку кладётся уже исправленная копия `deploy/pocketbase/pb_schema.json`: дамп плюс правки этого раздела и правила §4.7. Сырой дамп импортировать нельзя: в нём `required: true` на bool, закрытые `createRule`/`updateRule` у `listings` и нет `listing_blocks`.

Скрипта `ensure_listings.py` нет. `ensure_bookings.py`, `ensure_favorites.py`, `ensure_chats.py`, `ensure_reviews.py` падают, если коллекции `listings` и `users` ещё нет. Они не создают схему. После того как их правила приведены к §4.7, их можно запустить вторым проходом: они синхронизируют индексы и правила. Запуск нынешних скриптов как есть вернёт дырявый `updateRule` у `bookings` и заново откроет К-4. Пока скрипты не обновлены, их не запускают.

Миграция `deploy/pocketbase/pb_migrations/1729200000_import_schema.js` идемпотентна. Второй аргумент `false` — режим extend/merge: коллекции и поля из JSON дополняются, существующие таблицы и строки не удаляются.

```js
migrate((app) => {
  const raw = toString($os.readFile("/pb/pb_schema.json"))
  app.importCollectionsByMarshaledJSON(raw, false)
  // если в JSON ещё нет listing_blocks — создать её здесь, повторный запуск не дублирует коллекцию
}, (app) => {
  // данные и коллекции вниз не сносятся
})
```

`listing_blocks` (в дампе Flutter её нет; календарь хозяина есть в ТЗ):

| Поле | Тип | Ограничение |
| --- | --- | --- |
| `listing` | relation → `listings` | required, один |
| `start` | date | required |
| `end` | date | required |

Индекс `(listing, start)`. Правила — в §4.7.

Правки полей `listings` в поставленном JSON:

| Поле | Было в дампе | Становится |
| --- | --- | --- |
| `pets_allowed`, `cancellation_allowed` | bool, `required: true` | `required: false` |
| `photos` | file, `required: true` | `required: false` |
| `price_14`, `price_28` | number, `required: true` | `required: false` |
| `title`, `address`, `city`, `description` | text, required | `required: false` |
| `max_guests`, `price_night` | number, required | `required: false` |
| `check_in_time`, `check_out_time` | text, required | `required: false` |
| `guests_forbidden` | нет поля | bool, `required: false` |
| `unique_prices` | нет поля | json, `required: false` |

У bool в PocketBase `required: true` означает «значение должно быть истинным»: `false` не проходит валидатор. Черновик кабинета и сиды держат `petsAllowed: false` и `cancellationAllowed: false`, поэтому флаг required на этих полях снимается.

`emptyDraft()` кабинета после шага 1 мастера отдаёт пустые строки, `photos: []`, `maxGuests: 0`, `priceNight: 0`, пустые `checkInTime` / `checkOutTime` и не содержит `city`. Такие поля в базе не required. Полнота проверяется хуком `listings_publish_guard.pb.js`, когда итоговый `status` становится `pending` или `published`: непустые `title`, `address`, `city`, `description`, `check_in_time`, `check_out_time`; `max_guests >= 1`; `price_night > 0`; не меньше 6 фото. `price_14` и `price_28` остаются необязательными и у опубликованного объявления. Черновик (`draft`) и архив эту проверку не проходят. `housing_type` по-прежнему один из четырёх русских значений.

`unique_prices` — JSON-массив `{ "date": "YYYY-MM-DD", "base": number }`. Это `uniquePrices` шага 6 мастера. Пустой массив допустим.

В `bookings` добавляется `cancel_comment`: text, `required: false`, max 500. Это свободный текст `CancelBookingModal` (`CANCEL_REASON_MAX_LENGTH`). Код причины по-прежнему в select `cancel_reason` (`guest`, `host`, `host_timeout`, `prepay_timeout`). Текст комментария в select не пишется.

Календарные даты `check_in`, `check_out`, `start`, `end`, `requested_check_in`, `requested_check_out` клиенты пишут как полночь UTC: `YYYY-MM-DD 00:00:00.000Z`. PocketBase хранит date в UTC; локальная полночь устройства (`+03:00`) сдвигает день на сутки назад, и `dayKey` в хуках занятости видит предыдущую дату.

### 4.6 Контракт Flutter и кабинета

В PocketBase остаются русские `select`, как в приложении.

`listings.housing_type`: `Квартира`, `Дом`, `Комната`, `Отель`. Значения `Апартаменты` и `Студия` в этот select не добавляются. Подтип живёт в текстовом `placement_type`.

| Слаг кабинета `HousingType` | `housing_type` | `placement_type` |
| --- | --- | --- |
| `apartment` | `Квартира` | пусто |
| `apartments` | `Квартира` | `Апартаменты` |
| `studio` | `Квартира` | `Студия` |
| `house` | `Дом` | пусто |
| `room` | `Комната` | пусто |
| в кабинете слага нет | `Отель` | пусто |

Чтение обратно: `Квартира` + `Апартаменты` → `apartments`, `Квартира` + `Студия` → `studio`, `Квартира` без подтипа → `apartment`. Запись объявления с `Отель` сохраняет `Отель`. Маппер не подменяет его на `apartment`.

`amenities` и `extras` в базе — русские (и `Wifi`) строки дампа. Кабинет хранит слаги и переводит их по `AMENITY_LABELS` / `EXTRA_AMENITY_LABELS` в `src/config/index.ts`:

| Слаг | Значение в PocketBase |
| --- | --- |
| `wifi` | `Wifi` |
| `tv` | `Телевизор` |
| `ac` | `Кондиционер` |
| `heater` | `Обогреватель` |
| `hairdryer` | `Фен` |
| `iron` | `Утюг` |
| `kitchen` | `Кухня` |
| `washer` | `Стиральная машина` |
| `dishes` | `Посуда` |
| `breakfast` | `Завтраки` |
| `pool` | `Бассейн` |
| `fireplace` | `Камин` |
| `smoking` | `Разрешено курение` |
| `gym` | `Спортзал` |
| `selfCheckIn` | `Самостоятельное заселение` |
| `sauna` | `Сауна` |
| `parking` | `Парковка` |

Статус объявления: кабинет пишет и читает `moderation`, в базе это `pending`. `draft`, `published`, `archived` совпадают. `rejected` кабинет не записывает (правило update это и так запрещает хозяину) и при чтении не превращает в `moderation`.

`guestsForbidden` кабинета ↔ `guests_forbidden`. `uniquePrices` ↔ `unique_prices`. `cancel_comment` пишет модалка отмены кабинета; Flutter по-прежнему пишет только `cancel_reason`.

Magic-link для Flutter меняется вместе с хуком (§4.8). Текущий `AuthRepository.requestEmailOtp` требует `otpId` в JSON и опрашивает `magic-wait` этим id. После правки ответ `magic-request` — только `{ ok: true, waitToken }`. Приложение опрашивает `GET /api/vallome/magic-wait` токеном ожидания и больше не получает `otpId`. Пока клиент не обновлён, вход по письму у старой сборки закрывается с ошибкой отправки, а не выдаёт id для перебора.

### 4.7 Правила API

Суперпользователь правила коллекций обходит. Хук смены статуса брони (§4.8) для запроса суперпользователя тоже пропускает переход: модерация и оплата идут из админки, не из записи гостя.

Поле с `"hidden": true` PocketBase отдаёт только суперпользователю. Владелец записи его тоже не видит. Поэтому `hidden: true` нельзя ставить на `email`, `phone` и `balance`: Flutter `AuthRepository` читает почту и телефон своей сессии, кабинет показывает `balance` в `BalanceCard` и в таблицах броней. Тот же запрет на `fcm_token` и `staff_tasks`: их читает и пишет сам аккаунт.

`email` закрыт системным флагом записи `emailVisibility = false` (значение по умолчанию; хуки регистрации его не включают). Чужой view и `expand` почту не получают, свой аккаунт — получает.

`listRule` у `users` запрещает перечень чужих аккаунтов. `viewRule` пустой, потому что карточке объявления нужен `expand=host`, а брони — `expand=guest`. Прямой view по известному id и такой expand отдают `phone` и `balance`: спрятать их флагом `hidden` нельзя, не ослепив владельца. Перечень коллекции при этом закрыт.

`updateRule` разрешает править свою запись и отвергает смену служебных полей. Форма `(@request.body.<field>:isset = false || @request.body.<field> = <field>)` пускает клиент, который присылает поле заново с тем же значением, и отвергает новое.

**`users`**

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

`createRule = null`: запись пользователя создаёт хук magic-link или суперпользователь, не анонимный POST.

**`listings`**

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

Хозяин не выставляет `published` и `rejected` в обход модерации. `published` / `rejected` пишет суперпользователь. Проверка «не меньше 6 фото» и заполненности полей — хук, не правило: правило не умеет считать файлы.

**`listing_blocks`**

```text
listRule = @request.auth.id != "" && listing.host = @request.auth.id
viewRule = @request.auth.id != "" && listing.host = @request.auth.id
createRule = @request.auth.id != "" && @request.body.listing.host = @request.auth.id
updateRule =
  @request.auth.id != "" &&
  listing.host = @request.auth.id &&
  (@request.body.listing:isset = false || @request.body.listing = listing)
deleteRule = @request.auth.id != "" && listing.host = @request.auth.id
```

Чужой календарь не читается и не пишется. Сменить `listing` у уже созданной блокировки нельзя.

**`bookings`**

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

Создание: гость — это текущая сессия, хозяин совпадает с хозяином объявления, самобронирование запрещено, первый статус только `pending_host`. Деньги в теле создания остаются: Flutter `BookingsRepository.create` присылает расчёт вместе с заявкой.

Правка не подменяет `guest`, `host`, `listing`, `prepaid_at` и денежные поля. Клиент Flutter при отказе денег повторяет запрос без них — это уже есть в `patch()`. Переходы статуса правило целиком не выражает; их проверяет `bookings_status.pb.js`:

| Кто | Из | В | Рядом |
| --- | --- | --- | --- |
| гость | `pending_host`, `awaiting_prepayment`, `confirmed`, `change_requested` | `cancelled` | `cancel_reason = guest`; `cancel_comment` по желанию |
| гость | `pending_host`, `awaiting_prepayment`, `confirmed` | `change_requested` | `requested_check_in` / `requested_check_out` |
| хозяин | `pending_host` | `awaiting_prepayment` | выставляет `prepay_until` |
| хозяин | `pending_host`, `awaiting_prepayment`, `confirmed`, `change_requested` | `cancelled` | `cancel_reason = host`; текст владельца — в `cancel_comment` |
| cron | `pending_host` | `cancelled` | `cancel_reason = host_timeout` |
| cron | `awaiting_prepayment` | `cancelled` | `cancel_reason = prepay_timeout` |
| суперпользователь | любой | `confirmed`, `completed`, запись `prepaid_at` | оплата и завершение не пишутся токеном гостя или хозяина |

Остальные переходы хук отклоняет с `400`. Гость не подтверждает бронь и не проставляет `prepaid_at`.

### 4.8 Хуки

На диск мини-ПК кладутся уже исправленные файлы, не слепок `Booking/pb_hooks` как есть. Имена:

| Файл | Роль |
| --- | --- |
| `00_settings.pb.js` | настройки §4.4 после `e.next()` |
| `otp_signup.pb.js` | регистрация, без смены контракта |
| `magic_link.pb.js` | письмо входа, правки К-3 |
| `change_email.pb.js` | смена почты; ключи попадают в индекс зачистки |
| `bookings_overlap.pb.js` | пересечение броней и блокировок внутри транзакции |
| `bookings_status.pb.js` | переходы статуса из таблицы §4.7 |
| `bookings_expiry_cron.pb.js` | таймаут 12 часов |
| `listings_publish_guard.pb.js` | полнота объявления при `pending` / `published` |
| `occupied_listings.pb.js` | поиск занятых, фильтр в SQL |
| `chats_messages.pb.js` | сообщения, без смены контракта |
| `chats_sync_listing_host.pb.js` | смена хозяина объявления |
| `auth_store_sweep.pb.js` | удаление просроченных ключей store |

**`magic_link.pb.js`.** `POST /api/vallome/magic-request` больше не возвращает `otpId`. Тело успеха: `{ ok: true, waitToken }`. `waitToken` — `$security.randomString(32)`. Им клиент опрашивает `GET /api/vallome/magic-wait`. `otpId` есть только в ссылке письма и в store.

Код в ссылке — тоже `$security.randomString(32)`, не пятизначное число. Сравнение — `$security.equal`, не `!==`. Запись store `vallome_mcode_<otpId>` хранит email, код, `expires`, `waitToken` и `attempts`. Неверный код увеличивает `attempts`. После 5 неверных попыток ключ удаляется сразу, ответ `400` (код) или `403` (попытки кончились). Истёкший ключ тоже удаляется. Верный код пишет токен сессии в `magicWait:<waitToken>` и удаляет `vallome_mcode_*`.

Запасной замок, если клиент когда-нибудь снова пришлёт `otpId` в `POST /api/vallome/magic-auth`: вместе с `otpId` и `code` обязателен тот же `waitToken`, который выдал `magic-request`. Одного `otpId` недостаточно.

`GET /api/vallome/magic-auth` остаётся ссылкой из письма (`id` + `code`). Это единственное место, где `otpId` покидает сервер, и оно уходит на почту.

**`bookings_overlap.pb.js`.** Проверка и `e.next()` идут в одной транзакции. Внутри колбэка читается `txApp`, не `$app`: иначе `NonconcurrentDB` встаёт в deadlock. `e.app` после хука возвращается.

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
      // пересечение броней и listing_blocks — только через txApp
      e.next()
    })
  } finally {
    e.app = originalApp
  }
}, "bookings")
```

Та же обёртка на `onRecordUpdateRequest`. `OCCUPYING` — `pending_host`, `awaiting_prepayment`, `confirmed`, `change_requested`. Статусы `cancelled`, `completed`, `cancel_requested` проверку пропускают и сразу вызывают `e.next()`: иначе отмена и cron таймаута получают «жильё уже занято».

В той же транзакции `txApp.findRecordsByFilter` смотрит `listing_blocks` этого `listing`: отрезок `start`/`end` против `check_in`/`check_out` (и против `requested_*`, если они заданы). Пересечение с блокировкой хозяина — тот же `BadRequestError`.

**`bookings_expiry_cron.pb.js`.**

```js
cronAdd("expireStaleBookings", "*/5 * * * *", () => {
  // pending_host && host_respond_until <= now → cancelled, cancel_reason = host_timeout
  // awaiting_prepayment && prepay_until <= now → cancelled, cancel_reason = prepay_timeout
})
```

Сравнение «меньше либо равно сейчас». Запись сохраняется через приложение cron, не через токен гостя. Хук пересечений такой `cancelled` пропускает.

**`chats_sync_listing_host.pb.js`.** Условие `e.collection?.name !== "listings"` удаляется. У `RecordEvent` в JSVM нет `e.collection`, сравнение с `"listings"` всегда истинно, и хук не делает ничего. Фильтр коллекции уже стоит вторым аргументом `onRecordAfterUpdateSuccess(..., "listings")`. Остаётся `if (!record) return`.

**`occupied_listings.pb.js`.** В `findRecordsByFilter` уходит фильтр занимающих статусов и `check_out >= {:checkIn}`, с привязкой `{:placeholder}`, по индексу `idx_bookings_status`. Полная выгрузка `id != ''` убирается. Даты — полночь UTC из §4.5.

**`listings_publish_guard.pb.js`.** На create и update `listings`: если итоговый статус `pending` или `published`, проверяется полнота из §4.5, включая минимум 6 фото. Иначе `400`. Черновик проходит с пустыми фото и `false` в bool.

**`auth_store_sweep.pb.js`.** `$app.store()` не отдаёт список ключей и не забывает просроченные сам. `magic_link.pb.js` и `change_email.pb.js` дописывают ключ в JSON-индекс `vallome_store_index`. Cron `sweepAuthStore` каждые 10 минут (`*/10 * * * *`) удаляет записи с `expires` в прошлом и вычёркивает их из индекса. Это `vallome_mcode_*`, `magicWait:*`, `emailChange:*`, `emailChangeUser:*`. Рестарт контейнера по-прежнему стирает store целиком: незавершённый вход (10 минут) и незавершённая смена почты (24 часа) после рестарта недействительны. Это принятое свойство памяти процесса; cron лечит только утечку ключей, к которым больше никто не обратился.

## 5. Порядок включения

1. Мини-ПК: Wi‑Fi с маршрутом по умолчанию и выключенным power save (§3.3). Затем бесшовный переход `eno1` на `192.168.50.2/30` (§3.2). Docker-сборка с проверкой SHA256. Каталоги `1000:1000`. Хуки, миграция и `pb_schema.json` на месте. `.env` в режиме `600`. Caddy установлен, `caddy validate` проходит, сервис Caddy не запущен. fail2ban не запущен.
2. Человек в панели роутера закрепляет Wi‑Fi-адрес мини-ПК и пробрасывает TCP 80 и 443. Порты 22 и 8090 не пробрасываются. С мини-ПК белый IP виден как адрес выхода.
3. `docker compose up -d`. Миграция импортирует схему. Хук настроек отрабатывает после инициализации базы. Суперпользователь создаётся командой из §4.1. С мини-ПК `http://127.0.0.1:8090/api/health` отвечает 200, и 8090 слушает только `127.0.0.1`. В базе есть `users`, `listings`, `listing_blocks`, `bookings`.
4. Если health или схема не сошлись, DNS не менять. Чинить контейнер на месте.
5. Человек в панели Beget меняет A у `@`, `www`, `booking`, `pb.booking` на белый IP. TTL остаётся 300. MX и TXT не трогаются. Агент проверяет ответ резолверов.
6. Дождаться, пока `8.8.8.8` и `1.1.1.1` отдадут этот адрес. Затем запустить Caddy и дождаться сертификатов Let's Encrypt.
7. Проверка LTE из §4.3: в логе Caddy публичный IP телефона. Только после неё включается fail2ban и в `ignoreip` подставляется `<WAN_PUBLIC_IP>/32`.
8. Пройти проверки из §6. `ensure_*.py` — после того, как скрипты в репозитории Flutter пишут правила §4.7, и только как повторная синхронизация индексов и правил.

Отката на VPS нет. Пока DNS указывает на старый адрес, имена и так не открываются.

## 6. Проверки

До смены DNS, на мини-ПК:

- маршрут по умолчанию через Wi‑Fi-роутер, `ping -I wlp3s0 1.1.1.1` проходит;
- `iw dev wlp3s0 get power_save` — `Power save: off`;
- `eno1` — `192.168.50.2/30` без шлюза; с `fox-pc` (`192.168.50.1/30`) SSH на `.2` открывается;
- health на `127.0.0.1:8090` — 200;
- `8090` не слушает `0.0.0.0` и не опубликован в LAN;
- процесс контейнера — uid 1000;
- в коллекциях есть поля `guests_forbidden`, `unique_prices`, `cancel_comment`, коллекция `listing_blocks`;
- у `pets_allowed` и `cancellation_allowed` в схеме `required: false`, запись с `false` создаётся.

После сертификатов, с мобильного интернета (LTE):

| Проверка | Ожидание |
| --- | --- |
| `https://pb.booking.vallome.ru/api/health` | JSON, 200 |
| `request.client_ip` этой строки в `/var/log/caddy/access.log` | публичный IP телефона, не `192.168.1.1` |
| `https://pb.booking.vallome.ru/_/` | 200, страница входа |
| `https://booking.vallome.ru/` | 200, заглушка |
| `https://vallome.ru/` и `www` | 301 на `https://booking.vallome.ru/` |
| сертификат | Let's Encrypt, в SAN эти имена |
| белый IP, порты 22 и 8090 | закрыты |
| `GET /api/realtime` через Caddy | чанки не сидят в gzip; в ответе нет `content-encoding` на этот путь |

Вход суперпользователя в `/_/` — один ручной раз. С домашнего Wi‑Fi отдельно открыть `https://pb.booking.vallome.ru`. Расхождение только с домашней сети лечится split-DNS из §2.

С `fox-pc`, если Hairpin NAT нет:

```bash
curl --resolve pb.booking.vallome.ru:443:<LAN_IP_МИНИ_ПК> https://pb.booking.vallome.ru/api/health
```

Либо строка в `/etc/hosts` на `fox-pc`, либо `systemd-resolved`, который ходит в DNS роутера со split-DNS. Запрос с `fox-pc` на белый IP из ответа `8.8.8.8` проверкой health не считается. Те же `--resolve` / hosts нужны скриптам `ensure_*.py`, когда их запускают с `fox-pc`.

SSH с другого устройства в Wi‑Fi — на LAN-адрес мини-ПК.

## 7. Следующий срез кабинета

Выкладка `website.booking.vallome.ru` и подключение `dist/` к API в этот перенос не входят. Когда кабинет сядет на `https://pb.booking.vallome.ru`, адаптер обязан следовать двум правилам репозитория. Иначе срез считается незакрытым.

**Граница типов.** Ответы PocketBase парсятся схемой (Zod) в доменный тип: `PbUserSchema`, `PbListingSchema`, `PbBookingSchema`. `JSON.parse(...) as Session` / `as Listing[]` на HTTP, `localStorage` и записях базы не используется. Id — брендированные типы. Статус `pending` ↔ `moderation`, таблица жилья и удобств §4.6 и поле `cancel_comment` живут в маппере фичи, не в разрозненных `as`.

**Куда ложится код.** Клиент PocketBase и общий разбор фильтра `{:placeholder}` — в `src/shared/api/` (тонкий фасад можно оставить в `src/api/`). DTO, `fromPbRecord` / `toPbFormData` и репозитории — в `data/` своей фичи: `src/features/listings/data/`, `src/features/bookings/data/`, `src/features/chat/data/`, `src/features/profile/data/`. Один файл — одна публичная сущность. Монолит `src/api/listings.ts` новым адаптером не наращивается.

## 8. Не входит

- Raspberry Pi 5 и ethernet до неё.
- Прогон сидов `seed_*.py` и восстановление старой базы.
- Запуск нынешних `ensure_*.py` до правки их правил под §4.7.
- Ящик SMTP и рабочая отправка magic-link. Хуки на диске уже с замками §4.8; отправитель в этом срезе не настраивается, и хук настроек его не затирает.
- Домен `website.booking.vallome.ru`, выкладка `dist/` и реализация §7.
- Проброс SSH в интернет и публикация порта 8090 в LAN.
- Коллекция `payouts`, пока её нет в поставленном `pb_schema.json`.
