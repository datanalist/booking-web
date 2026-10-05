import type { ApiKeyStatus } from "./api-key-card";

type ProfileDemo = {
  /** Рубли, как на карточке «34 670 ₽». */
  balanceRub: number;
  apiKey: {
    status: ApiKeyStatus;
    key: string;
  };
};

/** Макет главной профиля, Figma 1:17900: баланс 34 670 ₽, ключ ещё не подключён. */
export const PROFILE_DEMO: ProfileDemo = {
  balanceRub: 34670,
  apiKey: {
    status: "disconnected",
    key: "",
  },
};
