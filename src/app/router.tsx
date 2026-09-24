import type { ReactNode } from "react";
import {
  Navigate,
  Outlet,
  createBrowserRouter,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import { resolveLocation } from "./guards";
import { useSession } from "./session";
import { AuthLayout } from "../pages/AuthLayout";
import { CabinetLayout } from "../pages/CabinetLayout";
import { ForgotPasswordPage } from "../pages/ForgotPasswordPage";
import { ListingPreviewPage } from "../pages/ListingPreviewPage";
import { ListingWizardPage } from "../pages/ListingWizardPage";
import { ListingsPage } from "../pages/ListingsPage";
import { LoginPage } from "../pages/LoginPage";
import { OnboardingPage } from "../pages/OnboardingPage";
import { RegisterPage } from "../pages/RegisterPage";
import { ResetPasswordPage } from "../pages/ResetPasswordPage";
import { ProfilePage } from "../pages/ProfilePage";
import { StubPage } from "../pages/StubPage";

function Guarded({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const location = useLocation();
  const [params] = useSearchParams();
  const step = params.get("step") ?? undefined;
  const redirect = resolveLocation({
    pathname: location.pathname,
    session,
    step,
  });
  if (redirect) {
    return <Navigate to={redirect} replace />;
  }
  return <>{children}</>;
}

function AuthShell() {
  return (
    <Guarded>
      <AuthLayout>
        <Outlet />
      </AuthLayout>
    </Guarded>
  );
}

function CabinetShell() {
  return (
    <Guarded>
      <CabinetLayout>
        <Outlet />
      </CabinetLayout>
    </Guarded>
  );
}

function RootRedirect() {
  const { session } = useSession();
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  if (!session.onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }
  return <Navigate to="/listings" replace />;
}

export function createAppRouter() {
  return createBrowserRouter([
    {
      path: "/",
      element: <RootRedirect />,
    },
    {
      element: <AuthShell />,
      children: [
        { path: "/login", element: <LoginPage /> },
        { path: "/register", element: <RegisterPage /> },
        { path: "/forgot-password", element: <ForgotPasswordPage /> },
        { path: "/reset-password", element: <ResetPasswordPage /> },
        {
          path: "/terms",
          element: <StubPage title="Условия использования" />,
        },
        {
          path: "/privacy",
          element: <StubPage title="Политика конфиденциальности" />,
        },
      ],
    },
    {
      path: "/onboarding",
      element: (
        <Guarded>
          <OnboardingPage />
        </Guarded>
      ),
    },
    {
      element: <CabinetShell />,
      children: [
        { path: "/listings", element: <ListingsPage /> },
        { path: "/listings/new", element: <ListingWizardPage /> },
        { path: "/listings/:id/edit", element: <ListingWizardPage /> },
        { path: "/listings/:id/preview", element: <ListingPreviewPage /> },
        { path: "/bookings", element: <StubPage title="Бронирования" /> },
        { path: "/chats", element: <StubPage title="Чаты" /> },
        { path: "/notifications", element: <StubPage title="Уведомления" /> },
        { path: "/profile", element: <ProfilePage /> },
      ],
    },
    {
      path: "*",
      element: <Navigate to="/" replace />,
    },
  ]);
}
