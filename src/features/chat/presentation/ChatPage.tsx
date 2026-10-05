import { DefaultChatScreen } from "./default/DefaultChatScreen";

export function ChatPage() {
  return (
    <div className="flex h-full w-full flex-col gap-8 bg-[rgba(251,192,40,0.06)] p-8 font-sans">
      <header className="flex h-10 w-full shrink-0 items-center">
        <h1 className="m-0 text-[24px] font-bold leading-[1.2] text-[var(--color-ink)]">
          Чаты
        </h1>
      </header>
      <DefaultChatScreen />
    </div>
  );
}
