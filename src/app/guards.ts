import type { Session } from "../api/types";

export type GuardInput = {
  pathname: string;
  session: Session | null;
  step?: string;
  resetTokenValid?: boolean;
};

const publicAuthPaths = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
]);

const validSteps = new Set(["1", "2", "3", "4", "5", "6"]);

function isListingWizard(pathname: string): boolean {
  return pathname === "/listings/new" || /^\/listings\/[^/]+\/edit$/.test(pathname);
}

export function resolveLocation({
  pathname,
  session,
  step,
}: GuardInput): string | null {
  if (publicAuthPaths.has(pathname)) {
    if (!session) {
      return null;
    }

    return session.onboardingComplete ? "/listings" : "/onboarding";
  }

  if (!session) {
    return "/login";
  }

  if (!session.onboardingComplete) {
    return pathname === "/onboarding" ? null : "/onboarding";
  }

  if (step !== undefined && !validSteps.has(step) && isListingWizard(pathname)) {
    return `${pathname}?step=1`;
  }

  return null;
}
