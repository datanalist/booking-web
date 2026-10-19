export const EMAIL_VERIFIED_NOTICE_KEY = "vallome.emailVerifiedNotice";
const CHANNEL_NAME = "vallome-email-verified";

export function publishEmailVerifiedNotice(): void {
  localStorage.setItem(EMAIL_VERIFIED_NOTICE_KEY, String(Date.now()));
  const channel = openChannel();
  channel?.postMessage("verified");
  channel?.close();
}

export function subscribeEmailVerifiedNotice(onVerified: () => void): () => void {
  const onStorage = (event: StorageEvent): void => {
    if (event.key === EMAIL_VERIFIED_NOTICE_KEY) onVerified();
  };
  window.addEventListener("storage", onStorage);
  const channel = openChannel();
  if (channel) channel.onmessage = () => onVerified();
  return () => {
    window.removeEventListener("storage", onStorage);
    channel?.close();
  };
}

function openChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  try {
    return new BroadcastChannel(CHANNEL_NAME);
  } catch {
    return null;
  }
}
