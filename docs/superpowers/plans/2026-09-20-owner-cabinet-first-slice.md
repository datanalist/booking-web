# Кабинет владельца GlobalStay — первый срез Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Собрать десктоп-кабинет владельца: вход, список объявлений, мастер из 6 шагов, предпросмотр и отправка на модерацию — пиксель-в-пиксель по Figma, данные в мок-адаптере.

**Architecture:** Vite SPA. Экраны вызывают только `AuthApi` / `ListingsApi`. Мок пишет в `localStorage` за тем же интерфейсом, который позже закроет PocketBase. Примитивы в `src/ui/`, экраны в `src/pages/`, гарды и сессия в `src/app/`.

**Tech Stack:** Vite 6, React 18, TypeScript, React Router 6, Tailwind CSS 4 (`@tailwindcss/vite`), Vitest + jsdom + Testing Library. Сборка — `dist/` за Caddy.

**Спека:** [`docs/superpowers/specs/2026-09-20-owner-cabinet-first-slice-design.md`](../specs/2026-09-20-owner-cabinet-first-slice-design.md)  
**Макет:** Figma `zqPAmK0qrRQtqMp5IP3K5u`, секция `1:16219`. При вёрстке снимать кадры через Figma MCP, не по памяти.

## Global Constraints

- Vite + React + TypeScript + React Router; Caddy отдаёт `dist`; nginx нет; Vite dev на VPS не выставляем.
- `SERVICE_COMMISSION_RATE` только в `src/config/index.ts`. В JSX число `0.09` не копировать.
- Страницы не трогают `localStorage` и PocketBase — только `src/api/*`.
- `ui/*` не знает сессию и объявления — только пропсы.
- Мок никогда не ставит `status: "published"`. Статуса `rejected` нет.
- Пользовательские строки — только text content, не `dangerouslySetInnerHTML`.
- Секретов в `VITE_*` нет. Source maps в production выключены.
- Viewport `< 1280`: заглушка «Откройте сайт с компьютера». `≥ 1280`: кабинет, холст не уже 1440, на 1280–1439 горизонтальный скролл.
- Пиксель-сверка только на ширине 1440. Шрифт Noto Sans 400/700. Акцент `#f88a2a`. Текст `#212121`. Насыщенный `#1a1b1d`. Кнопка radius 30, инпут 8.
- UI только на русском.
- Дисклеймер условий — `span` без `href`.
- TravelLine и «Опубликовать» — заглушки, `ListingsApi` не вызывают.
- Выход только с `/profile` через модалку `1:22639`.
- Перед каждым commit: не класть `.env` с секретами; при изменении запуска/сборки обновить `README.md`.

## File structure

| Путь | Ответственность |
| --- | --- |
| `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `index.html` | каркас, Vitest, Tailwind, `sourcemap: false` в build |
| `src/main.tsx`, `src/index.css`, `src/vite-env.d.ts` | вход, CSS-переменные токенов |
| `src/config/index.ts` | ставка комиссии, порог ширины, токены, подписи enum |
| `src/lib/money.ts` | `commissionOf`, `clientPriceOf` |
| `src/lib/hash.ts` | `sha256Hex` |
| `src/lib/id.ts` | `createId` |
| `src/lib/memoryStorage.ts` | `MemoryStorage` для тестов |
| `src/lib/wizardValidation.ts` | `validateStep` |
| `src/lib/compressImage.ts` | сжатие фото до JPEG ≤ 1600px |
| `src/api/types.ts` | `Session`, `Listing`, `ListingDraft`, `AuthApi`, `ListingsApi`, enum’ы |
| `src/api/keys.ts` | `gs.session`, `gs.users`, `gs.listings` |
| `src/api/auth.ts` | `createAuthApi(storage)` |
| `src/api/listings.ts` | `createListingsApi(storage)` |
| `src/api/index.ts` | фабрика адаптеров (мок) |
| `src/app/guards.ts` | `resolveLocation` |
| `src/app/session.tsx` | `SessionProvider`, `useSession` |
| `src/app/useViewport.ts` | `isDesktopViewport` |
| `src/app/router.tsx` | маршруты |
| `src/ui/*.tsx` | Button, Input, Sidebar, Tabs, Search, ListingCard, EmptyState, Modal, WizardSteps |
| `src/pages/AuthLayout.tsx` | сплит формы и фото |
| `src/pages/LoginPage.tsx`, `RegisterPage.tsx`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx`, `OnboardingPage.tsx` | auth |
| `src/pages/CabinetLayout.tsx` | сайдбар + контент |
| `src/pages/ListingsPage.tsx`, `ListingWizardPage.tsx`, `ListingPreviewPage.tsx` | объявления |
| `src/pages/StubPage.tsx`, `DesktopOnlyPage.tsx` | заглушки |
| `src/App.tsx` | viewport + router |
| `docs/architecture.md`, `docs/screens.md`, `docs/data-adapter.md`, `docs/caddy/Caddyfile.example` | документация среза |
| `README.md` | запуск, сборка, Caddy |

Тесты рядом с кодом: `src/lib/*.test.ts`, `src/api/*.test.ts`, `src/app/guards.test.ts`.

---

### Task 1: Каркас Vite + Vitest + Tailwind

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/vite-env.d.ts`, `src/smoke.test.ts`
- Modify: `README.md`, `.gitignore` (добавить `*.tsbuildinfo` если нет)

**Interfaces:**
- Consumes: ничего
- Produces: `npm run dev`, `npm run build`, `npm test`; CSS-переменные `--color-text`, `--color-ink`, `--color-accent`, `--font-sans`

- [ ] **Step 1: Записать `package.json` и конфиги**

`package.json`:

```json
{
  "name": "booking-web",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

Установить:

```bash
npm install react react-dom react-router-dom
npm install -D vite @vitejs/plugin-react typescript @types/react @types/react-dom tailwindcss @tailwindcss/vite vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

`vite.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: { sourcemap: false },
  test: { environment: "jsdom", setupFiles: "./src/test-setup.ts" },
});
```

`src/test-setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

`tsconfig.json`:

```json
{
  "files": [],
  "references": [{ "path": "./tsconfig.app.json" }, { "path": "./tsconfig.node.json" }]
}
```

`tsconfig.app.json`: `jsx: react-jsx`, `include: ["src"]`, `strict: true`.  
`tsconfig.node.json`: include `vite.config.ts`.

`index.html`: `<div id="root"></div>`, `<script type="module" src="/src/main.tsx">`, title `GlobalStay`.

`src/index.css`:

```css
@import "tailwindcss";
@import url("https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&display=swap");

@theme {
  --color-text: #212121;
  --color-ink: #1a1b1d;
  --color-accent: #f88a2a;
  --color-white: #ffffff;
  --font-sans: "Noto Sans", sans-serif;
  --radius-button: 30px;
  --radius-input: 8px;
}

html, body, #root { min-height: 100%; }
body { margin: 0; font-family: var(--font-sans); color: var(--color-text); background: #fffdf8; }
```

`src/App.tsx`: `export function App() { return <div>GlobalStay</div>; }`  
`src/main.tsx`: `createRoot` + `App` + `import "./index.css"`.

- [ ] **Step 2: Написать smoke-тест**

`src/smoke.test.ts`:

```ts
import { render, screen } from "@testing-library/react";
import { App } from "./App";

test("renders brand", () => {
  render(<App />);
  expect(screen.getByText("GlobalStay")).toBeInTheDocument();
});
```

- [ ] **Step 3: Запустить тест — должен пройти после Step 1–2**

Run: `npm test`  
Expected: PASS `renders brand`

- [ ] **Step 4: Обновить README — команды `npm install`, `npm run dev`, `npm test`, `npm run build` → `dist/`**

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vite.config.ts tsconfig*.json index.html src README.md
git commit -m "Добавить каркас Vite, React и Vitest."
```

---

### Task 2: Конфиг и комиссия

**Files:**
- Create: `src/config/index.ts`, `src/lib/money.ts`, `src/lib/money.test.ts`

**Interfaces:**
- Consumes: ничего
- Produces:
  - `SERVICE_COMMISSION_RATE: 0.09`
  - `DESKTOP_MIN_WIDTH: 1280`
  - `CANVAS_WIDTH: 1440`
  - `commissionOf(base: number): number`
  - `clientPriceOf(base: number): number`

- [ ] **Step 1: Падающий тест комиссии**

`src/lib/money.test.ts`:

```ts
import { commissionOf, clientPriceOf } from "./money";

test("3500 → 315 commission", () => {
  expect(commissionOf(3500)).toBe(315);
});

test("3500 → 3815 client price", () => {
  expect(clientPriceOf(3500)).toBe(3815);
});
```

- [ ] **Step 2: Запустить тест — FAIL `money` not defined**

Run: `npx vitest run src/lib/money.test.ts`  
Expected: FAIL cannot find module `./money`

- [ ] **Step 3: Реализация**

`src/config/index.ts`:

```ts
export const SERVICE_COMMISSION_RATE = 0.09;
export const DESKTOP_MIN_WIDTH = 1280;
export const CANVAS_WIDTH = 1440;
export const DESCRIPTION_MAX = 500;
export const PHOTO_MIN = 6;
export const PHOTO_MAX = 9;
export const PASSWORD_MIN = 8;
export const NAME_MIN = 2;
export const NAME_MAX = 50;

export const HOUSING_LABELS = {
  apartment: "Квартира",
  apartments: "Апартаменты",
  studio: "Студия",
  house: "Дом",
  room: "Комната",
} as const;

export const AMENITY_LABELS = {
  wifi: "Wifi",
  tv: "Телевизор",
  ac: "Кондиционер",
  heater: "Обогреватель",
  hairdryer: "Фен",
  iron: "Утюг",
  kitchen: "Кухня",
  washer: "Стиральная машина",
  dishes: "Посуда",
} as const;

export const EXTRA_AMENITY_LABELS = {
  breakfast: "Завтраки",
  pool: "Бассейн",
  fireplace: "Камин",
  smoking: "Разрешено курение",
  gym: "Спортзал",
  selfCheckIn: "Самостоятельное заселение",
  sauna: "Сауна",
  parking: "Парковка",
} as const;

export const STATUS_LABELS = {
  draft: "Черновик",
  moderation: "На модерации",
  published: "Опубликовано",
  archived: "Архив",
} as const;
```

`src/lib/money.ts`:

```ts
import { SERVICE_COMMISSION_RATE } from "../config";

export function commissionOf(base: number): number {
  return Math.round(base * SERVICE_COMMISSION_RATE);
}

export function clientPriceOf(base: number): number {
  return base + commissionOf(base);
}
```

- [ ] **Step 4: Запустить тесты — PASS**

Run: `npx vitest run src/lib/money.test.ts`  
Expected: 2 PASS

- [ ] **Step 5: Commit**

```bash
git add src/config/index.ts src/lib/money.ts src/lib/money.test.ts
git commit -m "Добавить расчёт комиссии 9% из конфига."
```

---

### Task 3: Типы, хеш пароля, MemoryStorage

**Files:**
- Create: `src/api/types.ts`, `src/api/keys.ts`, `src/lib/hash.ts`, `src/lib/hash.test.ts`, `src/lib/id.ts`, `src/lib/memoryStorage.ts`

**Interfaces:**
- Consumes: ничего
- Produces: типы как в спеке §7; `sha256Hex(text: string): Promise<string>`; `createId(): string`; `class MemoryStorage implements Storage`

- [ ] **Step 1: Падающий тест хеша**

`src/lib/hash.test.ts`:

```ts
import { sha256Hex } from "./hash";

test("hashes utf-8 password", async () => {
  const hex = await sha256Hex("secret12");
  expect(hex).toMatch(/^[a-f0-9]{64}$/);
  expect(hex).toBe(await sha256Hex("secret12"));
  expect(hex).not.toBe(await sha256Hex("secret13"));
});
```

- [ ] **Step 2: FAIL**

Run: `npx vitest run src/lib/hash.test.ts`  
Expected: FAIL cannot find module

- [ ] **Step 3: Реализация**

`src/lib/hash.ts`:

```ts
export async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
```

`src/lib/id.ts`:

```ts
export function createId(): string {
  return crypto.randomUUID();
}
```

`src/lib/memoryStorage.ts`:

```ts
export class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() { return this.data.size; }
  clear() { this.data.clear(); }
  getItem(key: string) { return this.data.get(key) ?? null; }
  key(index: number) { return [...this.data.keys()][index] ?? null; }
  removeItem(key: string) { this.data.delete(key); }
  setItem(key: string, value: string) { this.data.set(key, value); }
}
```

`src/api/keys.ts`:

```ts
export const SESSION_KEY = "gs.session";
export const USERS_KEY = "gs.users";
export const LISTINGS_KEY = "gs.listings";
```

`src/api/types.ts` — скопировать блок типов из спеки §7 целиком (`ListingStatus`, `HousingType`, `AmenityId`, `ExtraAmenityId`, `Session`, `Listing`, `ListingDraft`, `AuthApi`, `ListingsApi`). У `requestPasswordReset` сразу пиши `Promise<string>` (мок возвращает демо-токен для ссылки на `/reset-password`). Добавить:

```ts
export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  phone: string;
  photoUrl?: string;
  onboardingComplete: boolean;
};
```

- [ ] **Step 4: PASS**

Run: `npx vitest run src/lib/hash.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/api/types.ts src/api/keys.ts src/lib/hash.ts src/lib/hash.test.ts src/lib/id.ts src/lib/memoryStorage.ts
git commit -m "Добавить типы API, SHA-256 и память для тестов."
```

---

### Task 4: AuthApi мок

**Files:**
- Create: `src/api/auth.ts`, `src/api/auth.test.ts`
- Modify: none

**Interfaces:**
- Consumes: `AuthApi`, `Session`, `UserRecord`, `sha256Hex`, `createId`, `SESSION_KEY`, `USERS_KEY`, `MemoryStorage`
- Produces: `createAuthApi(storage: Storage): AuthApi`

Ошибки бросать как `Error` с полем `code`:
- `EMAIL_TAKEN` — «Такой email уже зарегистрирован»
- `INVALID_EMAIL` — «Обязательное поле» / невалидный формат: «Введите корректный email»
- `INVALID_PASSWORD` — пароль < 8: «Минимум 8 символов»
- `INVALID_CREDENTIALS` — «Неверный email или пароль»
- `INVALID_TOKEN` — «Ссылка недействительна»
- `INVALID_NAME` / `INVALID_PHONE`

Нормализация email: `trim().toLowerCase()`.  
Телефон: ровно `+7` и 10 цифр (из маски вычищать всё кроме цифр, проверить что 11 цифр и начинается с 7).  
`register` возвращает `Session` с `name: ""`, `phone: ""`, `onboardingComplete: false`. Пароля в Session нет.  
`requestPasswordReset` кладёт в storage ключ `gs.reset.<token>` → email.  
`confirmPasswordReset` меняет hash и удаляет токен.

- [ ] **Step 1: Падающие тесты**

`src/api/auth.test.ts`:

```ts
import { createAuthApi } from "./auth";
import { MemoryStorage } from "../lib/memoryStorage";
import { SESSION_KEY } from "./keys";

function api() {
  return createAuthApi(new MemoryStorage());
}

test("register then login", async () => {
  const auth = api();
  const session = await auth.register("A@Mail.ru", "secret12");
  expect(session.email).toBe("a@mail.ru");
  expect(session.onboardingComplete).toBe(false);
  expect(session).not.toHaveProperty("password");
  expect(session).not.toHaveProperty("passwordHash");
  const again = await auth.login("a@mail.ru", "secret12");
  expect(again.userId).toBe(session.userId);
});

test("duplicate email", async () => {
  const auth = api();
  await auth.register("a@mail.ru", "secret12");
  await expect(auth.register("A@mail.ru", "secret12")).rejects.toThrow("Такой email уже зарегистрирован");
});

test("wrong password", async () => {
  const auth = api();
  await auth.register("a@mail.ru", "secret12");
  await expect(auth.login("a@mail.ru", "nope0000")).rejects.toThrow("Неверный email или пароль");
});

test("onboarding requires name and phone", async () => {
  const auth = api();
  await auth.register("a@mail.ru", "secret12");
  const done = await auth.completeOnboarding({ name: "Анна", phone: "+7 (900) 123-45-67" });
  expect(done.onboardingComplete).toBe(true);
  expect(done.name).toBe("Анна");
  expect(done.phone).toBe("+79001234567");
});

test("reset token works; bad token fails", async () => {
  const storage = new MemoryStorage();
  const auth = createAuthApi(storage);
  await auth.register("a@mail.ru", "secret12");
  await auth.requestPasswordReset("a@mail.ru");
  const tokenKey = [...Array(storage.length)].map((_, i) => storage.key(i)).find((k) => k?.startsWith("gs.reset."));
  const token = tokenKey!.replace("gs.reset.", "");
  await auth.confirmPasswordReset(token, "newpass12");
  await auth.login("a@mail.ru", "newpass12");
  await expect(auth.confirmPasswordReset("bad", "newpass13")).rejects.toThrow("Ссылка недействительна");
});

test("session has no password after logout", async () => {
  const storage = new MemoryStorage();
  const auth = createAuthApi(storage);
  await auth.register("a@mail.ru", "secret12");
  await auth.logout();
  expect(storage.getItem(SESSION_KEY)).toBeNull();
});
```

- [ ] **Step 2: FAIL**

Run: `npx vitest run src/api/auth.test.ts`  
Expected: FAIL cannot find `./auth`

- [ ] **Step 3: Реализовать `createAuthApi`**

Читать/писать JSON массива `UserRecord[]` в `USERS_KEY`. Сессию — объект `Session` в `SESSION_KEY`.  
`completeOnboarding` берёт текущую сессию, валидирует имя 2–50 и телефон, обновляет user + session.  
Не сохранять сырой пароль нигде.

- [ ] **Step 4: PASS**

Run: `npx vitest run src/api/auth.test.ts`  
Expected: все PASS

- [ ] **Step 5: Commit**

```bash
git add src/api/auth.ts src/api/auth.test.ts
git commit -m "Добавить мок авторизации с хешем пароля."
```

---

### Task 5: ListingsApi и машина статусов

**Files:**
- Create: `src/api/listings.ts`, `src/api/listings.test.ts`, `src/lib/emptyDraft.ts`

**Interfaces:**
- Consumes: `Listing`, `ListingDraft`, `ListingsApi`, `LISTINGS_KEY`, `createId`
- Produces:
  - `emptyDraft(ownerId: string): ListingDraft` — дефолты спеки: `photos []`, чипсы `[]`, `maxGuests 0`, булевы `false`, строки `""`, цены `0`, `uniquePrices []`, `status: "draft"`
  - `createListingsApi(storage: Storage, getUserId: () => string | null): ListingsApi`

Правила `list`:
- только `ownerId === currentUser`
- `tab === "all"` — все свои; `"published"` — `status === "published"` (всегда пусто); `"moderation"` / `"archived"` — по статусу
- `query` trim, `toLowerCase()`, попадание в `title` или `address`

`saveDraft`: если нет `id` — создать, `status` оставить `draft` если новый, **не менять** `moderation`/`archived`.  
`submitForModeration`: все шаги должны быть валидны — валидацию вызовет вызывающий; API ставит `moderation` для `draft` или `archived`. Для уже `moderation` — идемпотентно. Не принимать `published` (его нет).  
`archive` → `archived`.  
`remove` удаляет запись.  
Чужой id → throw `NOT_FOUND`.  
Никогда не писать `published`.

- [ ] **Step 1: Падающие тесты**

`src/api/listings.test.ts`:

```ts
import { createListingsApi } from "./listings";
import { emptyDraft } from "../lib/emptyDraft";
import { MemoryStorage } from "../lib/memoryStorage";

function setup() {
  const storage = new MemoryStorage();
  const api = createListingsApi(storage, () => "u1");
  return { api };
}

test("step1 draft appears in all, not in moderation", async () => {
  const { api } = setup();
  const draft = emptyDraft("u1");
  draft.title = "Студия";
  draft.address = "Москва";
  draft.housingType = "apartment";
  draft.description = "Текст";
  const saved = await api.saveDraft(draft);
  expect(saved.status).toBe("draft");
  const all = await api.list({ tab: "all", query: "" });
  const mod = await api.list({ tab: "moderation", query: "" });
  expect(all).toHaveLength(1);
  expect(mod).toHaveLength(0);
});

test("submit then edit keeps moderation", async () => {
  const { api } = setup();
  const saved = await api.saveDraft({ ...emptyDraft("u1"), title: "A", address: "B", housingType: "apartment", description: "C" });
  await api.submitForModeration(saved.id);
  const edited = await api.saveDraft({ ...(await api.get(saved.id)), title: "A2" });
  expect(edited.status).toBe("moderation");
  const again = await api.submitForModeration(saved.id);
  expect(again.status).toBe("moderation");
});

test("archive then submit returns to moderation", async () => {
  const { api } = setup();
  const saved = await api.saveDraft({ ...emptyDraft("u1"), title: "A", address: "B", housingType: "apartment", description: "C" });
  await api.submitForModeration(saved.id);
  await api.archive(saved.id);
  const archived = await api.list({ tab: "archived", query: "" });
  expect(archived).toHaveLength(1);
  await api.submitForModeration(saved.id);
  expect((await api.get(saved.id)).status).toBe("moderation");
});

test("search is case-insensitive on title and address", async () => {
  const { api } = setup();
  await api.saveDraft({ ...emptyDraft("u1"), title: "Студия", address: "Невская", housingType: "apartment", description: "C" });
  expect(await api.list({ tab: "all", query: "студ" })).toHaveLength(1);
  expect(await api.list({ tab: "all", query: "невск" })).toHaveLength(1);
  expect(await api.list({ tab: "all", query: "питер" })).toHaveLength(0);
});

test("never writes published; published tab empty", async () => {
  const { api } = setup();
  await api.saveDraft({ ...emptyDraft("u1"), title: "A", address: "B", housingType: "apartment", description: "C" });
  expect(await api.list({ tab: "published", query: "" })).toHaveLength(0);
});

test("remove deletes", async () => {
  const { api } = setup();
  const saved = await api.saveDraft({ ...emptyDraft("u1"), title: "A", address: "B", housingType: "apartment", description: "C" });
  await api.remove(saved.id);
  await expect(api.get(saved.id)).rejects.toThrow();
});
```

- [ ] **Step 2: FAIL**

Run: `npx vitest run src/api/listings.test.ts`  
Expected: FAIL module not found

- [ ] **Step 3: Реализовать `emptyDraft` и `createListingsApi`**

`src/lib/emptyDraft.ts` выставляет дефолты из таблицы статусов спеки.  
`housingType` для пустого черновика: `"apartment"` только после выбора на шаге 1; до выбора в draft можно хранить `housingType: "apartment"` как технический дефолт **или** сделать поле `HousingType | ""` — **нет**: тип спеки требует `HousingType`. Хранить `"apartment"` до выбора нельзя (подмена выбора). Добавить в `ListingDraft` возможность ещё не выбранного вида: в `emptyDraft` поставь `housingType: "apartment"` и флаг не используем. Вместо этого: валидация шага 1 считает вид невыбранным, пока пользователь не трогал селект. Проще и по спеке: в форме UI пустой селект, в draft поле заполняется только при выборе; для `emptyDraft` используй `housingType: "apartment"` **только как placeholder в объекте**, а `validateStep(1)` требует что пользователь передал `housingType` явно — проверяй отдельное поле?  

Решение (одно): расширять тип нельзя. `emptyDraft` ставит `housingType: "apartment"`. `validateStep(1)` требует непустые title/address/description и `housingType` из enum (любое значение enum валидно). Пустой селект в UI не вызывает `saveDraft` до выбора — «Далее» не проходит, пока селект не выбран (состояние формы `housingType: ""` локально, в API не пишется). Это описано в Task 6 и Task 13.

- [ ] **Step 4: PASS**

Run: `npx vitest run src/api/listings.test.ts`  
Expected: все PASS

- [ ] **Step 5: Commit**

```bash
git add src/api/listings.ts src/api/listings.test.ts src/lib/emptyDraft.ts
git commit -m "Добавить мок объявлений и переходы статусов."
```

---

### Task 6: validateStep

**Files:**
- Create: `src/lib/wizardValidation.ts`, `src/lib/wizardValidation.test.ts`

**Interfaces:**
- Consumes: `ListingDraft`, `DESCRIPTION_MAX`, `PHOTO_MIN`, `PHOTO_MAX`
- Produces: `validateStep(step: 1 | 2 | 3 | 4 | 5 | 6, draft: ListingDraft): Record<string, string>` — пустой объект = ок. Ключи полей: `title`, `address`, `housingType`, `description`, `photos`, `maxGuests`, `checkInTime`, `checkOutTime`, `accessInfo`, `houseRules`, `extraInfo`, `priceNight`, `priceFrom14`, `priceFrom28`, `uniquePrices`.

Правила:
- Шаг 1: title/address непустые trim; description 1–500; housingType ∈ enum.
- Шаг 2: `photos.length` в [6, 9], иначе `photos`: «Добавьте ещё N фото» где N = 6 - length если length < 6.
- Шаг 3: всегда ок.
- Шаг 4: `maxGuests >= 1`; `checkInTime` и `checkOutTime` непустые.
- Шаг 5: каждое из трёх текстовых полей длина ≤ 500 (пустые ок).
- Шаг 6: `priceNight`, `priceFrom14`, `priceFrom28` > 0. Если `uniquePrices.length > 0` (или вызывающий передаёт даты — массив может быть пуст при выключенном тоггле): каждая запись `date` формата `YYYY-MM-DD`, `base > 0`. Пустая дата или `base <= 0` → ключ `uniquePrices`.

- [ ] **Step 1: Падающие тесты**

```ts
import { validateStep } from "./wizardValidation";
import { emptyDraft } from "./emptyDraft";

const base = emptyDraft("u1");

test("step 1 requires fields", () => {
  expect(validateStep(1, base).title).toBeTruthy();
  expect(validateStep(1, { ...base, title: "A", address: "B", description: "C", housingType: "apartment" })).toEqual({});
});

test("step 2 photo count", () => {
  expect(validateStep(2, { ...base, photos: ["1"] }).photos).toBe("Добавьте ещё 5 фото");
  expect(validateStep(2, { ...base, photos: Array(6).fill("x") })).toEqual({});
});

test("step 3 always ok", () => {
  expect(validateStep(3, base)).toEqual({});
});

test("step 6 unique price", () => {
  const priced = { ...base, priceNight: 3500, priceFrom14: 3000, priceFrom28: 2800 };
  expect(validateStep(6, priced)).toEqual({});
  expect(validateStep(6, { ...priced, uniquePrices: [{ date: "", base: 10 }] }).uniquePrices).toBeTruthy();
  expect(validateStep(6, { ...priced, uniquePrices: [{ date: "2026-01-01", base: 0 }] }).uniquePrices).toBeTruthy();
  expect(validateStep(6, { ...priced, uniquePrices: [{ date: "2026-01-01", base: 4000 }] })).toEqual({});
});
```

- [ ] **Step 2: FAIL**  
Run: `npx vitest run src/lib/wizardValidation.test.ts`

- [ ] **Step 3: Реализовать `validateStep`**

- [ ] **Step 4: PASS**

- [ ] **Step 5: Commit**

```bash
git add src/lib/wizardValidation.ts src/lib/wizardValidation.test.ts
git commit -m "Добавить валидацию шагов мастера объявления."
```

---

### Task 7: Гарды маршрутов

**Files:**
- Create: `src/app/guards.ts`, `src/app/guards.test.ts`

**Interfaces:**
- Consumes: `Session`
- Produces:

```ts
export type GuardInput = {
  pathname: string;
  session: Session | null;
  step?: string;
  resetTokenValid?: boolean;
};

export function resolveLocation(input: GuardInput): string | null;
// null = остаться. Иначе путь редиректа.
```

Правила (спека §4):
- Кабинет = всё кроме `/login`, `/register`, `/forgot-password`, `/reset-password`.
- Нет сессии + кабинет → `/login`.
- Сессия без онбординга + кабинет (включая заглушки) → `/onboarding`.
- Сессия + `/login`|`/register`|`/forgot-password`|`/reset-password` → `/listings` если онбординг, иначе `/onboarding`.
- `step` задан и не `1`–`6` на `/listings/new` или `/listings/:id/edit` → тот же path с `?step=1` (вернуть путь с query).
- `resetTokenValid === false` на `/reset-password` → не редирект сессии; страница сама рисует ошибку (гард не редиректит). Если есть сессия — редирект как выше.

- [ ] **Step 1: Тесты**

```ts
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
```

- [ ] **Step 2: FAIL**  
Run: `npx vitest run src/app/guards.test.ts`

- [ ] **Step 3: Реализовать `resolveLocation`**

- [ ] **Step 4: PASS**

- [ ] **Step 5: Commit**

```bash
git add src/app/guards.ts src/app/guards.test.ts
git commit -m "Добавить гарды маршрутов кабинета."
```

---

### Task 8: Примитивы UI

**Files:**
- Create: `src/ui/Button.tsx`, `src/ui/Input.tsx`, `src/ui/Sidebar.tsx`, `src/ui/Tabs.tsx`, `src/ui/Search.tsx`, `src/ui/ListingCard.tsx`, `src/ui/EmptyState.tsx`, `src/ui/Modal.tsx`, `src/ui/WizardSteps.tsx`, `src/ui/Button.test.tsx`, `src/ui/Input.test.tsx`
- Сверять с Figma: `Button_web` `1:16237`, `Input_web` `1:16230`, сайдбар на `1:16735`

**Interfaces:**
- Consumes: `STATUS_LABELS`, токены CSS
- Produces: компоненты только на пропсах

```ts
// Button
type ButtonProps = {
  children: React.ReactNode;
  variant?: "filled" | "outlined" | "text";
  disabled?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
  className?: string;
};

// Input
type InputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
};

// Sidebar item: { to: string; label: string; badge?: number }
// Tabs: { id: string; label: string }[]
// ListingCard: { title, address, photoUrl?, statusLabel, onOpen, onEdit, onPublish, onDelete }
// Modal: { open, title, children, onClose }
// WizardSteps: { current: 1|2|3|4|5|6 }
```

- [ ] **Step 1: Тесты Button и Input**

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";
import { Input } from "./Input";

test("button disabled does not click", async () => {
  const onClick = vi.fn();
  render(<Button disabled onClick={onClick}>Далее</Button>);
  await userEvent.click(screen.getByRole("button", { name: "Далее" }));
  expect(onClick).not.toHaveBeenCalled();
});

test("input shows error not html", () => {
  render(<Input label="Email" value="<b>x</b>" onChange={() => {}} error="Неверный email или пароль" />);
  expect(screen.getByText("Неверный email или пароль")).toBeInTheDocument();
  expect(screen.getByDisplayValue("<b>x</b>")).toBeInTheDocument();
});
```

Добавить `vi` из `vitest` в import.

- [ ] **Step 2: FAIL**

- [ ] **Step 3: Сверстать примитивы по кадрам**

Button filled: фон `var(--color-accent)`, цвет белый, height 61, radius 30, Noto Sans Bold 18.  
Outlined: прозрачный фон, обводка accent, тот же radius.  
Input: radius 8, лейбл 14 Regular, ошибка красным под полем.  
Sidebar: ширина 235px, активный пункт фон accent / белый текст; логотип снизу. Пункты: Мои объявления `/listings`, Бронирования `/bookings`, Чаты `/chats`, Уведомления `/notifications`, Профиль `/profile`.  
WizardSteps подписи: Описание, Фото, Удобства, Правила, Дополнительное, Стоимость.  
ListingCard: `title` и `address` как text nodes. Меню: Редактировать / Опубликовать / Удалить — колбэки, без API.  
Modal: оверлей, кнопка закрытия.

- [ ] **Step 4: PASS** `npx vitest run src/ui/Button.test.tsx src/ui/Input.test.tsx`

- [ ] **Step 5: Commit**

```bash
git add src/ui
git commit -m "Добавить UI-примитивы кабинета по макету."
```

---

### Task 9: Сессия, viewport, роутер

**Files:**
- Create: `src/app/session.tsx`, `src/app/useViewport.ts`, `src/app/router.tsx`, `src/api/index.ts`, `src/pages/DesktopOnlyPage.tsx`
- Modify: `src/App.tsx`, `src/main.tsx`

**Interfaces:**
- Consumes: `createAuthApi`, `createListingsApi`, `resolveLocation`, `DESKTOP_MIN_WIDTH`, `CANVAS_WIDTH`
- Produces:
  - `useSession(): { session, auth, listings, reload }`
  - `useViewport(): { isDesktop: boolean }` где `isDesktop = width >= DESKTOP_MIN_WIDTH`
  - фабрика: `auth = createAuthApi(localStorage)`, `listings = createListingsApi(localStorage, () => session?.userId ?? null)`

`DesktopOnlyPage`: текст «Откройте сайт с компьютера», без сайдбара, данные не читать.

Роутер (пока заглушки-страницы с заголовком пути — заменим в следующих задачах):

```
/login /register /forgot-password /reset-password /onboarding
/listings /listings/new /listings/:id/edit /listings/:id/preview
/bookings /chats /notifications /profile
/ → redirect
```

Обёртка `Guarded`: читает `useLocation`, вызывает `resolveLocation`, `Navigate` если не null. Парсит `step` из search.

Корневой `App`: если `!isDesktop` → только `DesktopOnlyPage`, иначе `SessionProvider` + `RouterProvider`. На 1280–1439 `min-width: 1440px` на оболочке кабинета (горизонтальный скролл).

- [ ] **Step 1: Тест viewport-хелпера**

`src/app/useViewport.test.ts`:

```ts
import { DESKTOP_MIN_WIDTH } from "../config";

export function isDesktopWidth(width: number) {
  return width >= DESKTOP_MIN_WIDTH;
}

test("1279 is mobile gate", () => {
  expect(isDesktopWidth(1279)).toBe(false);
  expect(isDesktopWidth(1280)).toBe(true);
});
```

Вынести `isDesktopWidth` в `src/app/useViewport.ts` и импортировать в тесте из того файла (не дублировать функцию в тесте). Итоговый тест:

```ts
import { isDesktopWidth } from "./useViewport";

test("1279 is mobile gate", () => {
  expect(isDesktopWidth(1279)).toBe(false);
  expect(isDesktopWidth(1280)).toBe(true);
});
```

- [ ] **Step 2: FAIL**

- [ ] **Step 3: Реализовать session, router, DesktopOnly, подключить в App**

Пока страницы: `export function LoginPage() { return <h1>Войти</h1>; }` и аналоги — файлы создать сразу, чтобы Task 10 только наполнял.

- [ ] **Step 4: PASS** `npx vitest run src/app/useViewport.test.ts` и `npm test`

- [ ] **Step 5: Commit**

```bash
git add src/app src/api/index.ts src/pages src/App.tsx src/main.tsx
git commit -m "Подключить сессию, роутер и заглушку узкого экрана."
```

---

### Task 10: Экраны авторизации и онбординг

**Files:**
- Modify: `src/pages/AuthLayout.tsx`, `LoginPage.tsx`, `RegisterPage.tsx`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx`, `OnboardingPage.tsx`
- Figma: `1:16226`, `1:16276`, `1:16626`, `1:16685`, `1:21427`, `1:16636`, `1:16693`

**Interfaces:**
- Consumes: `useSession().auth`, `Button`, `Input`, `AuthLayout`
- Produces: рабочие формы

`AuthLayout`: логотип слева сверху, форма ~320px, фото справа (файл в `public/auth-side.jpg` — экспорт правой картинки с `1:16226` / `pic` через Figma MCP `download` или `get_screenshot` + сохранить). Дисклеймер span без ссылок.

Login: email, пароль, «Забыли пароль?», submit «Начать работу», ссылка «Создать аккаунт». Ошибка `INVALID_CREDENTIALS` у поля пароля.

Register: email, пароль, подтверждение. Несовпадение — ошибка у подтверждения. `EMAIL_TAKEN` у email. После успеха → `/onboarding`.

Forgot: email → кадр успеха + ссылка «Задать новый пароль» с token из `gs.reset.*` (мок читает через `auth.requestPasswordReset`, который должен **вернуть token** для демо).

Уточнение API (совместимо со спекой): изменить `requestPasswordReset` на `Promise<string>` (token). Обновить тест Task 4: `const token = await auth.requestPasswordReset(...)`. Если тест уже ждёт `void` — поменять и тест, и реализацию в этом шаге.

Reset: `useSearchParams` token, новый пароль ≥ 8, `confirmPasswordReset`. Битый token — ошибка у поля.

Onboarding: фото optional (сжать через `compressImage` если есть файл), имя, телефон с маской. Submit → `/listings`. Экран успеха `1:16693` можно как короткий промежуточный стейт на той же странице.

- [ ] **Step 1: Проверить, что `requestPasswordReset` уже `Promise<string>` (Task 4). Тест auth зелёный.**

Run: `npx vitest run src/api/auth.test.ts`  
Expected: PASS

- [ ] **Step 2: Экспортировать правую картинку auth из Figma (`1:16226` / слой `pic`) в `public/auth-side.jpg`**

- [ ] **Step 3: Сверстать страницы по кадрам, без HTML в текстах ошибок**

`src/lib/compressImage.ts`:

```ts
export async function compressImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.8);
}
```

- [ ] **Step 4: `npm test` зелёный; вручную: регистрация → онбординг → редирект (пока список-заглушка)**

- [ ] **Step 5: Commit**

```bash
git add src/pages src/api/types.ts src/api/auth.ts src/api/auth.test.ts src/lib/compressImage.ts public
git commit -m "Сверстать вход, регистрацию и онбординг."
```

---

### Task 11: Кабинет, заглушки, выход

**Files:**
- Modify: `src/pages/CabinetLayout.tsx`, `src/pages/StubPage.tsx`, `src/pages/ListingsPage.tsx` (пока пустой каркас), профиль-заглушка
- Figma: сайдбар `1:16735`, модалка `1:22639`

**Interfaces:**
- Consumes: `Sidebar`, `Modal`, `useSession`
- Produces: оболочка `min-w-[1440px] min-h-[1020px]`; StubPage title из маршрута: «Бронирования» / «Чаты» / «Уведомления» / «Профиль» + текст «Раздел появится позже»

Профиль: кнопка «Выйти» → Modal как `1:22639` → `auth.logout()` → `/login`.

Уведомления: badge «2» на сайдбаре **не** рисуем (нет данных); если на кадре бейдж есть — не ставить фейковую «2», чтобы не врать. Сайдбар без бейджа.

- [ ] **Step 1: Тест logout-колбэка не нужен в DOM; тест StubPage рендерит children как текст**

```tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { StubPage } from "./StubPage";

test("stub is plain text", () => {
  render(
    <MemoryRouter>
      <StubPage title="Чаты" />
    </MemoryRouter>,
  );
  expect(screen.getByText("Раздел появится позже")).toBeInTheDocument();
});
```

`StubPage` принимает `title: string`.

- [ ] **Step 2: FAIL**

- [ ] **Step 3: Сверстать CabinetLayout + StubPage + модалку выхода на `/profile`**

- [ ] **Step 4: PASS + `npm test`**

- [ ] **Step 5: Commit**

```bash
git add src/pages
git commit -m "Добавить оболочку кабинета и заглушки разделов."
```

---

### Task 12: Список объявлений

**Files:**
- Modify: `src/pages/ListingsPage.tsx`
- Figma: `1:16735`, `1:18876`, `1:18991`, `1:22504`

**Interfaces:**
- Consumes: `listings.list`, `Tabs`, `Search`, `ListingCard`, `EmptyState`, `Modal`, `STATUS_LABELS`
- Produces: вкладки `all|published|moderation|archived` с подписями «Все / Опубликованы / На модерации / Архив»; поиск; кнопка «Создать объявление» → `/listings/new`; «Импорт из TravelLine» → Modal «Импорт появится позже»; «Опубликовать» на карточке → Modal «Публикацию выполняет администратор, раздел появится позже» и **не** вызывать API; Удалить → `listings.remove`; Редактировать → `/listings/:id/edit`; клик по карточке → `/listings/:id/preview` для draft/moderation/archived

Пустой список: иллюстрация + «Нет объявлений» / «Создайте своё первое объявление о жилье!» как на `1:16735`.  
Вкладка «Опубликованы» всегда EmptyState.  
Title/address через text content.

- [ ] **Step 1: Юнит на маппинг вкладки (чистая функция в том же файле или `src/lib/listingTabs.ts`)**

`src/lib/listingTabs.ts`:

```ts
export const LISTING_TABS = [
  { id: "all", label: "Все" },
  { id: "published", label: "Опубликованы" },
  { id: "moderation", label: "На модерации" },
  { id: "archived", label: "Архив" },
] as const;
```

`src/lib/listingTabs.test.ts`:

```ts
import { LISTING_TABS } from "./listingTabs";
test("four tabs", () => {
  expect(LISTING_TABS.map((t) => t.id)).toEqual(["all", "published", "moderation", "archived"]);
});
```

- [ ] **Step 2: FAIL затем Step 3 файл + страница**

Сверстать ListingsPage по `1:16735` / `1:18876`.

- [ ] **Step 4: PASS `npx vitest run src/lib/listingTabs.test.ts`**

- [ ] **Step 5: Commit**

```bash
git add src/pages/ListingsPage.tsx src/lib/listingTabs.ts src/lib/listingTabs.test.ts
git commit -m "Сверстать список объявлений и заглушку TravelLine."
```

---

### Task 13: Мастер создания / редактирования

**Files:**
- Modify: `src/pages/ListingWizardPage.tsx`
- Figma: `1:19264`, `1:19396`, `1:19479`, `1:19568`, `1:19745`, `1:19818`, `1:19891`, `1:20055`, `1:20147`, `1:20254`

**Interfaces:**
- Consumes: `emptyDraft`, `validateStep`, `listings.saveDraft`, `compressImage`, `HOUSING_LABELS`, `AMENITY_LABELS`, `EXTRA_AMENITY_LABELS`, `commissionOf`, `clientPriceOf`, `WizardSteps`, `Button`, `Input`
- Produces: `/listings/new?step=` и `/listings/:id/edit?step=`

Поведение:
- Новый: локальный draft = `emptyDraft(session.userId)`, селект вида пустой (локальный `housingChosen: boolean`). «Далее» на шаге 1 валидирует; при успехе `saveDraft` и `navigate(/listings/${id}/edit?step=2)`.
- Существующий: `listings.get(id)`, чужой/нет → уже гардом + на ошибке navigate `/listings`.
- «Далее» / «Назад»: если текущий шаг валиден — `saveDraft`, затем смена step. Назад с невалидным шагом 2–6: если полей не трогали после загрузки — разрешить назад без save; если трогали и невалидно — показать ошибки, не уходить.
- Шаг 2: input `multiple` accept jpeg/png/webp, compress каждый, max 9. Текст «Добавьте ещё N фото».
- Шаг 3: чипсы toggle id в массивах, пустой набор ок.
- Шаг 4: maxGuests number, pets/cancel toggles, time inputs.
- Шаг 5: три textarea, счётчик `{length}/500`.
- Шаг 6: три базовые цены; рядом комиссия и цена клиента из `commissionOf`/`clientPriceOf`. Тоггл дат: строки `{date, base}`. «Далее» на шаге 6 → `/listings/:id/preview`.
- Числа на экране из функций, не литерал `0.09`.

- [ ] **Step 1: Тест, что шаг 6 показывает 315 для 3500 — чистая обёртка уже есть (`commissionOf`). Добавить тест навигации step query:**

`src/lib/wizardStep.ts`:

```ts
export function parseStep(raw: string | null): 1 | 2 | 3 | 4 | 5 | 6 {
  const n = Number(raw);
  if (n >= 1 && n <= 6) return n as 1 | 2 | 3 | 4 | 5 | 6;
  return 1;
}
```

`src/lib/wizardStep.test.ts`:

```ts
import { parseStep } from "./wizardStep";
test("clamps step", () => {
  expect(parseStep("3")).toBe(3);
  expect(parseStep("9")).toBe(1);
  expect(parseStep(null)).toBe(1);
});
```

- [ ] **Step 2: FAIL**

- [ ] **Step 3: `parseStep` + полная страница мастера по кадрам**

- [ ] **Step 4: PASS + `npm test`**

- [ ] **Step 5: Commit**

```bash
git add src/pages/ListingWizardPage.tsx src/lib/wizardStep.ts src/lib/wizardStep.test.ts
git commit -m "Собрать мастер создания объявления из шести шагов."
```

---

### Task 14: Предпросмотр и модерация

**Files:**
- Modify: `src/pages/ListingPreviewPage.tsx`
- Figma: `1:20382`, `1:22257`

**Interfaces:**
- Consumes: `listings.get/submitForModeration/archive/remove`, `validateStep` для 1–6, `commissionOf`, `clientPriceOf`, `STATUS_LABELS`, amenity labels
- Produces: предпросмотр; кнопки Править → `/listings/:id/edit`; Удалить → confirm Modal → `remove` → `/listings`; Сохранить в архив → `archive` → `/listings`; Отправить на модерацию → если любой `validateStep` не пуст, не вызывать API, остаться и можно `navigate` на первый невалидный шаг; иначе `submitForModeration` и экран успеха как `1:22257` с переходом к списку

Все тексты объявления — `{listing.description}` как children, не HTML.

- [ ] **Step 1: Тест «можно ли отправить»**

`src/lib/canSubmit.ts`:

```ts
import { validateStep } from "./wizardValidation";
import type { ListingDraft } from "../api/types";

export function firstInvalidStep(draft: ListingDraft): 1 | 2 | 3 | 4 | 5 | 6 | null {
  for (const step of [1, 2, 3, 4, 5, 6] as const) {
    if (Object.keys(validateStep(step, draft)).length > 0) return step;
  }
  return null;
}
```

`src/lib/canSubmit.test.ts`:

```ts
import { firstInvalidStep } from "./canSubmit";
import { emptyDraft } from "./emptyDraft";

test("empty draft blocked at step 1", () => {
  expect(firstInvalidStep(emptyDraft("u1"))).toBe(1);
});
```

- [ ] **Step 2: FAIL**

- [ ] **Step 3: `canSubmit` + страница предпросмотра по `1:20382` + успех `1:22257`**

- [ ] **Step 4: PASS `npm test`**

- [ ] **Step 5: Commit**

```bash
git add src/pages/ListingPreviewPage.tsx src/lib/canSubmit.ts src/lib/canSubmit.test.ts
git commit -m "Добавить предпросмотр объявления и отправку на модерацию."
```

---

### Task 15: Документация и Caddy

**Files:**
- Create: `docs/architecture.md`, `docs/screens.md`, `docs/data-adapter.md`, `docs/caddy/Caddyfile.example`
- Modify: `README.md`

**Interfaces:**
- Consumes: спека §3–§5, §10
- Produces: документы без секретов

- [ ] **Step 1: Написать файлы**

`docs/caddy/Caddyfile.example`:

```
website.booking.vallome.ru {
    root * /var/www/website.booking.vallome.ru
    encode gzip
    try_files {path} /index.html
    file_server
}
```

`docs/architecture.md`: слои `ui` / `pages` / `api` / `app` / `config`; запрет секретов в `VITE_`; source maps off; смена адаптера = новая фабрика в `src/api/index.ts`.

`docs/screens.md`: таблица маршрутов ↔ node id из спеки §5.

`docs/data-adapter.md`: ключи `gs.*`; `createAuthApi` / `createListingsApi`; при PB удалить ключи и подставить клиент PocketBase за теми же интерфейсами; admin-токен не класть.

`README.md`: стек, команды, «выложить содержимое `dist/` на Caddy», ссылка на Caddyfile.example, ссылка на спеку, явно: секретов в репозитории нет.

- [ ] **Step 2: Прогнать полный набор**

Run: `npm test`  
Expected: все PASS

Run: `npm run build`  
Expected: `dist/index.html` есть, source map файлов нет

- [ ] **Step 3: Ручной чеклист спеки §12 (не автоматизировать)**

1. 1440: кадры §5.  
2. Регистрация → онбординг → кабинет.  
3. Шаг 1 → черновик во «Все», не во «На модерации».  
4. Полный мастер → модерация переживает reload.  
5. Правка с модерации не сбрасывает статус.  
6. Архив → снова модерация.  
7. «Опубликовать» не публикует.  
8. XSS-строка видна как текст.  
9. TravelLine / сайдбар-заглушки; выход с профиля.  
10. 1280 кабинет, 1279 заглушка.

- [ ] **Step 4: Commit**

```bash
git add docs README.md
git commit -m "Описать архитектуру, экраны и выкладку за Caddy."
```

---

## Self-review

**Spec coverage**

| Спека | Задача |
| --- | --- |
| Стек Vite, Caddy, без nginx, sourcemap off | 1, 15 |
| Слои api/ui/pages/app/config, комиссия только в config | 2, 4, 5, 9 |
| Типы Session/Listing, SHA-256, не в Session | 3, 4 |
| Auth + reset token + онбординг | 4, 10 |
| Машина статусов, поиск, published пустой | 5, 12 |
| validateStep, фото 6–9, уникальные цены одна base | 6, 13 |
| Гарды, step, onboarding на заглушки | 7, 9 |
| Примитивы, токены, Noto Sans, #f88a2a | 1, 8 |
| Desktop 1280 / холст 1440 | 9, 11 |
| Auth UI + span дисклеймер | 10 |
| Сайдбар, stubs, logout 1:22639 | 11 |
| Список, TravelLine, Опубликовать заглушка | 12 |
| Мастер 6 шагов + кадры | 13 |
| Предпросмотр, модерация, XSS text | 14 |
| docs §10, README | 15 |
| Тесты §9 | 2–7, 5, 14 |

**Placeholders:** нет TBD. `requestPasswordReset` в Task 10 явно меняется на `Promise<string>` — это не вилка, а уточнение демо-ссылки из спеки.

**Types:** `AuthApi.requestPasswordReset` в Task 3 копируется из спеки как `Promise<void>`, в Task 10 меняется на `Promise<string>`. При реализации Task 3 сразу пиши `Promise<string>` (демо-токен), чтобы не ломать типы. Тест Task 4 уже использует возврат token в финальной форме Task 10 — **в Task 4 сразу делай `Promise<string>`**, Task 10 не меняет сигнатуру.

Исправление согласованности: в Task 4 Interfaces и тесты уже `const token = await auth.requestPasswordReset`. В Task 3 `AuthApi` писать:

```ts
requestPasswordReset(email: string): Promise<string>;
```

а не `void` из черновика спеки. Спека говорит «токен выдаёт мок» и демо-ссылка на странице — возврат token это та же семантика. Task 10 Step 1 тогда становится «проверить что сигнатура уже `Promise<string>`» и не дублировать смену.

**Пробелов по срезу нет.** Брони, чаты, PB в план не входят.
