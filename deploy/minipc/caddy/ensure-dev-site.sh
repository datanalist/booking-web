#!/usr/bin/env bash
# Dev-сайт в Caddy. От root пишет блок в /etc/caddy/Caddyfile и делает reload.
# Без root правит только текущий процесс через admin API (ensure-dev-site.py):
# после перезапуска Caddy правка пропадёт, пока скрипт не запущен через sudo.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOST="dev.app.booking.vallome.ru"

# validate от root открывает /var/log/caddy/access.log и оставляет его владельцем root.
caddy_validate() {
  local cfg="$1"
  if ! id caddy >/dev/null 2>&1; then
    echo "Пользователь caddy не найден, caddy validate от root не запускается" >&2
    return 1
  fi
  if command -v runuser >/dev/null 2>&1; then
    runuser -u caddy -- caddy validate --config "$cfg"
  else
    su -s /bin/sh caddy -c "caddy validate --config $(printf '%q' "$cfg")"
  fi
}

# Совпадение с началом блока сайта, не с подстрокой в комментарии.
host_block_present() {
  local file="$1"
  local host_re="${HOST//./\\.}"
  grep -Eq "^[[:space:]]*${host_re}[[:space:]]*(\\{|,)" "$file"
}

install_caddyfile() {
  local caddyfile="/etc/caddy/Caddyfile"
  if [ ! -f "$caddyfile" ]; then
    echo "Нет $caddyfile" >&2
    exit 1
  fi
  if host_block_present "$caddyfile"; then
    caddy_validate "$caddyfile"
    systemctl reload caddy
    echo "Caddyfile уже содержит блок $HOST, конфигурация перезагружена"
    return
  fi
  local tmp
  tmp="$(mktemp)"
  cp "$caddyfile" "$tmp"
  cat >>"$tmp" <<'EOF'

dev.app.booking.vallome.ru {
	import accesslog

	request_body {
		max_size 12MB
	}
	encode zstd gzip

	reverse_proxy 127.0.0.1:8081
}
EOF
  chmod a+r "$tmp"
  if ! caddy_validate "$tmp"; then
    rm -f "$tmp"
    echo "Новый Caddyfile не прошёл проверку, /etc/caddy/Caddyfile не изменён" >&2
    exit 1
  fi
  cp -a "$caddyfile" "${caddyfile}.bak"
  cp "$tmp" "$caddyfile"
  rm -f "$tmp"
  systemctl reload caddy
  echo "Блок $HOST записан в $caddyfile и Caddy перезагружен"
}

if [ "$(id -u)" -eq 0 ]; then
  install_caddyfile
else
  python3 "$ROOT/ensure-dev-site.py"
  echo "Caddyfile на диске не изменён: нет прав root. Сайт добавлен в текущий процесс Caddy."
  echo "Чтобы он пережил перезапуск Caddy: sudo bash deploy/minipc/caddy/ensure-dev-site.sh"
fi
