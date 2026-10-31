import type { ApiKeyStatus } from "./api-key-card";

type ProfileDemo = {
  apiKey: {
    status: ApiKeyStatus;
    key: string;
  };
};

/** Макет API-ключа на главной профиля, пока ключ не подключён. */
export const PROFILE_DEMO: ProfileDemo = {
  apiKey: {
    status: "disconnected",
    key: "",
  },
};
