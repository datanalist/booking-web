import { useEffect, useState } from "react";

const STOCK_AVATAR = "/avatar-placeholder.png";
const ACCOUNT_PHOTO_FALLBACK = "/onboarding/avatar-placeholder.svg";

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

/** Пустая строка и стоковый файл отбрасываются. Остальной адрес — кандидат на показ. */
export function accountPhotoCandidate(photoUrl: string | undefined): string | undefined {
  const trimmed = trimmedPhoto(photoUrl);
  if (trimmed.length === 0 || trimmed.includes(STOCK_AVATAR)) {
    return undefined;
  }
  return trimmed;
}

/** Пусто и стоковый портрет — это отсутствие фото. Чужой адрес ещё не подтверждён. */
export function immediateAccountPhoto(photoUrl: string | undefined): string | undefined {
  const candidate = accountPhotoCandidate(photoUrl);
  if (candidate === undefined || isRemotePhoto(candidate)) {
    return undefined;
  }
  return candidate;
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
    const candidate = accountPhotoCandidate(trimmed);
    if (candidate === undefined || !isRemotePhoto(candidate)) {
      setSrc(candidate);
      return;
    }
    let cancelled = false;
    setSrc(undefined);
    void fetch(candidate, { cache: "no-store" })
      .then((response) => {
        if (!cancelled) {
          setSrc(response.ok ? candidate : undefined);
        }
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        const probe = new Image();
        const fresh = cacheBusted(candidate);
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

/** Портрет для картинки: удалённый файл только после проверки, иначе силуэт. */
export function useVisibleAccountPhoto(photoUrl: string | undefined): string {
  return useAccountPhotoSrc(photoUrl) ?? ACCOUNT_PHOTO_FALLBACK;
}
