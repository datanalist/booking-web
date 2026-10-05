import type { ReactElement } from "react";
import { formatPhoneMask } from "../../../lib/formatPhoneMask";
import { ProfilePhotoFrame } from "./ProfilePhotoFrame";
import { ReadonlyField } from "./ReadonlyField";

export type PersonalCardProps = {
  name: string;
  phone: string;
  email: string;
  photoUrl?: string;
};

export function PersonalCard({
  name,
  phone,
  email,
  photoUrl,
}: PersonalCardProps): ReactElement {
  return (
    <section className="flex w-[300px] shrink-0 flex-col gap-5 font-sans">
      <ProfilePhotoFrame photoUrl={photoUrl} />
      <div className="flex w-full flex-col gap-5">
        <ReadonlyField label="Имя" value={name} />
        <ReadonlyField label="Номер телефона" value={formatPhoneMask(phone)} />
        <ReadonlyField label="Email:" value={email} />
      </div>
    </section>
  );
}
