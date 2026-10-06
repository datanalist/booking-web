import { useEffect, useRef, useState, type FormEvent } from "react";
import { formatPhoneMask } from "../../../lib/formatPhoneMask";
import type { ProfileEditFieldErrors } from "./ProfileEditFieldErrors";
import type {
  ProfileEditSaveHandler,
  ProfileEditSaveResult,
} from "./ProfileEditSaveResult";
import type { ProfileEditValues } from "./ProfileEditValues";
import { parseProfileEditValues } from "./parseProfileEditValues";
import { useProfilePhotoDraft } from "./useProfilePhotoDraft";

export type ProfileEditDraft = {
  name: string;
  phone: string;
  email: string;
  photoUrl: string | undefined;
  errors: ProfileEditFieldErrors;
  cropSource: string | undefined;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPickFile: (file: File) => void;
  onDeletePhoto: () => void;
  confirmCrop: (croppedDataUrl: string) => void;
  cancelCrop: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

type UseProfileEditDraftArgs = {
  open: boolean;
  initial: ProfileEditValues;
  onSave: ProfileEditSaveHandler;
};

type ProfileEditFieldState = {
  name: string;
  phone: string;
  email: string;
  errors: ProfileEditFieldErrors;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  applyFields: (values: ProfileEditValues) => void;
  setErrors: (errors: ProfileEditFieldErrors) => void;
};

function useApplyInitialWhenOpened(
  open: boolean,
  initial: ProfileEditValues,
  apply: (values: ProfileEditValues) => void,
): void {
  const initialRef = useRef(initial);
  const applyRef = useRef(apply);
  initialRef.current = initial;
  applyRef.current = apply;

  useEffect(() => {
    if (!open) {
      return;
    }
    applyRef.current(initialRef.current);
  }, [open]);
}

function useProfileEditFields(initial: ProfileEditValues): ProfileEditFieldState {
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(() => formatPhoneMask(initial.phone));
  const [email, setEmail] = useState(initial.email);
  const [errors, setErrors] = useState<ProfileEditFieldErrors>({});

  return {
    name,
    phone,
    email,
    errors,
    onNameChange: setName,
    onPhoneChange: (value: string) => {
      setPhone(formatPhoneMask(value));
    },
    onEmailChange: setEmail,
    applyFields: (values: ProfileEditValues) => {
      setName(values.name);
      setPhone(formatPhoneMask(values.phone));
      setEmail(values.email);
      setErrors({});
    },
    setErrors,
  };
}

function currentDraft(
  name: string,
  phone: string,
  email: string,
  photoUrl: string | undefined,
): ProfileEditValues {
  return {
    name,
    phone,
    email,
    ...(photoUrl !== undefined ? { photoUrl } : {}),
  };
}

function isSaveErrors(
  outcome: void | ProfileEditSaveResult,
): outcome is Extract<ProfileEditSaveResult, { status: "errors" }> {
  return outcome !== undefined && outcome.status === "errors";
}

async function submitDraft(
  draft: ProfileEditValues,
  onSave: ProfileEditSaveHandler,
  setErrors: (errors: ProfileEditFieldErrors) => void,
): Promise<void> {
  const result = parseProfileEditValues(draft);
  if (result.status === "errors") {
    setErrors(result.errors);
    return;
  }
  const outcome = await onSave(result.values);
  if (isSaveErrors(outcome)) {
    setErrors(outcome.errors);
  }
}

export function useProfileEditDraft({
  open,
  initial,
  onSave,
}: UseProfileEditDraftArgs): ProfileEditDraft {
  const fields = useProfileEditFields(initial);
  const photo = useProfilePhotoDraft(initial.photoUrl);
  useApplyInitialWhenOpened(open, initial, (values) => {
    fields.applyFields(values);
    photo.applyPhoto(values.photoUrl);
  });

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    await submitDraft(
      currentDraft(fields.name, fields.phone, fields.email, photo.photoUrl),
      onSave,
      fields.setErrors,
    );
  }

  return {
    name: fields.name,
    phone: fields.phone,
    email: fields.email,
    photoUrl: photo.photoUrl,
    errors: fields.errors,
    cropSource: photo.cropSource,
    onNameChange: fields.onNameChange,
    onPhoneChange: fields.onPhoneChange,
    onEmailChange: fields.onEmailChange,
    onPickFile: photo.onPickFile,
    onDeletePhoto: photo.onDeletePhoto,
    confirmCrop: photo.confirmCrop,
    cancelCrop: photo.cancelCrop,
    onSubmit,
  };
}
