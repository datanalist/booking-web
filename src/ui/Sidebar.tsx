import { Link } from "react-router-dom";

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
  /** Текущий путь для подсветки. Передаётся снаружи, чтобы тесты не зависели от роутера. */
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
    <aside className="flex h-full w-[235px] shrink-0 flex-col gap-5 self-stretch bg-white font-sans">
      <header className="inline-flex h-24 w-full shrink-0 flex-col items-start justify-center self-stretch overflow-hidden px-8 py-6">
        <div className="inline-flex w-full min-w-0 items-center justify-start gap-3">
          <div className="relative size-10 shrink-0">
            <img
              src={avatarSrc}
              alt=""
              width={40}
              height={40}
              className="absolute top-0 left-0 size-10 rounded-[40px] object-cover"
            />
          </div>
          <div className="inline-flex min-w-0 flex-col items-start justify-start gap-0.5">
            <div className="max-w-full truncate text-sm font-bold leading-5 text-absolute-black">
              {account.name}
            </div>
            <div className="max-w-full truncate text-xs font-normal leading-4 text-neutral-600">
              {account.email}
            </div>
          </div>
        </div>
      </header>

      <nav className="flex min-h-0 w-full flex-1 flex-col items-center gap-3">
        {items.map((item) => {
          const active =
            activePath === item.to || activePath.startsWith(`${item.to}/`);
          return (
            <Link
              key={item.to}
              to={item.to}
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
            </Link>
          );
        })}
      </nav>

      {/* Слот футера 77px. Логотип 181×60 держится у низа колонки: left 27, 32px от нижнего края. */}
      <footer className="relative h-[77px] w-full shrink-0">
        <img
          src="/logo-globalstay.svg"
          alt="GlobalStay"
          width={181}
          height={60}
          className="absolute bottom-[32px] left-[27px] h-[60px] w-[181px] object-contain object-left"
        />
      </footer>
    </aside>
  );
}
