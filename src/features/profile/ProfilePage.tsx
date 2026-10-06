import type { ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { ApiKeyCard } from "./api-key-card";
import { BalanceCard } from "./balance-card";
import { EditProfileModal } from "./edit-profile-modal";
import { LogoutConfirmModal } from "./logout-modal";
import { PersonalCard } from "./personal-card";
import { PROFILE_DEMO } from "./profileDemo";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileLayout } from "./ProfileLayout";
import {
  useProfilePageModel,
  type ProfilePageModel,
} from "./useProfilePageModel";

/** Вывода средств в моке нет: кнопка карточки остаётся подключённой. */
function ignoreWithdraw(): void {}

function ProfilePageAlerts({ model }: { model: ProfilePageModel }): ReactElement {
  return (
    <>
      <EditProfileModal
        open={model.dialog === "edit"}
        initial={model.profile}
        onClose={model.closeDialog}
        onSave={model.saveProfile}
      />
      <LogoutConfirmModal
        open={model.dialog === "logout"}
        pending={model.logoutPending}
        onCancel={model.closeDialog}
        onConfirm={() => {
          void model.confirmLogout();
        }}
      />
    </>
  );
}

/** Главная профиля: личные данные, API-ключ и баланс. */
export function ProfilePage(): ReactElement {
  const navigate = useNavigate();
  const model = useProfilePageModel();

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      <ProfileLayout
        header={
          <ProfileHeader
            onEditClick={model.openEdit}
            onLogoutClick={model.openLogout}
            onSupportClick={() => {
              navigate("/chats");
            }}
          />
        }
        personal={
          <PersonalCard
            name={model.profile.name}
            phone={model.profile.phone}
            email={model.profile.email}
            photoUrl={model.profile.photoUrl}
          />
        }
        apiKey={
          <ApiKeyCard
            status={model.apiKeyStatus}
            apiKey={model.apiKey}
            onApiKeyChange={model.setApiKey}
            onConnect={model.connectKey}
          />
        }
        balance={
          <BalanceCard
            amountRub={PROFILE_DEMO.balanceRub}
            onWithdraw={ignoreWithdraw}
          />
        }
      />
      <ProfilePageAlerts model={model} />
    </div>
  );
}
