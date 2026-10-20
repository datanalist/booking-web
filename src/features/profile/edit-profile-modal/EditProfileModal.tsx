import { useId, useRef, type ReactElement, type RefObject } from "react";
import { useFocusTrap } from "../../listings/useFocusTrap";
import { StagePortal } from "../../../app/stagePortal";
import { AvatarCropDialog } from "../../../ui/AvatarCropDialog";
import { ProfileEditFields } from "./ProfileEditFields";
import { ProfileEditHeader } from "./ProfileEditHeader";
import { ProfileEditSaveButton } from "./ProfileEditSaveButton";
import { ProfilePhotoField } from "./ProfilePhotoField";
import type { ProfileEditDraft } from "./useProfileEditDraft";
import { useProfileEditDraft } from "./useProfileEditDraft";
import { useEditProfileEscape } from "./useEditProfileEscape";
import type { ProfileEditSaveHandler } from "./ProfileEditSaveResult";
import type { ProfileEditValues } from "./ProfileEditValues";

export type EditProfileModalProps = {
  open: boolean;
  initial: ProfileEditValues;
  onClose: () => void;
  onSave: ProfileEditSaveHandler;
};

const DIALOG_CLASS = [
  "relative flex w-[438px] flex-col items-center gap-10 overflow-hidden",
  "rounded-xl bg-white p-6 font-sans",
  "shadow-[0px_20px_24px_-4px_rgba(16,24,40,0.08),0px_8px_8px_-4px_rgba(16,24,40,0.03)]",
].join(" ");

type EditProfileFormProps = {
  titleId: string;
  cardRef: RefObject<HTMLFormElement | null>;
  draft: ProfileEditDraft;
  onClose: () => void;
};

function EditProfileForm({
  titleId,
  cardRef,
  draft,
  onClose,
}: EditProfileFormProps): ReactElement {
  return (
    <form
      ref={cardRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      noValidate
      className={DIALOG_CLASS}
      onClick={(event) => {
        event.stopPropagation();
      }}
      onSubmit={draft.onSubmit}
    >
      <div className="flex w-full flex-col items-center gap-6">
        <ProfileEditHeader titleId={titleId} onClose={onClose} />
        <ProfilePhotoField
          photoUrl={draft.photoUrl}
          onPickFile={draft.onPickFile}
          onDelete={draft.onDeletePhoto}
        />
        <ProfileEditFields
          name={draft.name}
          phone={draft.phone}
          email={draft.email}
          errors={draft.errors}
          onNameChange={draft.onNameChange}
          onPhoneChange={draft.onPhoneChange}
          onEmailChange={draft.onEmailChange}
        />
      </div>
      <ProfileEditSaveButton />
      {draft.cropSource !== undefined ? (
        <AvatarCropDialog
          open
          source={draft.cropSource}
          onConfirm={draft.confirmCrop}
          onCancel={draft.cancelCrop}
        />
      ) : null}
    </form>
  );
}

export function EditProfileModal({
  open,
  initial,
  onClose,
  onSave,
}: EditProfileModalProps): ReactElement | null {
  const titleId = useId();
  const cardRef = useRef<HTMLFormElement>(null);
  const draft = useProfileEditDraft({ open, initial, onSave });
  useFocusTrap(cardRef, open);
  useEditProfileEscape({
    open,
    cropSource: draft.cropSource,
    onClose,
    onCancelCrop: draft.cancelCrop,
  });

  if (!open) {
    return null;
  }

  return (
    <StagePortal>
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#525353]/80 font-sans"
      role="presentation"
      onClick={onClose}
    >
      <EditProfileForm
        titleId={titleId}
        cardRef={cardRef}
        draft={draft}
        onClose={onClose}
      />
    </div>
    </StagePortal>
  );
}
