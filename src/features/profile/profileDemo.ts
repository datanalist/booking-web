/**
 * Временный статус ключа до этапа B: затем заменить на `ApiKeyStatus` из `./api-key-card`.
 * `empty` — кадр 1:17900, `connected` — 636:11531, `error` — 636:11620.
 */
type ProfileDemoApiKeyStatus = "empty" | "connected" | "error";

type ProfileDemo = {
  /** Рубли, как на карточке «34 670 ₽». */
  balanceRub: number;
  apiKey: {
    status: ProfileDemoApiKeyStatus;
    key: string;
  };
};

/** Макет главной профиля, Figma 1:17900: баланс 34 670 ₽, ключ ещё не введён. */
export const PROFILE_DEMO: ProfileDemo = {
  balanceRub: 34670,
  apiKey: {
    status: "empty",
    key: "",
  },
};
