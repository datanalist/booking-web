import { useState } from "react";

type ListingCardProps = {
  title: string;
  address: string;
  photoUrl?: string;
  statusLabel: string;
  onOpen: () => void;
  onEdit: () => void;
  onPublish: () => void;
  onDelete: () => void;
};

export function ListingCard({
  title,
  address,
  photoUrl,
  statusLabel,
  onOpen,
  onEdit,
  onPublish,
  onDelete,
}: ListingCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <article className="relative flex gap-4 rounded-lg border border-[#e8e8e8] bg-white p-3 font-sans">
      <button
        type="button"
        className="flex flex-1 gap-4 border-0 bg-transparent p-0 text-left cursor-pointer"
        onClick={onOpen}
      >
        <div className="h-24 w-32 shrink-0 overflow-hidden rounded-md bg-[#f0f0f0]">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[16px] font-bold text-[var(--color-text)]">
            {title}
          </span>
          <span className="text-[14px] text-[#757575]">{address}</span>
          <span className="text-[12px] text-[var(--color-accent)]">
            {statusLabel}
          </span>
        </div>
      </button>
      <div className="relative">
        <button
          type="button"
          aria-label="Меню"
          className="border-0 bg-transparent px-2 py-1 text-[20px] cursor-pointer"
          onClick={() => setMenuOpen((open) => !open)}
        >
          ⋮
        </button>
        {menuOpen ? (
          <ul className="absolute right-0 z-10 m-0 list-none rounded-md border border-[#e8e8e8] bg-white p-1 shadow-sm">
            <li>
              <button
                type="button"
                className="block w-full border-0 bg-transparent px-3 py-2 text-left text-[14px] cursor-pointer hover:bg-[#f5f5f5]"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit();
                }}
              >
                Редактировать
              </button>
            </li>
            <li>
              <button
                type="button"
                className="block w-full border-0 bg-transparent px-3 py-2 text-left text-[14px] cursor-pointer hover:bg-[#f5f5f5]"
                onClick={() => {
                  setMenuOpen(false);
                  onPublish();
                }}
              >
                Опубликовать
              </button>
            </li>
            <li>
              <button
                type="button"
                className="block w-full border-0 bg-transparent px-3 py-2 text-left text-[14px] cursor-pointer hover:bg-[#f5f5f5]"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
              >
                Удалить
              </button>
            </li>
          </ul>
        ) : null}
      </div>
    </article>
  );
}
