export function ChatMessageAvatar({ url }: { url: string }) {
  return (
    <img src={url} alt="" className="size-10 shrink-0 rounded-full object-cover" />
  );
}
