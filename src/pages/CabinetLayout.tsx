import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "../ui/Sidebar";
import { CANVAS_WIDTH } from "../config";

type CabinetLayoutProps = {
  children: ReactNode;
};

export function CabinetLayout({ children }: CabinetLayoutProps) {
  const location = useLocation();

  return (
    <div
      className="flex min-h-[1020px] bg-[#fffdf8] font-sans"
      style={{ minWidth: CANVAS_WIDTH }}
    >
      <Sidebar activePath={location.pathname} />
      <main className="min-h-[1020px] flex-1 px-10 py-8">{children}</main>
    </div>
  );
}
