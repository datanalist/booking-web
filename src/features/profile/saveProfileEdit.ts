import type { AuthApi } from "../../api/types";
import type {
  ProfileEditSaveResult,
  ProfileEditValues,
} from "./edit-profile-modal";
import { mapProfileUpdateError } from "./mapProfileUpdateError";

export async function saveProfileEdit(
  auth: Pick<AuthApi, "updateProfile">,
  values: ProfileEditValues,
  close: () => void,
): Promise<ProfileEditSaveResult> {
  try {
    await auth.updateProfile({
      name: values.name,
      phone: values.phone,
      email: values.email,
      ...(values.photoUrl !== undefined ? { photoUrl: values.photoUrl } : {}),
    });
    close();
    return { status: "ok" };
  } catch (error: unknown) {
    return mapProfileUpdateError(error);
  }
}
