import { useEffect, useState } from "react";

const STOCK_AVATAR = "/avatar-placeholder.png";

function trimmedPhoto(photoUrl: string | undefined): string {
  return photoUrl?.trim() ?? "";
}

function isRemotePhoto(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function cacheBusted(url: string): string {
  const joiner = url.includes("?") ? "&" : "?";
  return `${url}${joiner}pbcache=${Date.now()}`;
}

/** Пусто и стоковый портрет — это отсутствие фото. Чужой адрес ещё не подтверждён. */
export function immediateAccountPhoto(photoUrl: string | undefined): string | undefined {
  const trimmed = trimmedPhoto(photoUrl);
  if (trimmed.length === 0 || trimmed.includes(STOCK_AVATAR)) {
    return undefined;
  }
  if (isRemotePhoto(trimmed)) {
    return undefined;
  }
  return trimmed;
}

/**
 * Адрес фото аккаунта.
 * Удалённый файл показываем только после ответа сервера без кэша:
 * пропавший файл не должен оставаться стоковым снимком из памяти браузера.
 */
export function useAccountPhotoSrc(photoUrl: string | undefined): string | undefined {
  const trimmed = trimmedPhoto(photoUrl);
  const [src, setSrc] = useState<string | undefined>(() => immediateAccountPhoto(photoUrl));

  useEffect(() => {
    if (!isRemotePhoto(trimmed) || trimmed.includes(STOCK_AVATAR)) {
      setSrc(immediateAccountPhoto(trimmed));
      return;
    }
    let cancelled = false;
    setSrc(undefined);
    void fetch(trimmed, { cache: "no-store" })
      .then((response) => {
        if (!cancelled) {
          setSrc(response.ok ? trimmed : undefined);
        }
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        const probe = new Image();
        const fresh = cacheBusted(trimmed);
        probe.onload = () => {
          if (!cancelled) {
            setSrc(fresh);
          }
        };
        probe.onerror = () => {
          if (!cancelled) {
            setSrc(undefined);
          }
        };
        probe.src = fresh;
      });
    return () => {
      cancelled = true;
    };
  }, [trimmed]);

  return src;
}
