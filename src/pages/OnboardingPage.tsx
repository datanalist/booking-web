import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../app/session";
import { compressImage } from "../lib/compressImage";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

function formatPhoneMask(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 11);
  const local = d.startsWith("7") ? d.slice(1) : d.startsWith("8") ? d.slice(1) : d;
  const parts = [
    local.slice(0, 3),
    local.slice(3, 6),
    local.slice(6, 8),
    local.slice(8, 10),
  ].filter(Boolean);
  if (parts.length === 0) {
    return "+7";
  }
  let result = "+7";
  if (parts[0]) {
    result += ` (${parts[0]}`;
  }
  if (parts[0]?.length === 3) {
    result += ")";
  }
  if (parts[1]) {
    result += ` ${parts[1]}`;
  }
  if (parts[2]) {
    result += `-${parts[2]}`;
  }
  if (parts[3]) {
    result += `-${parts[3]}`;
  }
  return result;
}

export function OnboardingPage() {
  const { auth } = useSession();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+7");
  const [photo, setPhoto] = useState<string | undefined>();
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onPhotoChange(file: File | null): Promise<void> {
    if (!file) {
      setPhoto(undefined);
      return;
    }
    setPhoto(await compressImage(file));
  }

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setNameError("");
    setPhoneError("");
    setPending(true);
    try {
      await auth.completeOnboarding({
        name,
        phone,
        ...(photo ? { photo } : {}),
      });
      setDone(true);
    } catch (error) {
      const err = error as Error & { code?: string };
      if (err.code === "INVALID_NAME") {
        setNameError(err.message);
      } else if (err.code === "INVALID_PHONE") {
        setPhoneError(err.message);
      } else {
        setNameError(err.message);
      }
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen min-w-[1440px] flex-col items-center justify-center gap-6 bg-white font-sans">
        <h1 className="text-[32px] font-bold text-[var(--color-ink)]">
          Профиль создан
        </h1>
        <p className="text-[16px] text-[var(--color-text)]">
          Можно переходить к объявлениям
        </p>
        <Button onClick={() => navigate("/listings")}>К объявлениям</Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen min-w-[1440px] bg-white font-sans">
      <div className="mx-auto flex w-[320px] flex-col justify-center gap-4 py-10">
        <div className="mb-8 text-[28px] font-bold text-[var(--color-ink)]">
          GlobalStay
        </div>
        <h1 className="text-[32px] font-bold text-[var(--color-ink)]">
          Расскажите о себе
        </h1>
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <label className="flex flex-col gap-2 text-[14px]">
            Фото (необязательно)
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                void onPhotoChange(event.target.files?.[0] ?? null);
              }}
            />
            {photo ? (
              <img
                src={photo}
                alt=""
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : null}
          </label>
          <Input
            label="Имя"
            value={name}
            onChange={setName}
            placeholder="Как к вам обращаться"
            error={nameError}
            maxLength={50}
          />
          <Input
            label="Телефон"
            value={phone}
            onChange={(value) => setPhone(formatPhoneMask(value))}
            placeholder="+7 (___) ___-__-__"
            error={phoneError}
          />
          <Button type="submit" disabled={pending} className="w-full">
            Продолжить
          </Button>
        </form>
      </div>
    </div>
  );
}
