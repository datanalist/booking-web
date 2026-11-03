#!/usr/bin/env python3
"""Добавляет dev.app.booking.vallome.ru в уже запущенный Caddy.

Берёт весь текущий конфиг, дописывает subject, лог и route и загружает его
целиком через POST /load. Так Caddy не достраивает вторую TLS policy поверх
куска конфига. Если после загрузки пропадает прежний хост, возвращается
конфиг, который был до правки. /etc/caddy/Caddyfile скрипт не меняет.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request

HOST = "dev.app.booking.vallome.ru"
UPSTREAM = "127.0.0.1:8081"
PROD_HOST = "app.booking.vallome.ru"
PROD_UPSTREAM = "127.0.0.1:8080"
ADMIN = os.environ.get("CADDY_ADMIN", "http://127.0.0.1:2019").rstrip("/")


def request(method: str, path: str, body: object | None = None, timeout: int = 30) -> object:
    data = None if body is None else json.dumps(body).encode()
    headers = {"Content-Type": "application/json"} if data is not None else {}
    req = urllib.request.Request(ADMIN + path, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read()
            if not raw:
                return None
            return json.loads(raw)
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace")
        raise SystemExit(f"Caddy API {method} {path} -> {exc.code}: {detail}") from exc
    except urllib.error.URLError as exc:
        raise SystemExit(f"Caddy API недоступен ({ADMIN}): {exc.reason}") from exc


def hosts_in(config: object) -> list[str]:
    found: list[str] = []

    def walk(node: object) -> None:
        if isinstance(node, dict):
            host = node.get("host")
            if isinstance(host, list) and all(isinstance(item, str) for item in host):
                parent_keys = set(node.keys())
                if parent_keys <= {"host", "path"} or "host" in node and any(
                    key in node for key in ("host",)
                ):
                    # host-matcher лежит рядом с другими условиями маршрута.
                    if "dial" not in node and "handler" not in node:
                        found.extend(item for item in host if item not in found)
            for value in node.values():
                walk(value)
        elif isinstance(node, list):
            for item in node:
                walk(item)

    walk(config)
    return found


def server(config: dict) -> dict:
    servers = config.get("apps", {}).get("http", {}).get("servers", {})
    if not isinstance(servers, dict) or "srv0" not in servers or not isinstance(servers["srv0"], dict):
        raise SystemExit("В конфиге Caddy нет сервера srv0")
    return servers["srv0"]


def replace_dial(node: object) -> None:
    if isinstance(node, dict):
        for key, value in list(node.items()):
            if key == "dial" and value == PROD_UPSTREAM:
                node[key] = UPSTREAM
            else:
                replace_dial(value)
    elif isinstance(node, list):
        for item in node:
            replace_dial(item)


def ensure(config: dict) -> list[str]:
    notes: list[str] = []
    tls_policies = (
        config.setdefault("apps", {})
        .setdefault("tls", {})
        .setdefault("automation", {})
        .setdefault("policies", [])
    )
    if not isinstance(tls_policies, list) or not tls_policies or not isinstance(tls_policies[0], dict):
        raise SystemExit("В конфиге Caddy нет TLS policy")
    subjects = [item for item in tls_policies[0].get("subjects") or [] if isinstance(item, str)]
    if HOST not in subjects:
        tls_policies[0]["subjects"] = [*subjects, HOST]
        notes.append(f"в TLS policy добавлен {HOST}")
    else:
        notes.append(f"TLS subject {HOST} уже есть")

    logs = server(config).setdefault("logs", {})
    if not isinstance(logs, dict):
        raise SystemExit("Блок логов Caddy повреждён")
    names = logs.get("logger_names")
    if not isinstance(names, dict):
        names = {}
        logs["logger_names"] = names
    if HOST not in names:
        prod_logs = names.get(PROD_HOST)
        names[HOST] = list(prod_logs) if isinstance(prod_logs, list) else ["log1"]
        notes.append(f"лог {HOST} привязан")
    else:
        notes.append(f"лог {HOST} уже есть")

    routes = server(config).get("routes")
    if not isinstance(routes, list):
        raise SystemExit("В конфиге Caddy нет routes")
    if any(isinstance(route, dict) and HOST in hosts_in(route) for route in routes):
        notes.append(f"route {HOST} уже есть")
        return notes

    prod = next((route for route in routes if isinstance(route, dict) and PROD_HOST in hosts_in(route)), None)
    if not isinstance(prod, dict):
        raise SystemExit(f"Не найден route {PROD_HOST}, dev-сайт не добавлен")
    dev_route = json.loads(json.dumps(prod))
    for match in dev_route.get("match") or []:
        if isinstance(match, dict) and isinstance(match.get("host"), list):
            match["host"] = [HOST if item == PROD_HOST else item for item in match["host"]]
    replace_dial(dev_route)
    routes.append(dev_route)
    notes.append(f"добавлен route {HOST} -> {UPSTREAM}")
    return notes


def main() -> None:
    current = request("GET", "/config/")
    if not isinstance(current, dict):
        raise SystemExit("Не удалось прочитать конфиг Caddy")
    original = json.loads(json.dumps(current))
    before_hosts = hosts_in(original)
    notes = ensure(current)
    if current == original:
        for note in notes:
            print(note)
        return

    request("POST", "/load", current, timeout=180)
    loaded = request("GET", "/config/")
    after_hosts = hosts_in(loaded)
    missing = [item for item in before_hosts if item not in after_hosts]
    if missing or HOST not in after_hosts:
        request("POST", "/load", original, timeout=180)
        raise SystemExit(
            "Загрузка убрала прежние сайты, возвращён исходный конфиг: "
            + ", ".join(missing or ["нет " + HOST])
        )
    for note in notes:
        print(note)


if __name__ == "__main__":
    try:
        main()
    except BrokenPipeError:
        sys.exit(0)
