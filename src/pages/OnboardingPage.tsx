import { FormEvent, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../app/session";
import { canSubmitOnboardingProfile } from "../lib/canSubmitOnboardingProfile";
import {
  AVATAR_PHOTO_SCALE_DEFAULT,
  clampAvatarPhotoScale,
} from "../lib/clampAvatarPhotoScale";
import { compressImage } from "../lib/compressImage";
import { cropCenteredAvatar } from "../lib/cropCenteredAvatar";
import { formatPhoneMask } from "../lib/formatPhoneMask";
import { AvatarPhotoScaleControl } from "../ui/AvatarPhotoScaleControl";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

export function OnboardingPage() {
  const { auth } = useSession();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropGenerationRef = useRef(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+7");
  const [photoSource, setPhotoSource] = useState<string | undefined>();
  const [photoScale, setPhotoScale] = useState(AVATAR_PHOTO_SCALE_DEFAULT);
  const [photo, setPhoto] = useState<string | undefined>();
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  const canSubmit = canSubmitOnboardingProfile({ name, phone, photo });

  async function applyCrop(source: string, scale: number): Promise<void> {
    const generation = ++cropGenerationRef.current;
    const cropped = await cropCenteredAvatar(source, { scale });
    if (generation !== cropGenerationRef.current) {
      return;
    }
    setPhoto(cropped);
  }

  async function onPhotoChange(file: File | null): Promise<void> {
    if (!file) {
      return;
    }
    const source = await compressImage(file);
    const scale = AVATAR_PHOTO_SCALE_DEFAULT;
    setPhotoSource(source);
    setPhotoScale(scale);
    await applyCrop(source, scale);
  }

  function onPhotoScaleChange(value: number): void {
    if (!photoSource) {
      return;
    }
    const scale = clampAvatarPhotoScale(value);
    setPhotoScale(scale);
    void applyCrop(photoSource, scale);
  }

  function clearPhoto(): void {
    cropGenerationRef.current += 1;
    setPhoto(undefined);
    setPhotoSource(undefined);
    setPhotoScale(AVATAR_PHOTO_SCALE_DEFAULT);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function openFilePicker(): void {
    fileInputRef.current?.click();
  }

  async function onClose(): Promise<void> {
    await auth.logout();
    navigate("/login");
  }

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!canSubmit || pending) {
      return;
    }
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
      <div className="relative flex min-h-screen min-w-[1440px] items-center justify-center bg-white font-sans">
        <img
          src="/onboarding/logo.svg"
          alt="GlobalStay"
          width={181}
          height={60}
          className="absolute left-[calc(8.33%+2.5px)] top-8 h-[60px] w-[181px]"
        />
        <div className="flex w-[438px] flex-col items-center gap-10 rounded-[12px] bg-white p-6">
          <div className="flex w-full flex-col items-start gap-4">
            <h1 className="text-[24px] font-bold leading-[1.2] text-[var(--color-ink)]">
              Профиль создан
            </h1>
            <p className="w-full text-[16px] leading-[1.45] text-[var(--color-ink)]">
              Создайте свое первое объявление!
            </p>
          </div>
          <Button
            className="w-full !rounded-[8px]"
            onClick={() => navigate("/listings")}
          >
            Продолжить
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen min-w-[1440px] items-center justify-center bg-[#525353] font-sans">
      <form
        className="flex w-[438px] flex-col items-center gap-10 rounded-[12px] bg-white p-6 shadow-[0px_20px_24px_-4px_rgba(16,24,40,0.08),0px_8px_8px_-4px_rgba(16,24,40,0.03)]"
        role="dialog"
        aria-labelledby="onboarding-title"
        onSubmit={onSubmit}
      >
        <div className="flex w-full flex-col items-center gap-6">
          <div className="flex w-full items-center justify-between">
            <h1
              id="onboarding-title"
              className="text-[24px] font-bold leading-[1.2] text-[var(--color-ink)]"
            >
              Заполните данные
            </h1>
            <button
              type="button"
              aria-label="Закрыть"
              onClick={() => {
                void onClose();
              }}
              className="flex items-center justify-center rounded-[8px] p-[10px]"
            >
              <img
                src="/onboarding/close.svg"
                alt=""
                width={20}
                height={20}
              />
            </button>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={openFilePicker}
              className="relative size-[100px] shrink-0 cursor-pointer border-0 bg-transparent p-0"
              aria-label="Выбрать фото"
            >
              <span className="absolute inset-0 overflow-hidden rounded-full border border-solid border-[#f88a2a] shadow-[0px_10px_20px_rgba(0,0,0,0.03)]">
                {photoSource ? (
                  <img
                    src={photoSource}
                    alt=""
                    className="size-full object-cover object-center"
                    style={{ transform: `scale(${photoScale})` }}
                  />
                ) : (
                  <span className="flex size-full items-center justify-center">
                    <img
                      src="/onboarding/avatar-placeholder.svg"
                      alt=""
                      width={41}
                      height={49}
                      className="h-[49px] w-[41px]"
                    />
                  </span>
                )}
              </span>
              <span className="pointer-events-none absolute bottom-0 right-0 size-6 overflow-visible">
                <img
                  src="/onboarding/photo-edit.svg"
                  alt=""
                  width={104}
                  height={104}
                  className="absolute inset-[-125%_-166.67%_-208.33%_-166.67%] max-w-none"
                />
              </span>
            </button>
            {photoSource ? (
              <>
                <AvatarPhotoScaleControl
                  value={photoScale}
                  onChange={onPhotoScaleChange}
                />
                <button
                  type="button"
                  className="rounded-[30px] py-1 text-[12px] leading-[1.3] text-[#f88a2a] underline"
                  onClick={clearPhoto}
                >
                  Удалить фото
                </button>
              </>
            ) : null}
          </div>

          <div className="flex w-full flex-col gap-5">
            <Input
              label="Имя"
              value={name}
              onChange={setName}
              placeholder="Введите имя"
              error={nameError}
              maxLength={50}
            />
            <Input
              label="Номер телефона"
              value={phone}
              onChange={(value) => setPhone(formatPhoneMask(value))}
              placeholder="Введите номер телефона"
              error={phoneError}
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={pending || !canSubmit}
          className="w-full !rounded-[8px]"
        >
          Продолжить
        </Button>
      </form>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          void onPhotoChange(event.target.files?.[0] ?? null);
        }}
      />
    </div>
  );
}
