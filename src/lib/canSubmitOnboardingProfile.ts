type CanSubmitOnboardingProfileInput = {
  name: string;
  phone: string;
  photo?: string;
};

export function canSubmitOnboardingProfile(
  input: CanSubmitOnboardingProfileInput,
): boolean {
  const nameOk = input.name.trim().length >= 2;
  const phoneDigits = input.phone.replace(/\D/g, "");
  const local =
    phoneDigits.startsWith("7") || phoneDigits.startsWith("8")
      ? phoneDigits.slice(1)
      : phoneDigits;
  return nameOk && local.length >= 10;
}
