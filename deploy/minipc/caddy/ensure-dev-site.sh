#!/usr/bin/env bash
# Dev-сайт в Caddy. От root пишет блок в /etc/caddy/Caddyfile и делает reload.
# Без root правит только текущий процесс через admin API (ensure-dev-site.py):
# после перезапуска Caddy правка пропадёт, пока скрипт не запущен через sudo.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOST="dev.app.booking.vallome.ru"

install_caddyfile() {
  local caddyfile="/etc/caddy/Caddyfile"
  if [ ! -f "$caddyfile" ]; then
    echo "Нет $caddyfile" >&2
    exit 1
  fi
  if grep -q "$HOST" "$caddyfile"; then
    caddy validate --config "$caddyfile"
    systemctl reload caddy
    echo "Caddyfile уже содержит $HOST, конфигурация перезагружена"
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
  if ! caddy validate --config "$tmp"; then
    rm -f "$tmp"
    echo "Новый Caddyfile не прошёл проверку, /etc/caddy/Caddyfile не изменён" >&2
    exit 1
  fi
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
