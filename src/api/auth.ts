import { NAME_MAX, NAME_MIN, PASSWORD_MIN } from "../config";
import { sha256Hex } from "../lib/hash";
import { createId } from "../lib/id";
import { SESSION_KEY, USERS_KEY } from "./keys";
import type { AuthApi, Session, UserRecord } from "./types";

type AuthErrorCode =
  | "EMAIL_TAKEN"
  | "INVALID_EMAIL"
  | "INVALID_PASSWORD"
  | "INVALID_CREDENTIALS"
  | "INVALID_TOKEN"
  | "INVALID_NAME"
  | "INVALID_PHONE";

function authError(code: AuthErrorCode, message: string): Error & { code: AuthErrorCode } {
  return Object.assign(new Error(message), { code });
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function validateEmail(email: string): string {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    throw authError("INVALID_EMAIL", "Обязательное поле");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw authError("INVALID_EMAIL", "Введите корректный email");
  }
  return normalized;
}

function validatePassword(password: string): void {
  if (password.length < PASSWORD_MIN) {
    throw authError("INVALID_PASSWORD", "Минимум 8 символов");
  }
}

function toSession(user: UserRecord): Session {
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    ...(user.photoUrl ? { photoUrl: user.photoUrl } : {}),
    onboardingComplete: user.onboardingComplete,
  };
}

export function createAuthApi(storage: Storage): AuthApi {
  const readUsers = (): UserRecord[] => {
    const value = storage.getItem(USERS_KEY);
    return value ? JSON.parse(value) as UserRecord[] : [];
  };

  const writeUsers = (users: UserRecord[]): void => {
    storage.setItem(USERS_KEY, JSON.stringify(users));
  };

  const writeSession = (user: UserRecord): Session => {
    const session = toSession(user);
    storage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  };

  return {
    async register(email, password) {
      const normalizedEmail = validateEmail(email);
      validatePassword(password);
      const users = readUsers();
      if (users.some((user) => user.email === normalizedEmail)) {
        throw authError("EMAIL_TAKEN", "Такой email уже зарегистрирован");
      }

      const user: UserRecord = {
        id: createId(),
        email: normalizedEmail,
        passwordHash: await sha256Hex(password),
        name: "",
        phone: "",
        onboardingComplete: false,
      };
      writeUsers([...users, user]);
      return writeSession(user);
    },

    async login(email, password) {
      const normalizedEmail = normalizeEmail(email);
      const users = readUsers();
      const user = users.find((candidate) => candidate.email === normalizedEmail);
      if (!user || user.passwordHash !== await sha256Hex(password)) {
        throw authError("INVALID_CREDENTIALS", "Неверный email или пароль");
      }
      return writeSession(user);
    },

    async logout() {
      storage.removeItem(SESSION_KEY);
    },

    async completeOnboarding({ name, phone, photo }) {
      const sessionValue = storage.getItem(SESSION_KEY);
      if (!sessionValue) {
        throw authError("INVALID_CREDENTIALS", "Неверный email или пароль");
      }

      const normalizedName = name.trim();
      if (normalizedName.length < NAME_MIN || normalizedName.length > NAME_MAX) {
        throw authError("INVALID_NAME", "Введите имя от 2 до 50 символов");
      }

      const phoneDigits = phone.replace(/\D/g, "");
      if (phoneDigits.length !== 11 || !phoneDigits.startsWith("7")) {
        throw authError("INVALID_PHONE", "Введите корректный номер телефона");
      }

      const session = JSON.parse(sessionValue) as Session;
      const users = readUsers();
      const userIndex = users.findIndex((user) => user.id === session.userId);
      if (userIndex < 0) {
        throw authError("INVALID_CREDENTIALS", "Неверный email или пароль");
      }

      const updatedUser: UserRecord = {
        ...users[userIndex],
        name: normalizedName,
        phone: `+${phoneDigits}`,
        ...(photo !== undefined ? { photoUrl: photo } : {}),
        onboardingComplete: true,
      };
      users[userIndex] = updatedUser;
      writeUsers(users);
      return writeSession(updatedUser);
    },

    async requestPasswordReset(email) {
      const normalizedEmail = validateEmail(email);
      const token = createId();
      storage.setItem(`gs.reset.${token}`, normalizedEmail);
      return token;
    },

    async confirmPasswordReset(token, password) {
      const resetKey = `gs.reset.${token}`;
      const email = storage.getItem(resetKey);
      if (!email) {
        throw authError("INVALID_TOKEN", "Ссылка недействительна");
      }
      validatePassword(password);

      const users = readUsers();
      const userIndex = users.findIndex((user) => user.email === email);
      if (userIndex < 0) {
        throw authError("INVALID_TOKEN", "Ссылка недействительна");
      }

      users[userIndex] = {
        ...users[userIndex],
        passwordHash: await sha256Hex(password),
      };
      writeUsers(users);
      storage.removeItem(resetKey);
    },
  };
}
