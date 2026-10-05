import { ChatSelectIllustration } from "./ChatSelectIllustration";

export function ChatSelectPlaceholder() {
  return (
    <section
      aria-label="Чат не выбран"
      className="flex h-full min-h-0 w-full flex-col items-center justify-center gap-6 rounded-2xl border border-[rgba(251,192,40,0.17)] bg-white"
    >
      <ChatSelectIllustration />
      <p className="m-0 text-center text-[16px] leading-[1.45] font-normal text-[#525353]">
        Выберите чат
      </p>
    </section>
  );
}
