import { useMemo } from "react";
import { RouterProvider } from "react-router-dom";
import { SessionProvider } from "./app/session";
import { createAppRouter } from "./app/router";
import { useViewport } from "./app/useViewport";
import { DesktopOnlyPage } from "./pages/DesktopOnlyPage";
import { CANVAS_WIDTH } from "./config";

export function App() {
  const { isDesktop } = useViewport();

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
