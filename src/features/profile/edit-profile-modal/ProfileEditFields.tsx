import type { ReactElement } from "react";
import { NAME_MAX } from "../../../config";
import { Input } from "../../../ui/Input";
import type { ProfileEditFieldErrors } from "./ProfileEditFieldErrors";

type ProfileEditFieldsProps = {
  name: string;
  phone: string;
  email: string;
  errors: ProfileEditFieldErrors;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onEmailChange: (value: string) => void;
};

export function ProfileEditFields(props: ProfileEditFieldsProps): ReactElement {
  return (
    <div className="flex w-full flex-col gap-5">
      <Input
        label="Имя"
        value={props.name}
        onChange={props.onNameChange}
        error={props.errors.name}
        maxLength={NAME_MAX}
        variant="auth"
      />
      <Input
        label="Номер телефона"
        value={props.phone}
        onChange={props.onPhoneChange}
        error={props.errors.phone}
        variant="auth"
      />
      <Input
        label="Email"
        type="email"
        value={props.email}
        onChange={props.onEmailChange}
        error={props.errors.email}
        variant="auth"
      />
    </div>
  );
}
