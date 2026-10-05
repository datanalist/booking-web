import emptyChatIllustrationUrl from "../assets/select-chat-illustration.svg";

/** Файл из chatAssets.selectChatIllustration: SVG «No Conversation». */

export function DefaultChatIllustration() {
  return (
    <img
      src={emptyChatIllustrationUrl}
      alt=""
      className="block max-w-none shrink-0"
    />
  );
}
