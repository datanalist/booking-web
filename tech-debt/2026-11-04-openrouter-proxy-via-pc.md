# OpenRouter через прокси на личном ПК (VPN)

- Дата: 2026-11-04
- Статус: действует
- Затрагивает: «Улучшить фото» (`/api/vallome/upscale-photo`), «Сгенерировать обложку» (`/api/vallome/generate-cover`)

## Проблема

Мини-ПК стоит в РФ. OpenRouter закрывает российские IP: на `POST https://openrouter.ai/api/v1/images` приходит `403 {"error":"Access denied by security policy."}`. Ключ при этом рабочий.

## Костыль

Запросы сервера к OpenRouter идут через Koala Clash (mihomo) на личном ПК разработчика:

- В `/opt/pocketbase/booking-web.env` на мини-ПК добавлены три строки:
  ```
  NODE_USE_ENV_PROXY=1
  HTTPS_PROXY=http://192.168.1.34:7897
  NO_PROXY=localhost,127.0.0.1,api.yookassa.ru,pb.booking.vallome.ru,.vallome.ru
  ```
- Этот env-файл читают контейнеры `booking-web` (прод) и `booking-web-dev`.
- В Koala Clash включён «Allow LAN», порт mixed — 7897 (слушает `:::7897`).
- Код не менялся: Node 24 сам читает `HTTPS_PROXY` при `NODE_USE_ENV_PROXY=1`.

## Чем плох

- Работает, только пока ПК включён, Clash запущен и «Allow LAN» не выключен.
- Если роутер выдаст ПК другой IP, `HTTPS_PROXY` перестанет работать. Тогда генерация падает с обычной ошибкой, а не «не настроено».
- Данные пользователей (фото объектов) проходят через личный ПК.
- `NO_PROXY` — белый список. Новый внешний хост, добавленный в код, по умолчанию пойдёт через прокси.
- Порт прокси без пароля, открыт всей локальной сети.

## Как откатить

1. На мини-ПК удалить три строки (`NODE_USE_ENV_PROXY`, `HTTPS_PROXY`, `NO_PROXY`) из `/opt/pocketbase/booking-web.env`.
2. Пересоздать контейнеры:
   ```
   cd /home/mk/actions-runner/_work/booking-web/booking-web/deploy/app
   docker compose -f docker-compose.yml up -d --no-build --force-recreate
   docker compose -f docker-compose.dev.yml up -d --no-build --force-recreate
   ```
3. По желанию выключить «Allow LAN» в Koala Clash.

После отката апскейл и обложка снова ответят 502 «OpenRouter закрыл доступ с адреса сервера».

## Как решить по-нормальному

Один из вариантов, по возрастанию надёжности:

1. Выделенный прокси на VPS вне РФ (например, tinyproxy или Squid с авторизацией, либо WireGuard-туннель мини-ПК ↔ VPS) и тот же `HTTPS_PROXY` на него. Env-строки остаются, меняется только адрес.
2. Тонкий relay вне РФ (Cloudflare Worker или маленький сервис на VPS), который пересылает запросы `/api/v1/images` и подставляет ключ. Тогда в коде нужна переменная базового URL OpenRouter (сейчас адрес зашит в `vite/upscale/openRouterUpscale.ts` и `vite/cover/openRouterCover.ts`), а ключ уезжает на relay.
3. Вынести вызовы OpenRouter на отдельный сервис за пределами РФ.

Ориентир: `vds-host` (`77.110.119.7`) — но SSH к нему сейчас закрывает соединение, и страна его IP не проверена.

## Критерий закрытия

В env мини-ПК нет адреса личного ПК, генерация работает при выключенном ПК разработчика, запись удалена из этого каталога (или перенесена в `done/`).
