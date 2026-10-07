type LocalDevAuthModule = {
  applyLocalDevAuth?: (storage: Storage) => void;
};

const localDevAuthModules = import.meta.glob<LocalDevAuthModule>(
  "./localDevAuth.local.ts",
  { eager: true },
);

/** Нет локального модуля — вход остаётся как в репозитории. */
export function applyOptionalLocalDevAuth(storage: Storage): void {
  const local = localDevAuthModules["./localDevAuth.local.ts"];
  local?.applyLocalDevAuth?.(storage);
}
