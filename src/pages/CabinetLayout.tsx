import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useSession } from "../app/session";
import { Sidebar } from "../ui/Sidebar";

type CabinetLayoutProps = {
  children: ReactNode;
};

export function CabinetLayout({ children }: CabinetLayoutProps) {
  const location = useLocation();
  const { session } = useSession();
  const isListingsHome = location.pathname === "/listings";
  const isBookingsHome = location.pathname === "/bookings";
  const isChatsHome = location.pathname === "/chats";
  const isProfile = location.pathname === "/profile";
  const isListingWizard =
    location.pathname === "/listings/new" ||
    /^\/listings\/[^/]+\/edit$/.test(location.pathname);
  const isListingPreview = /^\/listings\/[^/]+\/preview$/.test(
    location.pathname,
  );
  const isFullBleed =
    isListingsHome ||
    isListingWizard ||
    isListingPreview ||
    isBookingsHome ||
    isChatsHome ||
    isProfile;

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 bg-white font-sans">
      <Sidebar
        activePath={location.pathname}
        account={{
          name: session?.name ?? "",
          email: session?.email ?? "",
          photoUrl: session?.photoUrl,
        }}
      />
      <main
        className={`flex h-full min-w-0 flex-1 flex-col overflow-hidden ${
          isFullBleed ? "" : "px-10 py-8"
        }`}
      >
        {children}
      </main>
    </div>
  );
}
