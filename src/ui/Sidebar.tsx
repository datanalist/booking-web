type SidebarAccount = {
  name: string;
  email: string;
  photoUrl?: string;
};

type SidebarItem = {
  to: string;
  label: string;
  iconSrc: string;
  badge?: number;
};

const DEFAULT_ITEMS: SidebarItem[] = [
  {
    to: "/listings",
    label: "Мои объявления",
    iconSrc: "/sidebar-icon-listings.svg",
  },
  {
    to: "/bookings",
    label: "Бронирования",
    iconSrc: "/sidebar-icon-bookings.svg",
  },
  { to: "/chats", label: "Чаты", iconSrc: "/sidebar-icon-chats.svg" },
  {
    to: "/notifications",
    label: "Уведомления",
    iconSrc: "/sidebar-icon-notifications.svg",
    badge: 2,
  },
  { to: "/profile", label: "Профиль", iconSrc: "/sidebar-icon-profile.svg" },
];

type SidebarProps = {
  /** Текущий путь для подсветки без react-router (тесты / SSR). */
  activePath?: string;
  account: SidebarAccount;
  items?: SidebarItem[];
};

export function Sidebar({
  activePath = "",
  account,
  items = DEFAULT_ITEMS,
}: SidebarProps) {
  const avatarSrc = account.photoUrl ?? "/avatar-placeholder.png";

  return (
    <aside className="relative flex h-full w-[235px] shrink-0 flex-col gap-5 bg-white font-sans">
      <header className="flex h-24 w-full shrink-0 items-center px-8 py-6">
        <div className="flex items-center gap-3">
          <img
            src={avatarSrc}
            alt=""
            width={40}
            height={40}
            className="size-10 shrink-0 rounded-full object-cover"
          />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-[14px] font-bold leading-[1.4] text-[var(--color-ink)]">
              {account.name}
            </span>
            <span className="truncate text-[12px] font-normal leading-[1.5] text-[#525353]">
              {account.email}
            </span>
          </div>
        </div>
      </header>

      <nav className="flex min-h-0 w-full flex-1 flex-col items-center gap-3">
        {items.map((item) => {
          const active =
            activePath === item.to || activePath.startsWith(`${item.to}/`);
          return (
            <a
              key={item.to}
              href={item.to}
              className={`flex w-[208px] shrink-0 items-center gap-4 rounded-lg p-4 text-[16px] font-bold leading-[1.2] no-underline ${
                active
                  ? "bg-[var(--color-accent)] text-white"
                  : "text-[var(--color-ink)]"
              }`}
            >
              <span className="relative size-6 shrink-0">
                <img
                  src={item.iconSrc}
                  alt=""
                  width={24}
                  height={24}
                  className={`size-6 object-contain ${active ? "brightness-0 invert" : ""}`}
                />
              </span>
              <span className="flex min-w-0 items-center gap-3 whitespace-nowrap">
                <span className="whitespace-nowrap">{item.label}</span>
                {item.badge != null && item.badge > 0 ? (
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#e34043] text-[10px] font-normal leading-[1.4] text-white">
                    {item.badge}
                  </span>
                ) : null}
              </span>
            </a>
          );
        })}
      </nav>

      {/* Слот футера 77px (макет); логотип — картинка 181×60 в left 27 / top 928 кадра. */}
      <footer className="h-[77px] w-full shrink-0 px-8 py-6" />
      <img
        src="/logo-globalstay.svg"
        alt="GlobalStay"
        width={181}
        height={60}
        className="absolute left-[27px] top-[928px] object-contain"
      />
    </aside>
  );
}
