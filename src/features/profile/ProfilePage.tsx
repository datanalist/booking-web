import { useState, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../app/session";
import type { ProfileDialog } from "./ProfileDialog";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileLayout } from "./ProfileLayout";
import { PROFILE_DEMO } from "./profileDemo";

/** Главная профиля. Слоты карточек заполняются на этапе B. */
export function ProfilePage(): ReactElement {
  const { session } = useSession();
  const navigate = useNavigate();
  const [dialog, setDialog] = useState<ProfileDialog>("none");

  return (
    <div
      className="flex h-full min-h-0 w-full flex-1 flex-col"
      data-dialog={dialog}
      data-profile-name={session?.name ?? ""}
      data-profile-email={session?.email ?? ""}
      data-profile-phone={session?.phone ?? ""}
      data-profile-photo={session?.photoUrl ?? ""}
      data-balance={String(PROFILE_DEMO.balanceRub)}
      data-api-key-status={PROFILE_DEMO.apiKey.status}
      data-api-key={PROFILE_DEMO.apiKey.key}
    >
      <ProfileLayout
        header={
          <ProfileHeader
            onEditClick={() => {
              setDialog("edit");
            }}
            onLogoutClick={() => {
              setDialog("logout");
            }}
            onSupportClick={() => {
              navigate("/chats");
            }}
          />
        }
        personal={null}
        apiKey={null}
        balance={null}
      />
    </div>
  );
}
