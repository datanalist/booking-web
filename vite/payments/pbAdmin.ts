import { PaymentFlowError } from "./paymentFlowError.ts";
import { creditsCollectionDefinition, paymentsCollectionDefinition } from "./collections.ts";
import { addRubles } from "./money.ts";
import type { PaymentStatus, StoredPayment } from "./types.ts";

export type PbAdminEnv = {
  pbUrl: string;
  pbAdmin: string;
  pbPassword: string;
};

type PbResponse = { status: number; body: unknown };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function quoteFilter(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function readStatus(value: unknown): PaymentStatus {
  if (value === "succeeded" || value === "canceled" || value === "pending") {
    return value;
  }
  return "pending";
}

function readStored(value: unknown): StoredPayment {
  if (!isRecord(value) || typeof value.id !== "string" || value.id.length === 0) {
    throw new PaymentFlowError(502, "PocketBase вернул некорректный платёж");
  }
  const userId = typeof value.user === "string" ? value.user : "";
  const amountRub = typeof value.amount === "number" ? value.amount : Number.NaN;
  if (userId === "" || !Number.isFinite(amountRub)) {
    throw new PaymentFlowError(502, "PocketBase вернул некорректный платёж");
  }
  return {
    id: value.id,
    userId,
    amountRub,
    status: readStatus(value.status),
    credited: value.credited === true,
    yookassaPaymentId: typeof value.yookassa_payment_id === "string" ? value.yookassa_payment_id : "",
  };
}

function isUniqueConflict(body: unknown): boolean {
  if (!isRecord(body) || !isRecord(body.data)) {
    return false;
  }
  return Object.values(body.data).some((value) => isRecord(value) && value.code === "validation_not_unique");
}

function isAlreadyCredited(body: unknown): boolean {
  return isRecord(body) && body.message === "Платёж уже зачислен";
}

function jwtExpMs(token: string): number | null {
  const part = token.split(".")[1];
  if (part === undefined) {
    return null;
  }
  try {
    const json: unknown = JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
    return isRecord(json) && typeof json.exp === "number" ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function createPbAdmin(env: PbAdminEnv, fetchImpl: typeof fetch) {
  let token = "";
  let tokenExp = 0;
  let schema: Promise<void> | null = null;

  function configured(): void {
    if (env.pbUrl.trim() === "" || env.pbAdmin.trim() === "" || env.pbPassword.trim() === "") {
      throw new PaymentFlowError(503, "Сервер не подключён к PocketBase");
    }
  }

  async function raw(path: string, method: string, auth: string | null, body?: object): Promise<PbResponse> {
    const headers = new Headers();
    headers.set("Accept", "application/json");
    if (auth !== null) {
      headers.set("Authorization", `Bearer ${auth}`);
    }
    if (body !== undefined) {
      headers.set("Content-Type", "application/json");
    }
    let response: Response;
    try {
      response = await fetchImpl(`${env.pbUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        redirect: "error",
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      throw new PaymentFlowError(502, "Не удалось связаться с PocketBase");
    }
    const text = await response.text();
    let parsed: unknown = null;
    if (text.trim().length > 0) {
      try {
        parsed = JSON.parse(text) as unknown;
      } catch {
        parsed = null;
      }
    }
    return { status: response.status, body: parsed };
  }

  async function login(): Promise<string> {
    configured();
    const attempts: Array<{ path: string; body: object }> = [
      {
        path: "/api/collections/_superusers/auth-with-password",
        body: { identity: env.pbAdmin, password: env.pbPassword },
      },
      {
        path: "/api/admins/auth-with-password",
        body: { identity: env.pbAdmin, password: env.pbPassword },
      },
      {
        path: "/api/admins/auth-with-password",
        body: { email: env.pbAdmin, password: env.pbPassword },
      },
    ];
    for (const attempt of attempts) {
      const response = await raw(attempt.path, "POST", null, attempt.body);
      if (response.status === 200 && isRecord(response.body) && typeof response.body.token === "string") {
        return response.body.token;
      }
    }
    throw new PaymentFlowError(503, "Сервер не подключён к PocketBase");
  }

  async function adminToken(): Promise<string> {
    if (token !== "" && Date.now() < tokenExp - 10_000) {
      return token;
    }
    token = await login();
    tokenExp = jwtExpMs(token) ?? Date.now() + 10 * 60 * 1000;
    return token;
  }

  async function request(path: string, method: string, body?: object, attempt = 0): Promise<PbResponse> {
    const auth = await adminToken();
    const response = await raw(path, method, auth, body);
    if (response.status === 401 && attempt === 0) {
      token = "";
      return request(path, method, body, 1);
    }
    return response;
  }

  async function collectionId(name: string): Promise<string | null> {
    const response = await request(`/api/collections/${encodeURIComponent(name)}`, "GET");
    if (response.status === 404) {
      return null;
    }
    if (response.status === 200 && isRecord(response.body) && typeof response.body.id === "string") {
      return response.body.id;
    }
    throw new PaymentFlowError(503, "Не удалось подготовить коллекцию платежей");
  }

  async function createCollection(definition: Record<string, unknown>): Promise<void> {
    const response = await request("/api/collections", "POST", definition);
    if (response.status === 200 || response.status === 201) {
      return;
    }
    throw new PaymentFlowError(503, "Не удалось подготовить коллекцию платежей");
  }

  async function doEnsure(): Promise<void> {
    configured();
    let paymentsId = await collectionId("payments");
    if (paymentsId === null) {
      await createCollection(paymentsCollectionDefinition());
      paymentsId = await collectionId("payments");
    }
    if (paymentsId === null) {
      throw new PaymentFlowError(503, "Не удалось подготовить коллекцию платежей");
    }
    const creditsId = await collectionId("payment_credits");
    if (creditsId === null) {
      await createCollection(creditsCollectionDefinition(paymentsId));
    }
  }

  return {
    ensureSchema(): Promise<void> {
      schema ??= doEnsure().catch((error: unknown) => {
        schema = null;
        throw error;
      });
      return schema;
    },

    async authUser(userToken: string): Promise<string | null> {
      configured();
      const response = await raw("/api/collections/users/auth-refresh", "POST", userToken, {});
      if (response.status === 401 || response.status === 403) {
        return null;
      }
      if (response.status !== 200 || !isRecord(response.body) || !isRecord(response.body.record)) {
        throw new PaymentFlowError(502, "Не удалось проверить сессию");
      }
      const id = response.body.record.id;
      return typeof id === "string" && id.length > 0 ? id : null;
    },

    async createPayment(input: { userId: string; amountRub: number; idempotenceKey: string }): Promise<StoredPayment> {
      const response = await request("/api/collections/payments/records", "POST", {
        user: input.userId,
        amount: input.amountRub,
        status: "pending",
        credited: false,
        idempotence_key: input.idempotenceKey,
      });
      if (response.status !== 200 && response.status !== 201) {
        throw new PaymentFlowError(502, "Не удалось сохранить платёж");
      }
      return readStored(response.body);
    },

    async getPayment(id: string): Promise<StoredPayment | null> {
      const response = await request(`/api/collections/payments/records/${encodeURIComponent(id)}`, "GET");
      if (response.status === 404) {
        return null;
      }
      if (response.status !== 200) {
        throw new PaymentFlowError(502, "Не удалось прочитать платёж");
      }
      return readStored(response.body);
    },

    async findByYookassaId(yookassaId: string): Promise<StoredPayment | null> {
      const filter = `yookassa_payment_id=${quoteFilter(yookassaId)}`;
      const path = `/api/collections/payments/records?page=1&perPage=1&filter=${encodeURIComponent(filter)}`;
      const response = await request(path, "GET");
      if (response.status !== 200 || !isRecord(response.body) || !Array.isArray(response.body.items)) {
        throw new PaymentFlowError(502, "Не удалось прочитать платёж");
      }
      const first = response.body.items[0];
      return first === undefined ? null : readStored(first);
    },

    async updatePayment(id: string, patch: {
      status?: PaymentStatus;
      credited?: boolean;
      yookassaPaymentId?: string;
    }): Promise<void> {
      const body: Record<string, unknown> = {};
      if (patch.status !== undefined) {
        body.status = patch.status;
      }
      if (patch.credited !== undefined) {
        body.credited = patch.credited;
      }
      if (patch.yookassaPaymentId !== undefined) {
        body.yookassa_payment_id = patch.yookassaPaymentId;
      }
      const response = await request(
        `/api/collections/payments/records/${encodeURIComponent(id)}`,
        "PATCH",
        body,
      );
      if (response.status !== 200) {
        throw new PaymentFlowError(502, "Не удалось сохранить платёж");
      }
    },

    async createCredit(payment: StoredPayment): Promise<{ created: true; creditId: string } | { created: false; creditId: "" }> {
      const response = await request("/api/collections/payment_credits/records", "POST", {
        payment: payment.id,
        user: payment.userId,
        amount: payment.amountRub,
        applied: false,
      });
      if (response.status === 200 || response.status === 201) {
        const creditId = isRecord(response.body) && typeof response.body.id === "string" ? response.body.id : "";
        return { created: true, creditId };
      }
      if (response.status === 400 && (isUniqueConflict(response.body) || isAlreadyCredited(response.body))) {
        return { created: false, creditId: "" };
      }
      throw new PaymentFlowError(502, "Не удалось зачислить платёж");
    },

    async markCreditApplied(creditId: string): Promise<void> {
      if (creditId === "") {
        return;
      }
      const response = await request(
        `/api/collections/payment_credits/records/${encodeURIComponent(creditId)}`,
        "PATCH",
        { applied: true },
      );
      if (response.status !== 200) {
        throw new PaymentFlowError(502, "Не удалось зачислить платёж");
      }
    },

    async getBalance(userId: string): Promise<number> {
      const response = await request(`/api/collections/users/records/${encodeURIComponent(userId)}`, "GET");
      if (response.status !== 200 || !isRecord(response.body)) {
        throw new PaymentFlowError(502, "Не удалось прочитать баланс");
      }
      const balance = response.body.balance;
      return typeof balance === "number" && Number.isFinite(balance) ? balance : 0;
    },

    async addBalance(userId: string, amountRub: number): Promise<number> {
      const current = await this.getBalance(userId);
      const next = addRubles(current, amountRub);
      const response = await request(
        `/api/collections/users/records/${encodeURIComponent(userId)}`,
        "PATCH",
        { balance: next },
      );
      if (response.status !== 200) {
        throw new PaymentFlowError(502, "Не удалось зачислить платёж");
      }
      return next;
    },
  };
}

export type PbAdmin = ReturnType<typeof createPbAdmin>;
