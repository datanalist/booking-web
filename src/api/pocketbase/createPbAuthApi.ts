import { SESSION_KEY } from "../keys";
import type { AuthApi, Session, UpdateProfileInput } from "../types";
import { PbRequestError } from "./pbClient";
import type { PbClient } from "./pbClient";
import { clearPbToken, writePbToken } from "./pbSession";
import { pbUserToSession, sessionOrInputToPbUserPatch } from "./userMapper";
import type { ProfilePhoto } from "./pbAuthHelpers";
import {
  authError,
  mentionsEmail,
  photoChoice,
  readSession,
  readUserRecord,
  userPatchBody,
  validateEmail,
  validateName,
  validatePassword,
  validatePhone,
  writeSession,
} from "./pbAuthHelpers";

const USERS = "users";
const EMAIL_NOT_VERIFIED_MESSAGE = "Подтвердите почту по кнопке в письме";

function emailNotVerified(): Error & { code: "EMAIL_NOT_VERIFIED" } {
  return Object.assign(new Error(EMAIL_NOT_VERIFIED_MESSAGE), {
    code: "EMAIL_NOT_VERIFIED" as const,
  });
}

export function createPbAuthApi(options: { client: PbClient; storage: Storage }): AuthApi {
  const { client, storage } = options;

  async function patchCurrentUser(
    input: { name: string; phone: string },
    photo: ProfilePhoto,
  ): Promise<Session> {
    const current = readSession(storage);
    const patch = sessionOrInputToPbUserPatch({
      name: validateName(input.name),
      phone: validatePhone(input.phone),
    });
    const updated: unknown = await client.updateRecord(
      USERS,
      current.userId,
      userPatchBody(patch, photo),
    );
    return pbUserToSession(readUserRecord(updated), client.baseUrl);
  }

  const login: AuthApi["login"] = async (email, password) => {
    let auth: Awaited<ReturnType<PbClient["authWithPassword"]>>;
    try {
      auth = await client.authWithPassword(email, password);
    } catch (error) {
      if (error instanceof PbRequestError && error.status === 400) {
        const text = `${error.message} ${JSON.stringify(error.body)}`;
        if (text.includes("Подтвердите почту")) {
          throw emailNotVerified();
        }
        throw authError("INVALID_CREDENTIALS", "Неверный email или пароль");
      }
      throw error;
    }
    const record = readUserRecord(auth.record);
    if (record.verified !== true) {
      throw emailNotVerified();
    }
    writePbToken(storage, auth.token);
    return writeSession(storage, pbUserToSession(record, client.baseUrl));
  };

  const loginWithTelegram: AuthApi["loginWithTelegram"] = async (popup) => {
    const auth = await client.authWithTelegram(popup);
    writePbToken(storage, auth.token);
    return writeSession(storage, pbUserToSession(readUserRecord(auth.record), client.baseUrl));
  };

  return {
    login,
    loginWithTelegram,

    async register(email, password) {
      const normalizedEmail = validateEmail(email);
      validatePassword(password);
      try {
        await client.createRecord(USERS, {
          email: normalizedEmail,
          password,
          passwordConfirm: password,
          roles: ["host"],
          account_status: "active",
        });
      } catch (error) {
        if (error instanceof PbRequestError && error.status === 400 && mentionsEmail(error)) {
          throw authError("EMAIL_TAKEN", "Такой email уже зарегистрирован");
        }
        throw authError("PB_FORBIDDEN", "PocketBase не принял регистрацию");
      }
      try {
        await client.requestVerification(normalizedEmail);
      } catch {
        throw new Error("Не удалось отправить письмо. Попробуйте ещё раз");
      }
      return { email: normalizedEmail };
    },

    async logout() {
      clearPbToken(storage);
      storage.removeItem(SESSION_KEY);
    },

    async completeOnboarding({ name, phone, photo }) {
      const session = await patchCurrentUser({ name, phone }, photoChoice(photo, false));
      return writeSession(storage, session);
    },

    async updateProfile(input: UpdateProfileInput) {
      const nextEmail = validateEmail(input.email);
      const current = readSession(storage);
      const session = writeSession(storage, await patchCurrentUser(
        { name: input.name, phone: input.phone },
        photoChoice(input.photoUrl, true),
      ));
      if (nextEmail === current.email.trim().toLowerCase()) {
        return session;
      }
      // Заявка change-email не меняет users.email до ссылки из письма.
      const changed = await client.changeEmail(nextEmail);
      return writeSession(storage, { ...session, email: changed.email });
    },

    async requestPasswordReset(email) {
      const normalizedEmail = validateEmail(email);
      await client.requestPasswordReset(normalizedEmail);
      return "";
    },

    async confirmPasswordReset(token, password) {
      if (token.trim().length === 0) {
        throw authError("INVALID_TOKEN", "Ссылка недействительна");
      }
      validatePassword(password);
      await client.confirmPasswordReset(token, password);
    },
  };
}
