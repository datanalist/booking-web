import { useRef, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { createCabinetPbClient, resolveCabinetDataSource } from "../../api/pocketbase";
import { useSession } from "../../app/session";
import { resolveSupportChatId, supportChatHref } from "../chat";
import { ApiKeyCard } from "./api-key-card";
import { BalanceCard } from "./balance-card";
import { EditProfileModal } from "./edit-profile-modal";
import { LogoutConfirmModal } from "./logout-modal";
import { PersonalCard } from "./personal-card";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileLayout } from "./ProfileLayout";
import { TopupModal } from "./topup/TopupModal";
import { useTopupFlow } from "./topup/useTopupFlow";
import {
  useProfilePageModel,
  type ProfilePageModel,
} from "./useProfilePageModel";

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

/** Вывода средств в моке нет: кнопка карточки остаётся подключённой. */
function ignoreWithdraw(): void {}

/** Главная профиля: личные данные, API-ключ и баланс. */
export function ProfilePage(): ReactElement {
  const navigate = useNavigate();
  const { session } = useSession();
  const model = useProfilePageModel();
  const topup = useTopupFlow();
  const openingSupport = useRef(false);

  function openSupportChat(): void {
    if (resolveCabinetDataSource() !== "pocketbase") {
      navigate(supportChatHref());
      return;
    }
    const userId = session?.userId?.trim() ?? "";
    if (userId.length === 0 || openingSupport.current) {
      return;
    }
    openingSupport.current = true;
    void resolveSupportChatId(createCabinetPbClient(), userId)
      .then((chatId) => {
        navigate(supportChatHref(chatId));
      })
      .catch((error: unknown) => {
        console.error("Не удалось открыть чат поддержки", error);
      })
      .finally(() => {
        openingSupport.current = false;
      });
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      <ProfileLayout
        header={
          <ProfileHeader
            onEditClick={model.openEdit}
            onLogoutClick={model.openLogout}
            onSupportClick={openSupportChat}
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
            amountRub={model.balanceRub}
            onWithdraw={ignoreWithdraw}
            onTopUp={topup.openForm}
          />
        }
      />
      <ProfilePageAlerts model={model} />
      <TopupModal
        open={topup.open}
        pending={topup.pending}
        phase={topup.phase}
        message={topup.message}
        onClose={topup.close}
        onSubmit={topup.submit}
      />
    </div>
  );
}
