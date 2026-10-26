import { isRecord } from "./isRecord";
import type { PbOccupiedRange } from "./pbTypes";

export const PUBLIC_POCKETBASE_URL = "https://pb.booking.vallome.ru";

const USERS_COLLECTION = "users";

export type PbFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export type PbTokenSource =
  | string
  | null
  | undefined
  | (() => string | null | undefined);

export type CreatePbClientOptions = {
  baseUrl?: string;
  fetchFn?: PbFetch;
  token?: PbTokenSource;
  /** Вызывается, если запрос с этим токеном получил 401. */
  onUnauthorized?: (token: string) => void;
};

export type PbListQuery = {
  page?: number;
  perPage?: number;
  filter?: string;
  sort?: string;
  expand?: string;
  fields?: string;
  skipTotal?: boolean;
};

export type PbListResult<TItem> = {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  items: TItem[];
};

export type PbAuthResult = {
  token: string;
  record: Record<string, unknown>;
};

export type PbChangeEmailResult = {
  email: string;
  pending: boolean;
};

export type PbClient = {
  readonly baseUrl: string;
  authWithPassword(identity: string, password: string, collection?: string): Promise<PbAuthResult>;
  listRecords<TItem = unknown>(collection: string, query?: PbListQuery): Promise<PbListResult<TItem>>;
  getRecord<TItem = unknown>(collection: string, id: string): Promise<TItem>;
  createRecord<TItem = unknown>(collection: string, body: object): Promise<TItem>;
  updateRecord<TItem = unknown>(collection: string, id: string, body: object): Promise<TItem>;
  deleteRecord(collection: string, id: string): Promise<void>;
  post(path: string, body: object): Promise<unknown>;
  changeEmail(email: string): Promise<PbChangeEmailResult>;
  requestVerification(email: string): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  confirmPasswordReset(token: string, password: string): Promise<void>;
  occupiedDates(listingId: string, excludeBookingId?: string): Promise<PbOccupiedRange[]>;
  occupiedListings(checkIn: string, checkOut: string): Promise<readonly string[]>;
};

type Query = Record<string, string | number | boolean | undefined>;

export class PbRequestError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = "PbRequestError";
    this.status = status;
    this.body = body;
  }
}

export function resolvePocketBaseUrl(explicit?: string): string {
  const fromEnv = readEnvUrl();
  const raw = (explicit ?? fromEnv).trim();
  return raw.replace(/\/+$/, "");
}

export function buildPbFileUrl(
  baseUrl: string,
  collection: string,
  recordId: string,
  filename: string,
): string {
  const root = baseUrl.replace(/\/+$/, "");
  return `${root}/api/files/${collection}/${recordId}/${encodeURIComponent(filename)}`;
}

function readEnvUrl(): string {
  const value: unknown = import.meta.env.VITE_POCKETBASE_URL;
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return PUBLIC_POCKETBASE_URL;
}

function currentToken(source: PbTokenSource): string | null {
  const value = typeof source === "function" ? source() : source;
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function withQuery(baseUrl: string, path: string, query?: Query): string {
  const url = new URL(path, `${baseUrl}/`);
  if (query !== undefined) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

function encodeBody(body: object | undefined): BodyInit | undefined {
  if (body === undefined) {
    return undefined;
  }
  if (body instanceof FormData) {
    return body;
  }
  return JSON.stringify(body);
}

function buildHeaders(token: string | null, body: BodyInit | undefined): Headers {
  const headers = new Headers();
  headers.set("Accept", "application/json");
  if (token !== null) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (body !== undefined && !(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  return headers;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function readResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  const parsed = text.trim().length === 0 ? null : parseJson(text);
  if (!response.ok) {
    const message = isRecord(parsed) && typeof parsed.message === "string"
      ? parsed.message
      : `PocketBase ${response.status}`;
    throw new PbRequestError(response.status, message, parsed);
  }
  return parsed;
}

function recordsPath(collection: string, id?: string): string {
  const path = `/api/collections/${encodeURIComponent(collection)}/records`;
  return id === undefined ? path : `${path}/${encodeURIComponent(id)}`;
}

function readNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function readListResult<TItem>(value: unknown): PbListResult<TItem> {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    throw new PbRequestError(200, "Некорректный список PocketBase", value);
  }
  return {
    page: readNumber(value.page),
    perPage: readNumber(value.perPage),
    totalItems: readNumber(value.totalItems),
    totalPages: readNumber(value.totalPages),
    items: value.items as TItem[],
  };
}

function readAuth(value: unknown): PbAuthResult {
  if (!isRecord(value) || typeof value.token !== "string" || !isRecord(value.record)) {
    throw new PbRequestError(200, "Некорректный ответ авторизации", value);
  }
  return { token: value.token, record: value.record };
}

function readChangeEmail(value: unknown): PbChangeEmailResult {
  if (
    !isRecord(value)
    || typeof value.email !== "string"
    || typeof value.pending !== "boolean"
  ) {
    throw new PbRequestError(200, "Некорректный ответ смены email", value);
  }
  return { email: value.email, pending: value.pending };
}

function readRanges(value: unknown): PbOccupiedRange[] {
  if (!isRecord(value) || !Array.isArray(value.ranges)) {
    throw new PbRequestError(200, "Некорректный ответ занятости", value);
  }
  const ranges: PbOccupiedRange[] = [];
  for (const item of value.ranges) {
    if (!isRecord(item) || typeof item.start !== "string" || typeof item.end !== "string") {
      continue;
    }
    ranges.push({ start: item.start, end: item.end });
  }
  return ranges;
}

function readListingIds(value: unknown): string[] {
  if (!isRecord(value) || !Array.isArray(value.listingIds)) {
    throw new PbRequestError(200, "Некорректный ответ занятости", value);
  }
  return value.listingIds.filter((id): id is string => typeof id === "string" && id.length > 0);
}

function listQuery(query: PbListQuery | undefined): Query | undefined {
  if (query === undefined) {
    return undefined;
  }
  return {
    page: query.page,
    perPage: query.perPage,
    filter: query.filter,
    sort: query.sort,
    expand: query.expand,
    fields: query.fields,
    skipTotal: query.skipTotal,
  };
}

export function createPbClient(options: CreatePbClientOptions = {}): PbClient {
  const baseUrl = resolvePocketBaseUrl(options.baseUrl);
  const fetchFn = options.fetchFn ?? ((input, init) => globalThis.fetch(input, init));
  const tokenSource = options.token ?? null;

  async function send(path: string, method: string, query?: Query, body?: object): Promise<unknown> {
    const token = currentToken(tokenSource);
    const encoded = encodeBody(body);
    try {
      return await readResponse(await fetchFn(withQuery(baseUrl, path, query), {
        method,
        headers: buildHeaders(token, encoded),
        body: encoded,
      }));
    } catch (error) {
      if (error instanceof PbRequestError && error.status === 401 && token !== null) {
        options.onUnauthorized?.(token);
      }
      throw error;
    }
  }

  return {
    baseUrl,
    authWithPassword(identity, password, collection = USERS_COLLECTION) {
      const path = `/api/collections/${encodeURIComponent(collection)}/auth-with-password`;
      return send(path, "POST", undefined, { identity, password }).then(readAuth);
    },
    listRecords<TItem = unknown>(collection: string, query?: PbListQuery) {
      return send(recordsPath(collection), "GET", listQuery(query)).then(
        (value) => readListResult<TItem>(value),
      );
    },
    getRecord<TItem = unknown>(collection: string, id: string) {
      return send(recordsPath(collection, id), "GET").then((value) => value as TItem);
    },
    createRecord<TItem = unknown>(collection: string, body: object) {
      return send(recordsPath(collection), "POST", undefined, body).then((value) => value as TItem);
    },
    updateRecord<TItem = unknown>(collection: string, id: string, body: object) {
      return send(recordsPath(collection, id), "PATCH", undefined, body).then((value) => value as TItem);
    },
    async deleteRecord(collection, id) {
      await send(recordsPath(collection, id), "DELETE");
    },
    post(path, body) {
      return send(path, "POST", undefined, body);
    },
    changeEmail(email) {
      return send("/api/vallome/change-email", "POST", undefined, { email }).then(readChangeEmail);
    },
    async requestVerification(email) {
      await send("/api/collections/users/request-verification", "POST", undefined, { email });
    },
    async requestPasswordReset(email) {
      await send("/api/collections/users/request-password-reset", "POST", undefined, { email });
    },
    async confirmPasswordReset(token, password) {
      await send("/api/collections/users/confirm-password-reset", "POST", undefined, {
        token,
        password,
        passwordConfirm: password,
      });
    },
    occupiedDates(listingId, excludeBookingId) {
      return send("/api/vallome/occupied-dates", "GET", {
        listing: listingId,
        excludeBookingId,
      }).then(readRanges);
    },
    occupiedListings(checkIn, checkOut) {
      return send("/api/vallome/occupied-listings", "GET", { checkIn, checkOut }).then(readListingIds);
    },
  };
}
