import { ChatListSearchIcon } from "./ChatListSearchIcon";

type ChatListSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

export function ChatListSearch({ value, onChange }: ChatListSearchProps) {
  return (
    <label className="flex h-11 items-center gap-2 rounded-lg border border-[rgba(251,192,40,0.17)] bg-white px-[14px]">
      <ChatListSearchIcon />
      <input
        type="search"
        value={value}
        placeholder="Поиск"
        aria-label="Поиск"
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 border-0 bg-transparent text-[16px] leading-[1.45] text-[#1a1b1d] outline-none placeholder:text-[#525353] [&::-webkit-search-cancel-button]:appearance-none"
      />
    </label>
  );
}
