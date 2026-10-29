import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createApi } from "../api";
import { resolveCabinetDataSource } from "../api/pocketbase/dataSource";
import { dropPbSession, onPbSessionLost, readPbToken } from "../api/pocketbase/pbSession";
import { pbTokenExpiresAtMs } from "../api/pocketbase/pbToken";
import type { AuthApi, ListingsApi, Session } from "../api/types";

type SessionContextValue = {
  session: Session | null;
  auth: AuthApi;
  listings: ListingsApi;
  reload: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

type SessionProviderProps = {
  children: ReactNode;
};

export function SessionProvider({ children }: SessionProviderProps) {
  const api = useMemo(() => createApi(localStorage), []);
  const [session, setSession] = useState<Session | null>(() => {
    const initial = api.readSession();
    api.setCurrentUserId(initial?.userId ?? null);
    return initial;
  });

  useEffect(() => {
    api.setCurrentUserId(session?.userId ?? null);
  }, [api, session]);

  useEffect(() => {
    return onPbSessionLost(() => {
      api.setCurrentUserId(null);
      setSession(null);
    });
  }, [api]);

  useEffect(() => {
    if (resolveCabinetDataSource() !== "pocketbase" || session === null) {
      return;
    }
    let timer = 0;
    let stopped = false;

    const arm = (): void => {
      if (stopped) {
        return;
      }
      const token = readPbToken(localStorage);
      if (token === null) {
        return;
      }
      const exp = pbTokenExpiresAtMs(token);
      if (exp === null) {
        return;
      }
      const delay = exp - Date.now();
      if (delay <= 0) {
        dropPbSession(localStorage);
        return;
      }
      const maxWait = 2_147_483_647;
      timer = window.setTimeout(() => {
        if (delay > maxWait) {
          arm();
          return;
        }
        dropPbSession(localStorage);
      }, Math.min(delay, maxWait));
    };

    arm();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [session]);

  const reload = useCallback((): void => {
    const next = api.readSession();
    api.setCurrentUserId(next?.userId ?? null);
    setSession(next);
  }, [api]);

  const auth = useMemo(
    (): AuthApi => ({
      register: (email, password) => api.auth.register(email, password),
      login: async (email, password) => {
        const next = await api.auth.login(email, password);
        api.setCurrentUserId(next.userId);
        setSession(next);
        return next;
      },
      loginWithTelegram: async (fields) => {
        const next = await api.auth.loginWithTelegram(fields);
        api.setCurrentUserId(next.userId);
        setSession(next);
        return next;
      },
      logout: async () => {
        await api.auth.logout();
        api.setCurrentUserId(null);
        setSession(null);
      },
      completeOnboarding: async (input) => {
        const next = await api.auth.completeOnboarding(input);
        api.setCurrentUserId(next.userId);
        setSession(next);
        return next;
      },
      updateProfile: async (input) => {
        const next = await api.auth.updateProfile(input);
        api.setCurrentUserId(next.userId);
        setSession(next);
        return next;
      },
      requestPasswordReset: (email) => api.auth.requestPasswordReset(email),
      confirmPasswordReset: (token, password) =>
        api.auth.confirmPasswordReset(token, password),
    }),
    [api],
  );

  const value = useMemo(
    (): SessionContextValue => ({
      session,
      auth,
      listings: api.listings,
      reload,
    }),
    [session, auth, api.listings, reload],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return value;
}
