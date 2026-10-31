import { useState } from "react";
import type { Session } from "../../api/types";
import { useSession } from "../../app/session";
import { useFreshCabinetSession } from "./useFreshCabinetSession";
import type { ApiKeyStatus } from "./api-key-card";
import { connectApiKey, type ConnectApiKeyResult } from "./connectApiKey";
import type {
  ProfileEditSaveResult,
  ProfileEditValues,
} from "./edit-profile-modal";
import type { ProfileDialog } from "./ProfileDialog";
import { PROFILE_DEMO } from "./profileDemo";
import { saveProfileEdit } from "./saveProfileEdit";
import { useLogout } from "./useLogout";

export type ProfilePageModel = {
  dialog: ProfileDialog;
  profile: ProfileEditValues;
  balanceRub: number;
  apiKey: string;
  apiKeyStatus: ApiKeyStatus;
  logoutPending: boolean;
  openEdit: () => void;
  openLogout: () => void;
  closeDialog: () => void;
  saveProfile: (values: ProfileEditValues) => Promise<ProfileEditSaveResult>;
  setApiKey: (value: string) => void;
  connectKey: () => void;
  confirmLogout: () => Promise<void>;
};

function profileFromSession(session: Session | null): ProfileEditValues {
  return {
    name: session?.name ?? "",
    phone: session?.phone ?? "",
    email: session?.email ?? "",
    ...(session?.photoUrl !== undefined ? { photoUrl: session.photoUrl } : {}),
  };
}

function apiKeyStatusFromConnect(result: ConnectApiKeyResult): ApiKeyStatus {
  switch (result.status) {
    case "connected":
      return "connected";
    case "error":
      return "error";
  }
}

/** Состояние главной профиля: диалоги, данные сессии и мок ключа. */
export function useProfilePageModel(): ProfilePageModel {
  const { session, auth } = useSession();
  useFreshCabinetSession(session?.userId);
  const logout = useLogout();
  const [dialog, setDialog] = useState<ProfileDialog>("none");
  const profile = profileFromSession(session);
  const [apiKey, setApiKey] = useState(PROFILE_DEMO.apiKey.key);
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus>(
    PROFILE_DEMO.apiKey.status,
  );
  const [logoutPending, setLogoutPending] = useState(false);
  const closeDialog = (): void => {
    setDialog("none");
  };

  return {
    dialog,
    profile,
    balanceRub: session?.balance ?? 0,
    apiKey,
    apiKeyStatus,
    logoutPending,
    openEdit: () => setDialog("edit"),
    openLogout: () => setDialog("logout"),
    closeDialog,
    saveProfile: (values) => saveProfileEdit(auth, values, closeDialog),
    setApiKey,
    connectKey: () => {
      setApiKeyStatus(apiKeyStatusFromConnect(connectApiKey(apiKey)));
    },
    confirmLogout: async () => {
      setLogoutPending(true);
      try {
        await logout();
      } finally {
        setLogoutPending(false);
        setDialog("none");
      }
    },
  };
}
