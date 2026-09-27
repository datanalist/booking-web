import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useSession } from "../app/session";
import { Sidebar } from "../ui/Sidebar";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../config";

type CabinetLayoutProps = {
  children: ReactNode;
};

export function CabinetLayout({ children }: CabinetLayoutProps) {
  const location = useLocation();
  const { session } = useSession();
  const isListingsHome = location.pathname === "/listings";
  const isListingWizard =
    location.pathname === "/listings/new" ||
    /^\/listings\/[^/]+\/edit$/.test(location.pathname);
  const isFullBleed = isListingsHome || isListingWizard;

  return (
    <div
      className="flex bg-white font-sans"
      style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
    >
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
