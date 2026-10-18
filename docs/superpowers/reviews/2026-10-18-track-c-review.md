# Ревью Track C (`feat/minipc-infra`)

- **Дата:** 2026-10-18
- **Ревьюер:** `gemini-4-argon-medium`
- **Ветка:** `feat/minipc-infra` (база: `dev-dns_local`, коммит `17e9ec8`)
- **Вердикт:** `APPROVED` (замечаний нет)

---

## 1. Чеклист ревьюера

| Пункт | Статус | Файлы / комментарий |
| --- | --- | --- |
| Покрытие задач трека против спецификации (§3, §4.2, §4.3, §4.4) | **Да** | `deploy/minipc/caddy/*`, `deploy/minipc/fail2ban/**`, `deploy/minipc/network/*`, `deploy/minipc/backup/*` |
| Feature-first (код лежит только в `deploy/minipc/`, без расползания по `src/`) | **Да** | Все 13 файлов созданы строго внутри `deploy/minipc/` |
| Гипермодульность (один файл — одна ответственность, лимит ≤300 строк) | **Да** | Максимум 204 строки (`switch-eno1-to-30.sh`, шапка с описанием ответственности присутствует; все функции ≤30 строк) |
| Строгая типизация / валидация входных параметров | **Да** | В bash-скриптах `set -euo pipefail`, явная проверка аргументов (`mini\|fox`), `EUID`, интерактивного TTY и маршрутов |
| Секреты (нет паролей, `pb_data`, живого WAN IP, `.env`, SSH-ключей) | **Да** | В `jail.local` использован плейсхолдер `<WAN_PUBLIC_IP>/32`, приватных ключей и паролей в диффе нет |
| Соблюдение матрицы файлов трека (не затронуты файлы вне `deploy/minipc/`) | **Да** | `git diff --stat dev-dns_local..feat/minipc-infra` показывает только 13 файлов внутри `deploy/minipc/` |

---

## 2. Построчная сверка со спецификацией и планом

### 2.1 Caddy (`deploy/minipc/caddy/Caddyfile` — §4.2, Task C1)
- **Глобальный блок:** `email mikefro62@gmail.com` задан.
- **Логирование:** сниппет `(accesslog)` пишет JSON (`format json`) в `/var/log/caddy/access.log` с ротацией `roll_size 20mb`, `roll_keep 7`, `roll_keep_for 168h`.
- **`pb.booking.vallome.ru`:**
  - `request_body { max_size 32MB }` — присутствует.
  - `@not_sse { not path /api/realtime* }` и `encode @not_sse zstd gzip` — присутствует, SSE не сжимается.
  - `reverse_proxy 127.0.0.1:8090`:
    - `header_up -X-Forwarded-For` — клиентский заголовок явно сбрасывается.
    - `header_up X-Real-IP {client_ip}` и `header_up X-Forwarded-Proto {scheme}` — присутствуют.
    - `flush_interval -1` и `transport http { read_timeout 360s }` — присутствуют.
- **`booking.vallome.ru`:** раздача статики из `/var/www/booking` (`file_server`).
- **`vallome.ru, www.vallome.ru`:** `redir https://booking.vallome.ru{uri} permanent`.
- *Примечание по валидации:* локально бинарник `caddy` отсутствует, а сокет Docker в sandbox недоступен (`caddy validate` отмечен исполнителем для обязательной проверки на этапе интеграционного smoke / cutover согласно Task C1 Step 2).

### 2.2 fail2ban (`deploy/minipc/fail2ban/` — §4.3, Task C2)
- **`jail.local`:**
  - `ignoreip = 127.0.0.0/8 ::1 192.168.50.0/24 192.168.1.0/24 <WAN_PUBLIC_IP>/32` — реальный белый IP не закоммичен.
  - `banaction = nftables-multiport` и `banaction_allports = nftables-allports`.
  - `[sshd]`: `backend = systemd`, `mode = extra`, `maxretry = 4`, `findtime = 10m`, `bantime = 1h`, `bantime.increment = true`, `bantime.maxtime = 1w`.
  - `[caddy-auth]`: `port = http,https`, `logpath = /var/log/caddy/access.log`, `maxretry = 5`, `findtime = 10m`, `bantime = 1h`.
  - `[caddy-magic]`: `port = http,https`, `logpath = /var/log/caddy/access.log`, `maxretry = 5`, `findtime = 10m`, `bantime = 1h`.
  - `[caddy-scan]`: `port = http,https`, `logpath = /var/log/caddy/access.log`, `maxretry = 6`, `findtime = 10m`, `bantime = 12h`.
  - `[recidive]`: `banaction = %(banaction_allports)s`, `maxretry = 3`, `findtime = 1d`, `bantime = 1w`.
- **Фильтры (`filter.d/`):**
  - `datepattern = "ts":%%s` соответствует таймстампу JSON-логов Caddy.
  - `caddy-auth.conf`: ловит статусы `400|401|403` на `/api/collections/*/auth-with-password`, `auth-with-otp`, `request-otp`, а также `/api/vallome/magic-auth` и `/api/vallome/change-email`.
  - `caddy-magic.conf`: ловит `POST` на `/api/vallome/magic-request` со статусами `400|401|403|429|500` и `429` на `/api/vallome/magic-(auth|wait)`.
  - `caddy-scan.conf`: ловит `401|403` на `/api/collections/_superusers` и обращения к `/.env`, `/.git`, `/.aws`, `/wp-login.php`, `/wp-admin`, `/phpmyadmin`, `/admin.php`. Строка `ignoreregex = ^.*"uri":"\/\.well-known\/.*$` присутствует дословно.
  - Регулярные выражения проверены на синтетических строках JSON-лога Caddy (срабатывание на `auth 400`, `magic POST 429`, `scan /.env`, `_superusers 401` и игнорирование `/.well-known/acme-challenge/...`).

### 2.3 Сеть и Wi-Fi (`deploy/minipc/network/` — §3.1, §3.2, §3.3, Task C3)
- **Адресация `/30`:** используются только `192.168.50.1/30` (`fox-pc`) и `192.168.50.2/30` (мини-ПК, `eno1`). Адрес `.100` нигде не фигурирует.
- **`interfaces-eno1`:** `allow-hotplug eno1`, `iface eno1 inet static`, `address 192.168.50.2/30`, без `gateway`.
- **Отключение энергосбережения Wi-Fi (`wlp3s0`):**
  - `iwlwifi-powersave.conf`: `options iwlwifi power_save=0` и `options iwlmvm power_scheme=1`.
  - `interfaces.d-wlp3s0`: содержит `post-up /usr/sbin/iw dev wlp3s0 set power_save off`.
  - `wifi-powersave-off.service`: `Type=oneshot`, `After=network-online.target`, `WantedBy=multi-user.target`, `ExecStart=/usr/sbin/iw dev wlp3s0 set power_save off`.
- **`switch-eno1-to-30.sh`:**
  - Проходит `bash -n`.
  - Безопасный порядок переключения по §3.2: в режиме `mini` проверяет маршрут по умолчанию через `wlp3s0` и `ping -I wlp3s0 1.1.1.1`, выключает `power_save`, добавляет `192.168.50.2/30` вторым адресом без `ifdown` и без шлюза на `eno1`, ждёт явного интерактивного подтверждения `yes` после проверки SSH, и только затем останавливает DHCP на `eno1`, снимает старые адреса и атомарно обновляет `/etc/network/interfaces`.
  - В режиме `fox` переключает соединение NetworkManager на `192.168.50.1/30` без шлюза (`ipv4.never-default yes`), проверяет SSH до `mk@192.168.50.2` с автоматическим откатом на прежний адрес при неудаче, снимает возможный default route с `eno1` и выводит напоминание выполнить `sudo scripts/pxe.sh stop`.

### 2.4 Бэкапы (`deploy/minipc/backup/` — §4.4, Task C4)
- **`pull-pb-backups.sh`:**
  - Проходит `bash -n`, содержит `set -euo pipefail`.
  - Стягивает по `rsync` через SSH только `*.zip` (`--include='*.zip' --exclude='*'`) из `mk@192.168.50.2:/opt/pocketbase/pb_data/backups/` (живые `data.db` и `WAL` не затрагиваются).
  - Выполняет очистку архивов старше 30 дней и оставляет не более 14 последних ZIP-файлов (`keep=14`).
- **`pull-pb-backups.service` и `pull-pb-backups.timer`:**
  - Сервис `Type=oneshot` от пользователя `mk` после `network-online.target`.
  - Таймер `OnCalendar=*-*-* 03:30:00` (после создания бэкапа PocketBase в `03:00`) с `Persistent=true`.

---

## 3. Замечания

Замечаний и блокеров нет. Ветка `feat/minipc-infra` готова к слиянию в `dev-dns_local`.
