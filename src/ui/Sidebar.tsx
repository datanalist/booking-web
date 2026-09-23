type SidebarItem = {
  to: string;
  label: string;
  badge?: number;
};

const DEFAULT_ITEMS: SidebarItem[] = [
  { to: "/listings", label: "Мои объявления" },
  { to: "/bookings", label: "Бронирования" },
  { to: "/chats", label: "Чаты" },
  { to: "/notifications", label: "Уведомления" },
  { to: "/profile", label: "Профиль" },
];

type SidebarProps = {
  /** Текущий путь для подсветки без react-router (тесты / SSR). */
  activePath?: string;
  items?: SidebarItem[];
};

export function Sidebar({
  activePath = "",
  items = DEFAULT_ITEMS,
}: SidebarProps) {
  return (
    <aside className="flex h-full w-[235px] flex-col bg-white font-sans">
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {items.map((item) => {
          const active =
            activePath === item.to || activePath.startsWith(`${item.to}/`);
          return (
            <a
              key={item.to}
              href={item.to}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-[16px] no-underline ${
                active
                  ? "bg-[var(--color-accent)] text-white"
                  : "text-[var(--color-text)] hover:bg-[#f5f5f5]"
              }`}
            >
              <span>{item.label}</span>
              {item.badge != null && item.badge > 0 ? (
                <span
                  className={`min-w-5 rounded-full px-1.5 text-center text-[12px] ${
                    active
                      ? "bg-white text-[var(--color-accent)]"
                      : "bg-[var(--color-accent)] text-white"
                  }`}
                >
                  {item.badge}
                </span>
              ) : null}
            </a>
          );
        })}
      </nav>
      <div className="p-4 text-[18px] font-bold text-[var(--color-ink)]">
        GlobalStay
      </div>
    </aside>
  );
}
