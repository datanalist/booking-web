import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../app/session";

/** Выход из аккаунта: сброс сессии и переход на экран входа. */
export function useLogout(): () => Promise<void> {
  const { auth } = useSession();
  const navigate = useNavigate();

  return useCallback(async (): Promise<void> => {
    await auth.logout();
    navigate("/login");
  }, [auth, navigate]);
}
