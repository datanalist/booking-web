import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { SessionProvider } from "../app/session";
import { SESSION_KEY } from "../api/keys";
import { PB_TOKEN_KEY } from "../api/pocketbase/pbSession";
import type { PbListingRecord } from "../api/pocketbase/pbTypes";
import { AllListingsProvider } from "../features/listings";
import { ListingsPage } from "./ListingsPage";

const LISTING_ID = "listing12345678";
const HOST_ID = "user123456789ab";
const TITLE = "Дом у Патриарших";

const record: PbListingRecord = {
  id: LISTING_ID,
  host: HOST_ID,
  title: TITLE,
  city: "Москва",
  address: "Москва, район Патриарших",
  geo: null,
  housing_type: "Квартира",
  placement_type: "apartment",
  photos: [],
  description: "",
  amenities: [],
  extras: [],
  max_guests: 2,
  pets_allowed: false,
  cancellation_allowed: true,
  guests_forbidden: false,
  access_info: "",
  house_rules: "",
  extra_info: "",
  check_in_time: "14:00",
  check_out_time: "12:00",
  price_night: 1000,
  price_14: 900,
  price_28: 800,
  unique_prices: [],
  status: "published",
  reject_reason: "",
  rating: 0,
  reviews_count: 0,
  created: "2026-10-01 00:00:00.000Z",
  updated: "2026-10-02 00:00:00.000Z",
};

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function renderListings(deleteStatus = 204): { deletes: string[] } {
  vi.stubEnv("VITE_DATA_SOURCE", "pocketbase");
  vi.stubEnv("VITE_POCKETBASE_URL", "https://pb.example");
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      userId: HOST_ID,
      email: "host@example.com",
      name: "Анна",
      phone: "+79990000000",
      onboardingComplete: true,
    }),
  );
  localStorage.setItem(PB_TOKEN_KEY, "token");
  const deletes: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      if (method === "DELETE") {
        deletes.push(url);
        if (deleteStatus !== 204) {
          return new Response(
            JSON.stringify({ message: "PocketBase delete failed" }),
            { status: deleteStatus, headers: { "Content-Type": "application/json" } },
          );
        }
        return new Response(null, { status: 204 });
      }
      if (url.includes("/api/collections/listings/records")) {
        return new Response(
          JSON.stringify({
            page: 1,
            perPage: 200,
            totalItems: 1,
            totalPages: 1,
            items: [record],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response("{}", { status: 200 });
    }),
  );

  render(
    <SessionProvider>
      <MemoryRouter initialEntries={["/listings"]}>
        <AllListingsProvider>
          <Routes>
            <Route path="/listings" element={<ListingsPage />} />
          </Routes>
        </AllListingsProvider>
      </MemoryRouter>
    </SessionProvider>,
  );
  return { deletes };
}

test("Да, удалить вызывает удаление объявления и закрывает диалог", async () => {
  const user = userEvent.setup();
  const { deletes } = renderListings();

  expect(await screen.findByText(TITLE)).toBeInTheDocument();
  await user.click(
    screen.getByRole("button", { name: `Действия для «${TITLE}»` }),
  );
  await user.click(screen.getByRole("menuitem", { name: "Удалить" }));
  await user.click(screen.getByRole("button", { name: "Да, удалить" }));

  expect(await screen.findByRole("heading", { name: "Нет объявлений" })).toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(deletes.some((url) => url.includes(`/records/${LISTING_ID}`))).toBe(
    true,
  );
  expect(screen.queryByText(TITLE)).not.toBeInTheDocument();
});

test("Да, удалить оставляет объявление и показывает ошибку, если сервер отклонил удаление", async () => {
  const user = userEvent.setup();
  const { deletes } = renderListings(400);

  expect(await screen.findByText(TITLE)).toBeInTheDocument();
  await user.click(
    screen.getByRole("button", { name: `Действия для «${TITLE}»` }),
  );
  await user.click(screen.getByRole("menuitem", { name: "Удалить" }));
  await user.click(screen.getByRole("button", { name: "Да, удалить" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("PocketBase delete failed");
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(deletes.some((url) => url.includes(`/records/${LISTING_ID}`))).toBe(
    true,
  );
  expect(screen.getByText(TITLE)).toBeInTheDocument();
});
