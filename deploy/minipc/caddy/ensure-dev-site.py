#!/usr/bin/env python3
"""Добавляет dev.app.booking.vallome.ru в уже запущенный Caddy точечными вызовами.

POST /load всего конфига не используется. Subject дописывается только в политику
с уже непустым списком, где есть прод-хост: пустой subjects — это catch-all,
и запись [dev-host] сузила бы выпуск сертификатов до одного имени.
Лог без найденного продового logger_names не выдумывается. Route добавляется
отдельно. После каждой записи конфиг сверяется с исходным: допустимо только
добавление dev. Иначе точечный откат, даже если повторный GET упал.
/etc/caddy/Caddyfile скрипт не меняет.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from typing import Any

HOST = "dev.app.booking.vallome.ru"
UPSTREAM = "127.0.0.1:8081"
PROD_HOST = "app.booking.vallome.ru"
PROD_UPSTREAM = "127.0.0.1:8080"
ADMIN = os.environ.get("CADDY_ADMIN", "http://127.0.0.1:2019").rstrip("/")


class CaddyAPIError(Exception):
    pass


def request(
    method: str,
    path: str,
    body: object | None = None,
    timeout: int = 30,
    if_match: str | None = None,
) -> tuple[object, str | None]:
    data = None if body is None else json.dumps(body).encode()
    headers: dict[str, str] = {}
    if data is not None:
        headers["Content-Type"] = "application/json"
    if if_match:
        headers["If-Match"] = if_match
    req = urllib.request.Request(ADMIN + path, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            etag = resp.headers.get("ETag")
            raw = resp.read()
            if not raw:
                return None, etag
            return json.loads(raw), etag
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace")
        raise CaddyAPIError(f"Caddy API {method} {path} -> {exc.code}: {detail}") from exc
    except urllib.error.URLError as exc:
        raise CaddyAPIError(f"Caddy API недоступен ({ADMIN}): {exc.reason}") from exc


def hosts_in(config: object) -> list[str]:
    found: list[str] = []

    def walk(node: object) -> None:
        if isinstance(node, dict):
            host = node.get("host")
            if isinstance(host, list) and all(isinstance(item, str) for item in host):
                if "dial" not in node and "handler" not in node:
                    found.extend(item for item in host if item not in found)
            for value in node.values():
                walk(value)
        elif isinstance(node, list):
            for item in node:
                walk(item)

    walk(config)
    return found


def server(config: dict[str, Any]) -> dict[str, Any]:
    servers = config.get("apps", {}).get("http", {}).get("servers", {})
    if not isinstance(servers, dict) or not isinstance(servers.get("srv0"), dict):
        raise CaddyAPIError("В конфиге Caddy нет сервера srv0")
    return servers["srv0"]


def policies_of(config: dict[str, Any]) -> list[Any] | None:
    policies = (
        config.get("apps", {})
        .get("tls", {})
        .get("automation", {})
        .get("policies")
    )
    return policies if isinstance(policies, list) else None


def non_empty_subjects(policy: object) -> list[str] | None:
    if not isinstance(policy, dict):
        return None
    subjects = policy.get("subjects")
    if not isinstance(subjects, list) or not subjects:
        return None
    if not all(isinstance(item, str) and item.strip() != "" for item in subjects):
        return None
    return subjects


def prod_policy_index(config: dict[str, Any]) -> int | None:
    policies = policies_of(config)
    if policies is None:
        return None
    for index, policy in enumerate(policies):
        subjects = non_empty_subjects(policy)
        if subjects is not None and PROD_HOST in subjects:
            return index
    return None


def logger_names_of(config: dict[str, Any]) -> dict[str, Any] | None:
    logs = server(config).get("logs")
    if not isinstance(logs, dict):
        return None
    names = logs.get("logger_names")
    return names if isinstance(names, dict) else None


def prod_logger(config: dict[str, Any]) -> list[str] | None:
    names = logger_names_of(config)
    if names is None:
        return None
    prod_logs = names.get(PROD_HOST)
    if isinstance(prod_logs, list) and prod_logs and all(isinstance(item, str) and item for item in prod_logs):
        return list(prod_logs)
    return None


def routes_of(config: dict[str, Any]) -> list[Any]:
    routes = server(config).get("routes")
    if not isinstance(routes, list):
        raise CaddyAPIError("В конфиге Caddy нет routes")
    return routes


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


def dials_in(node: object) -> list[str]:
    found: list[str] = []

    def walk(current: object) -> None:
        if isinstance(current, dict):
            for key, value in current.items():
                if key == "dial" and isinstance(value, str):
                    found.append(value)
                else:
                    walk(value)
        elif isinstance(current, list):
            for item in current:
                walk(item)

    walk(node)
    return found


def is_dev_route(route: object) -> bool:
    if not isinstance(route, dict):
        return False
    hosts = hosts_in(route)
    dials = dials_in(route)
    return HOST in hosts and PROD_HOST not in hosts and UPSTREAM in dials and PROD_UPSTREAM not in dials


def dev_route_from(prod: dict[str, Any]) -> dict[str, Any]:
    route = json.loads(json.dumps(prod))
    for match in route.get("match") or []:
        if isinstance(match, dict) and isinstance(match.get("host"), list):
            match["host"] = [HOST if item == PROD_HOST else item for item in match["host"]]
    replace_dial(route)
    if not is_dev_route(route):
        raise CaddyAPIError(f"Не удалось собрать route {HOST} -> {UPSTREAM}")
    return route


def diff_paths(left: object, right: object, path: str = "") -> list[str]:
    if left == right:
        return []
    if isinstance(left, dict) and isinstance(right, dict):
        found: list[str] = []
        for key in sorted(set(left) | set(right), key=str):
            found.extend(diff_paths(left.get(key), right.get(key), f"{path}/{key}"))
            if len(found) > 12:
                return found[:12]
        return found
    if isinstance(left, list) and isinstance(right, list):
        found = []
        if len(left) != len(right):
            return [f"{path or '/'}[{len(left)}->{len(right)}]"]
        for index, (before, after) in enumerate(zip(left, right)):
            found.extend(diff_paths(before, after, f"{path}/{index}"))
            if len(found) > 12:
                return found[:12]
        return found
    return [path or "/"]


def strip_allowed_additions(
    before: dict[str, Any],
    after: dict[str, Any],
    allow: set[str],
) -> dict[str, Any]:
    """Убирает из копии after только уже выполненные добавления dev."""
    result: dict[str, Any] = json.loads(json.dumps(after))
    if "subject" in allow:
        before_policies = policies_of(before)
        after_policies = policies_of(result)
        if (
            isinstance(before_policies, list)
            and isinstance(after_policies, list)
            and len(before_policies) == len(after_policies)
        ):
            for before_policy, after_policy in zip(before_policies, after_policies):
                before_subjects = non_empty_subjects(before_policy)
                if before_subjects is None or not isinstance(after_policy, dict):
                    continue
                after_subjects = after_policy.get("subjects")
                if after_subjects == [*before_subjects, HOST]:
                    after_policy["subjects"] = list(before_subjects)

    if "log" in allow:
        before_names = logger_names_of(before)
        after_names = logger_names_of(result)
        prod_logs = prod_logger(before)
        if (
            isinstance(before_names, dict)
            and isinstance(after_names, dict)
            and HOST not in before_names
            and HOST in after_names
            and prod_logs is not None
            and after_names[HOST] == prod_logs
        ):
            del after_names[HOST]

    if "route" in allow:
        try:
            before_routes = routes_of(before)
            after_routes = routes_of(result)
        except CaddyAPIError:
            return result
        if len(after_routes) == len(before_routes) + 1 and after_routes[:-1] == before_routes:
            if is_dev_route(after_routes[-1]):
                after_routes.pop()
    return result


def unexpected_delta(before: dict[str, Any], after: object, allow: set[str]) -> list[str]:
    if not isinstance(after, dict):
        return ["корень конфига не объект"]
    stripped = strip_allowed_additions(before, after, allow)
    return diff_paths(before, stripped)


class Plan:
    def __init__(self) -> None:
        self.notes: list[str] = []
        self.warnings: list[str] = []
        self.subject_index: int | None = None
        self.logger: list[str] | None = None
        self.route: dict[str, Any] | None = None

    @property
    def writes(self) -> bool:
        return self.subject_index is not None or self.logger is not None or self.route is not None


def build_plan(config: dict[str, Any]) -> Plan:
    plan = Plan()
    index = prod_policy_index(config)
    policies = policies_of(config) or []
    if index is None:
        plan.warnings.append(
            "TLS subject пропущен: нет политики с непустым subjects, где есть прод-хост. "
            "Catch-all не сужаем"
        )
    else:
        subjects = non_empty_subjects(policies[index]) or []
        if HOST in subjects:
            plan.notes.append(f"TLS subject {HOST} уже есть")
        else:
            plan.subject_index = index
            plan.notes.append(f"в TLS policy {index} добавлен {HOST}")

    names = logger_names_of(config)
    if isinstance(names, dict) and HOST in names:
        plan.notes.append(f"лог {HOST} уже есть")
    else:
        prod_logs = prod_logger(config)
        if prod_logs is None:
            plan.warnings.append(
                f"лог {HOST} пропущен: у {PROD_HOST} нет logger_names, имя логгера не выдумываем"
            )
        else:
            plan.logger = prod_logs
            plan.notes.append(f"лог {HOST} привязан")

    routes = routes_of(config)
    if any(isinstance(route, dict) and HOST in hosts_in(route) for route in routes):
        plan.notes.append(f"route {HOST} уже есть")
        return plan
    prod = next((route for route in routes if isinstance(route, dict) and PROD_HOST in hosts_in(route)), None)
    if not isinstance(prod, dict):
        raise CaddyAPIError(f"Не найден route {PROD_HOST}, dev-сайт не добавлен")
    plan.route = dev_route_from(prod)
    plan.notes.append(f"добавлен route {HOST} -> {UPSTREAM}")
    return plan


def post_with_match(path: str, body: object, timeout: int) -> None:
    etag = None
    try:
        _, etag = request("GET", path, timeout=30)
    except CaddyAPIError as exc:
        if "-> 404" not in str(exc):
            raise
    request("POST", path, body, timeout=timeout, if_match=etag)


def delete_path(path: str) -> None:
    request("DELETE", path, timeout=180)


def rollback(applied: list[tuple[str, str]]) -> None:
    errors: list[str] = []
    for kind, path in reversed(applied):
        try:
            delete_path(path)
        except CaddyAPIError as exc:
            errors.append(f"{kind}: {exc}")
    if errors:
        raise CaddyAPIError("точечный откат не завершился: " + "; ".join(errors))


def confirm_restored(original: dict[str, Any]) -> None:
    try:
        restored, _ = request("GET", "/config/", timeout=30)
    except CaddyAPIError as exc:
        raise CaddyAPIError(f"повторный GET после отката не удался: {exc}") from exc
    if restored != original:
        delta = diff_paths(original, restored)
        raise CaddyAPIError("после отката конфиг не совпал с исходным: " + ", ".join(delta))


def apply_plan(original: dict[str, Any], plan: Plan) -> None:
    applied: list[tuple[str, str]] = []
    allow: set[str] = set()
    try:
        if plan.subject_index is not None:
            policies = policies_of(original) or []
            subjects = non_empty_subjects(policies[plan.subject_index]) or []
            subject_path = f"/config/apps/tls/automation/policies/{plan.subject_index}/subjects"
            post_with_match(subject_path, HOST, timeout=180)
            applied.append(("subject", f"{subject_path}/{len(subjects)}"))
            allow.add("subject")
            loaded, _ = request("GET", "/config/", timeout=30)
            delta = unexpected_delta(original, loaded, allow)
            if delta:
                raise CaddyAPIError("отличие больше добавления dev: " + ", ".join(delta))
        if plan.logger is not None:
            parent = "/config/apps/http/servers/srv0/logs/logger_names"
            post_with_match(f"{parent}/{HOST}", plan.logger, timeout=180)
            applied.append(("log", f"{parent}/{HOST}"))
            allow.add("log")
            loaded, _ = request("GET", "/config/", timeout=30)
            delta = unexpected_delta(original, loaded, allow)
            if delta:
                raise CaddyAPIError("отличие больше добавления dev: " + ", ".join(delta))
        if plan.route is not None:
            routes = routes_of(original)
            route_path = "/config/apps/http/servers/srv0/routes"
            post_with_match(route_path, plan.route, timeout=180)
            applied.append(("route", f"{route_path}/{len(routes)}"))
            allow.add("route")
        loaded, _ = request("GET", "/config/", timeout=30)
        delta = unexpected_delta(original, loaded, allow)
        if delta:
            raise CaddyAPIError("отличие больше добавления dev: " + ", ".join(delta))
        if not isinstance(loaded, dict) or HOST not in hosts_in(loaded):
            raise CaddyAPIError(f"после записи нет маршрута {HOST}")
        missing = [item for item in hosts_in(original) if item not in hosts_in(loaded)]
        if missing:
            raise CaddyAPIError("пропали прежние хосты: " + ", ".join(missing))
    except Exception as exc:
        try:
            rollback(applied)
            confirm_restored(original)
        except CaddyAPIError as rollback_exc:
            raise CaddyAPIError(f"{exc}; откат: {rollback_exc}") from exc
        raise CaddyAPIError(f"изменение откачено, конфиг совпал с исходным: {exc}") from exc


def main() -> None:
    current, _ = request("GET", "/config/")
    if not isinstance(current, dict):
        raise CaddyAPIError("Не удалось прочитать конфиг Caddy")
    original: dict[str, Any] = json.loads(json.dumps(current))
    plan = build_plan(original)
    for warning in plan.warnings:
        print(warning, file=sys.stderr)
    if not plan.writes:
        for note in plan.notes:
            print(note)
        return
    apply_plan(original, plan)
    for note in plan.notes:
        print(note)


def _sample_config() -> dict[str, Any]:
    return {
        "apps": {
            "http": {
                "servers": {
                    "srv0": {
                        "logs": {"logger_names": {PROD_HOST: ["log0"]}},
                        "routes": [
                            {"match": [{"host": [PROD_HOST]}], "handle": [{"handler": "reverse_proxy", "upstreams": [{"dial": PROD_UPSTREAM}]}]},
                            {"match": [{"host": ["booking.vallome.ru"]}]}
                        ],
                    }
                }
            },
            "tls": {"automation": {"policies": [{"subjects": [PROD_HOST, "booking.vallome.ru"]}]}},
        }
    }


def _run_checks() -> None:
    original = _sample_config()
    added = json.loads(json.dumps(original))
    added["apps"]["tls"]["automation"]["policies"][0]["subjects"].append(HOST)
    added["apps"]["http"]["servers"]["srv0"]["logs"]["logger_names"][HOST] = ["log0"]
    route = dev_route_from(original["apps"]["http"]["servers"]["srv0"]["routes"][0])
    added["apps"]["http"]["servers"]["srv0"]["routes"].append(route)
    if unexpected_delta(original, added, {"subject", "log", "route"}):
        raise SystemExit("допустимое добавление dev распознано как чужое")

    catch_all = json.loads(json.dumps(original))
    catch_all["apps"]["tls"]["automation"]["policies"][0] = {}
    narrowed = json.loads(json.dumps(catch_all))
    narrowed["apps"]["tls"]["automation"]["policies"][0] = {"subjects": [HOST]}
    if not unexpected_delta(catch_all, narrowed, {"subject", "log", "route"}):
        raise SystemExit("сужение catch-all до dev-хоста не замечено")
    plan = build_plan(catch_all)
    if plan.subject_index is not None:
        raise SystemExit("catch-all получил subject")

    empty = json.loads(json.dumps(original))
    empty["apps"]["tls"]["automation"]["policies"][0]["subjects"] = []
    plan_empty = build_plan(empty)
    if plan_empty.subject_index is not None:
        raise SystemExit("пустой subjects получил dev-хост")

    invented = json.loads(json.dumps(added))
    invented["apps"]["http"]["servers"]["srv0"]["logs"]["logger_names"][HOST] = ["log1"]
    if not unexpected_delta(original, invented, {"subject", "log", "route"}):
        raise SystemExit("выдуманный log1 принят")

    no_logger = json.loads(json.dumps(original))
    del no_logger["apps"]["http"]["servers"]["srv0"]["logs"]["logger_names"][PROD_HOST]
    plan_log = build_plan(no_logger)
    if plan_log.logger is not None:
        raise SystemExit("без продового логгера подставлено имя")

    extra = json.loads(json.dumps(added))
    extra["apps"]["tls"]["certificates"] = {"automate": [HOST]}
    if not unexpected_delta(original, extra, {"subject", "log", "route"}):
        raise SystemExit("чужое поле tls не замечено")
    two = _sample_config()
    two["apps"]["tls"]["automation"]["policies"].insert(0, {})
    if build_plan(two).subject_index != 1:
        raise SystemExit("subject попал не в политику прод-хоста")
    print("ensure-dev-site checks ok")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--check":
        _run_checks()
    else:
        try:
            main()
        except BrokenPipeError:
            sys.exit(0)
        except CaddyAPIError as exc:
            raise SystemExit(str(exc)) from exc
