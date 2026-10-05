export function ChatComposerPreview({
  previewUrl,
  onRemove,
}: {
  previewUrl: string;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-end gap-3">
      <img
        src={previewUrl}
        alt="Предпросмотр фото"
        className="size-16 rounded-lg object-cover"
      />
      <button
        type="button"
        className="text-[12px] font-normal leading-[1.5] text-[#525353]"
        onClick={onRemove}
      >
        Убрать фото
      </button>
    </div>
  );
}
