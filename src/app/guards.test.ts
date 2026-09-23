import { expect, test } from "vitest";
import { resolveLocation } from "./guards";

const guest = null;
const raw = { userId: "1", email: "a@mail.ru", name: "", phone: "", onboardingComplete: false };
const ready = { ...raw, name: "Анна", phone: "+79001234567", onboardingComplete: true };

test("guest cannot open listings", () => {
  expect(resolveLocation({ pathname: "/listings", session: guest })).toBe("/login");
});

test("incomplete onboarding cannot open stubs", () => {
  expect(resolveLocation({ pathname: "/chats", session: raw })).toBe("/onboarding");
});

test("ready user leaves login", () => {
  expect(resolveLocation({ pathname: "/login", session: ready })).toBe("/listings");
});

test("bad step goes to step 1", () => {
  expect(resolveLocation({ pathname: "/listings/new", session: ready, step: "9" })).toBe("/listings/new?step=1");
});

test("stay when allowed", () => {
  expect(resolveLocation({ pathname: "/listings", session: ready })).toBeNull();
});

test("onboarding is a cabinet path", () => {
  expect(resolveLocation({ pathname: "/onboarding", session: guest })).toBe("/login");
  expect(resolveLocation({ pathname: "/onboarding", session: raw })).toBeNull();
});

test("logged-in user leaves every public auth path", () => {
  for (const pathname of ["/register", "/forgot-password", "/reset-password"]) {
    expect(resolveLocation({ pathname, session: ready })).toBe("/listings");
    expect(resolveLocation({ pathname, session: raw })).toBe("/onboarding");
  }
});

test("guest may stay on public auth paths", () => {
  for (const pathname of ["/login", "/register", "/forgot-password", "/reset-password"]) {
    expect(resolveLocation({ pathname, session: guest })).toBeNull();
  }
});

test("invalid reset token does not redirect a guest", () => {
  expect(
    resolveLocation({ pathname: "/reset-password", session: guest, resetTokenValid: false }),
  ).toBeNull();
});

test("invalid reset token still redirects logged-in users", () => {
  expect(
    resolveLocation({ pathname: "/reset-password", session: ready, resetTokenValid: false }),
  ).toBe("/listings");
  expect(
    resolveLocation({ pathname: "/reset-password", session: raw, resetTokenValid: false }),
  ).toBe("/onboarding");
});

test("bad step redirects only listing create and edit paths", () => {
  expect(resolveLocation({ pathname: "/listings/42/edit", session: ready, step: "0" })).toBe(
    "/listings/42/edit?step=1",
  );
  expect(resolveLocation({ pathname: "/listings/42/preview", session: ready, step: "9" })).toBeNull();
  expect(resolveLocation({ pathname: "/listings", session: ready, step: "9" })).toBeNull();
});

test("steps 1 through 6 are valid", () => {
  for (const step of ["1", "2", "3", "4", "5", "6"]) {
    expect(resolveLocation({ pathname: "/listings/new", session: ready, step })).toBeNull();
  }
});
