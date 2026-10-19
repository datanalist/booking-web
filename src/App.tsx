import { useMemo } from "react";
import { RouterProvider } from "react-router-dom";
import { SessionProvider } from "./app/session";
import { createAppRouter } from "./app/router";
import { useViewport } from "./app/useViewport";
import { DesktopOnlyPage } from "./pages/DesktopOnlyPage";
import { EmailVerifiedNotice } from "./pages/EmailVerifiedNotice";
import { CANVAS_WIDTH } from "./config";

export function isEmailConfirmedWindow(): boolean {
  if (typeof window === "undefined") return false;
  const url = new URL(window.location.href);
  return url.pathname === "/login" && url.searchParams.get("verified") === "1";
}

export function App() {
  const confirmedWindow = isEmailConfirmedWindow();
  const { isDesktop } = useViewport();

  if (confirmedWindow) {
    return <EmailVerifiedNotice />;
  }

  if (!isDesktop) {
    return <DesktopOnlyPage />;
  }

  return (
    <SessionProvider>
      <DesktopApp />
    </SessionProvider>
  );
}

function DesktopApp() {
  const router = useMemo(() => createAppRouter(), []);

  return (
    <div className="bg-[#fffdf8]" style={{ minWidth: CANVAS_WIDTH }}>
      <RouterProvider router={router} />
    </div>
  );
}
