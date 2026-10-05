import { DefaultChatIllustration } from "./DefaultChatIllustration";

export function DefaultChatScreen() {
  return (
    <section className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-6 rounded-2xl border border-[rgba(251,192,40,0.17)] bg-white">
      <DefaultChatIllustration />
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="m-0 text-[24px] font-bold leading-[1.2] text-[var(--color-ink)]">
          Нет чатов
        </h2>
        <p className="m-0 text-[16px] font-normal leading-[1.45] text-[#525353]">
          Чаты с клиентами появятся после бронирования
        </p>
      </div>
    </section>
  );
}
