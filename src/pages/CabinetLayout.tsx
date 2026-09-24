import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useSession } from "../app/session";
import { Sidebar } from "../ui/Sidebar";
import { CANVAS_WIDTH } from "../config";

type CabinetLayoutProps = {
  children: ReactNode;
};

export function CabinetLayout({ children }: CabinetLayoutProps) {
  const location = useLocation();
  const { session } = useSession();

  return (
    <div
      className="flex min-h-[1020px] bg-[#fffdf8] font-sans"
      style={{ minWidth: CANVAS_WIDTH }}
    >
      <Sidebar
        activePath={location.pathname}
        account={{
          name: session?.name ?? "",
          email: session?.email ?? "",
          photoUrl: session?.photoUrl,
        }}
      />
      <main className="min-h-[1020px] flex-1 px-10 py-8">{children}</main>
    </div>
  );
}
