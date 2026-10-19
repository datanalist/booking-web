import { NAME_MAX, NAME_MIN, PASSWORD_MIN } from "../config";
import { sha256Hex } from "../lib/hash";
import { createId } from "../lib/id";
import { SESSION_KEY, USERS_KEY } from "./keys";
import type { AuthApi, Session, UpdateProfileInput, UserRecord } from "./types";

const RESET_KEY_PREFIX = "gs.reset.";

type AuthErrorCode =
  | "EMAIL_TAKEN"
  | "EMAIL_NOT_VERIFIED"
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

function validateName(name: string): string {
  const normalizedName = name.trim();
  if (normalizedName.length < NAME_MIN || normalizedName.length > NAME_MAX) {
    throw authError("INVALID_NAME", "Введите имя от 2 до 50 символов");
  }
  return normalizedName;
}

function validatePhone(phone: string): string {
  const phoneDigits = phone.replace(/\D/g, "");
  if (phoneDigits.length !== 11 || !phoneDigits.startsWith("7")) {
    throw authError("INVALID_PHONE", "Введите корректный номер телефона");
  }
  return `+${phoneDigits}`;
}

function readSessionUserIndex(storage: Storage, users: UserRecord[]): number {
  const sessionValue = storage.getItem(SESSION_KEY);
  if (sessionValue === null) {
    throw authError("INVALID_CREDENTIALS", "Неверный email или пароль");
  }
  // Сессию пишет writeSession, форма совпадает с Session.
  const session = JSON.parse(sessionValue) as Session;
  const userIndex = users.findIndex((user) => user.id === session.userId);
  if (userIndex < 0) {
    throw authError("INVALID_CREDENTIALS", "Неверный email или пароль");
  }
  return userIndex;
}

function userAt(users: UserRecord[], userIndex: number): UserRecord {
  const user = users[userIndex];
  if (user === undefined) {
    throw authError("INVALID_CREDENTIALS", "Неверный email или пароль");
  }
  return user;
}

function assertEmailAvailable(
  users: UserRecord[],
  email: string,
  userId: string,
): void {
  const taken = users.some((user) => user.email === email && user.id !== userId);
  if (taken) {
    throw authError("EMAIL_TAKEN", "Такой email уже зарегистрирован");
  }
}

function withoutPhoto(user: UserRecord): UserRecord {
  return {
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
    verified: user.verified,
    name: user.name,
    phone: user.phone,
    onboardingComplete: user.onboardingComplete,
  };
}

function applyPhotoUrl(user: UserRecord, photoUrl: string | undefined): UserRecord {
  const trimmed = photoUrl?.trim() ?? "";
  if (trimmed.length === 0) {
    return withoutPhoto(user);
  }
  return { ...user, photoUrl: trimmed };
}

function retargetResetTokens(
  storage: Storage,
  fromEmail: string,
  toEmail: string,
): void {
  if (fromEmail === toEmail) {
    return;
  }
  const keys: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key !== null && key.startsWith(RESET_KEY_PREFIX)) {
      keys.push(key);
    }
  }
  for (const key of keys) {
    if (storage.getItem(key) === fromEmail) {
      storage.setItem(key, toEmail);
    }
  }
}

function profileUser(
  current: UserRecord,
  input: UpdateProfileInput,
): UserRecord {
  return applyPhotoUrl(
    {
      id: current.id,
      email: validateEmail(input.email),
      passwordHash: current.passwordHash,
      verified: current.verified,
      name: validateName(input.name),
      phone: validatePhone(input.phone),
      onboardingComplete: current.onboardingComplete,
    },
    input.photoUrl,
  );
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
        verified: true,
        name: "",
        phone: "",
        onboardingComplete: false,
      };
      writeUsers([...users, user]);
      return { email: normalizedEmail };
    },

    async login(email, password) {
      const normalizedEmail = normalizeEmail(email);
      const users = readUsers();
      const user = users.find((candidate) => candidate.email === normalizedEmail);
      if (!user || user.passwordHash !== await sha256Hex(password)) {
        throw authError("INVALID_CREDENTIALS", "Неверный email или пароль");
      }
      if (user.verified === false) {
        throw authError("EMAIL_NOT_VERIFIED", "Подтвердите почту по кнопке в письме");
      }
      return writeSession(user);
    },

    async logout() {
      storage.removeItem(SESSION_KEY);
    },

    async completeOnboarding({ name, phone, photo }) {
      const normalizedName = validateName(name);
      const normalizedPhone = validatePhone(phone);
      const users = readUsers();
      const userIndex = readSessionUserIndex(storage, users);
      const current = userAt(users, userIndex);
      const updatedUser: UserRecord = {
        ...current,
        name: normalizedName,
        phone: normalizedPhone,
        ...(photo !== undefined ? { photoUrl: photo } : {}),
        onboardingComplete: true,
      };
      users[userIndex] = updatedUser;
      writeUsers(users);
      return writeSession(updatedUser);
    },

    async updateProfile(input) {
      const users = readUsers();
      const userIndex = readSessionUserIndex(storage, users);
      const current = userAt(users, userIndex);
      const updatedUser = profileUser(current, input);
      assertEmailAvailable(users, updatedUser.email, current.id);
      users[userIndex] = updatedUser;
      writeUsers(users);
      retargetResetTokens(storage, current.email, updatedUser.email);
      return writeSession(updatedUser);
    },

    async requestPasswordReset(email) {
      const normalizedEmail = validateEmail(email);
      const token = createId();
      storage.setItem(`${RESET_KEY_PREFIX}${token}`, normalizedEmail);
      return token;
    },

    async confirmPasswordReset(token, password) {
      const resetKey = `${RESET_KEY_PREFIX}${token}`;
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
