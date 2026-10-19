import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "../../app/session";
import { createPbListingsApi } from "../../api/pocketbase/createPbListingsApi";
import { resolveCabinetDataSource } from "../../api/pocketbase/dataSource";
import { createCabinetPbClient } from "../../api/pocketbase/pbSession";
import type { Listing, ListingDraft, ListingsApi } from "../../api/types";
import { errorCodeOf } from "../../lib/errorCodeOf";
import { emptyDraft } from "../../lib/emptyDraft";
import type { ListingTableRow } from "./ListingTableRow";
import { listingTableRowFromListing } from "./listingTableRowFromListing";
import type { ListingTableStatus } from "./listingTableStatus";
import { loadAllListingsFromPocketBase } from "./loadAllListingsFromPocketBase";
import { loadAllListingsInitial } from "./loadAllListingsInitial";
import { writeAllListingsToStorage } from "./writeAllListingsToStorage";

type AllListingsStoreValue = {
  items: ListingTableRow[];
  remove: (id: string) => void;
  setStatus: (id: string, status: ListingTableStatus) => void;
  /** Добавляет строку или обновляет поля существующей (черновик → архив/модерация). */
  upsert: (row: ListingTableRow) => void;
};

const AllListingsStoreContext = createContext<AllListingsStoreValue | null>(
  null,
);

type AllListingsProviderProps = {
  children: ReactNode;
  /** Подмена Storage в тестах; по умолчанию localStorage. */
  storage?: Storage;
};

const PB_RECORD_ID = /^[a-z0-9]{15}$/;

function persist(
  storage: Storage,
  next: ListingTableRow[],
): ListingTableRow[] {
  writeAllListingsToStorage(storage, next);
  return next;
}

/** Обновлённая строка целиком заменяет поля; без `coverUrl` старая обложка не остаётся. */
function mergeRow(current: ListingTableRow, next: ListingTableRow): ListingTableRow {
  const { coverUrl: _staleCover, ...rest } = current;
  return { ...rest, ...next };
}

function upsertLocal(prev: ListingTableRow[], row: ListingTableRow): ListingTableRow[] {
  const index = prev.findIndex((item) => item.id === row.id);
  if (index < 0) {
    return [row, ...prev];
  }
  return prev.map((item, i) => (i === index ? mergeRow(item, row) : item));
}

function replaceSavedRow(
  prev: ListingTableRow[],
  previousIds: readonly string[],
  saved: ListingTableRow,
): ListingTableRow[] {
  const stale = new Set(previousIds);
  let replaced = false;
  const next: ListingTableRow[] = [];
  for (const item of prev) {
    if (item.id === saved.id || stale.has(item.id)) {
      if (!replaced) {
        next.push(saved);
        replaced = true;
      }
      continue;
    }
    next.push(item);
  }
  return replaced ? next : prev;
}

function applyRowAfterSuccess(
  revision: { current: number },
  request: Promise<unknown>,
  setItems: (updater: (prev: ListingTableRow[]) => ListingTableRow[]) => void,
  apply: (prev: ListingTableRow[]) => ListingTableRow[],
): void {
  revision.current += 1;
  const captured = revision.current;
  void request.then(
    () => {
      setItems((prev) => (revision.current === captured ? apply(prev) : prev));
    },
    () => undefined,
  );
}

function enqueueSave(
  tails: Map<string, Promise<void>>,
  key: string,
  job: () => Promise<void>,
): void {
  const previous = tails.get(key) ?? Promise.resolve();
  const next = previous.then(job, job);
  tails.set(key, next.then(() => undefined, () => undefined));
}

function MockAllListingsProvider({
  children,
  storage = localStorage,
}: AllListingsProviderProps) {
  const [items, setItems] = useState<ListingTableRow[]>(() =>
    loadAllListingsInitial(storage),
  );

  const value = useMemo(
    (): AllListingsStoreValue => ({
      items,
      remove: (id) => {
        setItems((prev) => persist(storage, prev.filter((item) => item.id !== id)));
      },
      setStatus: (id, status) => {
        setItems((prev) =>
          persist(
            storage,
            prev.map((item) => (item.id === id ? { ...item, status } : item)),
          ),
        );
      },
      upsert: (row) => {
        setItems((prev) => {
          const index = prev.findIndex((item) => item.id === row.id);
          if (index < 0) {
            return persist(storage, [row, ...prev]);
          }
          return persist(
            storage,
            prev.map((item, i) => (i === index ? mergeRow(item, row) : item)),
          );
        });
      },
    }),
    [items, storage],
  );

  return (
    <AllListingsStoreContext.Provider value={value}>
      {children}
    </AllListingsStoreContext.Provider>
  );
}

function PocketBaseAllListingsProvider({
  children,
  storage = localStorage,
}: AllListingsProviderProps) {
  const { session } = useSession();
  const userId = session?.userId ?? null;
  const client = useMemo(() => createCabinetPbClient(storage), [storage]);
  const listings = useMemo(
    () => createPbListingsApi({ client, storage }),
    [client, storage],
  );
  const [items, setItems] = useState<ListingTableRow[]>([]);
  const revision = useRef(0);
  const idMap = useRef(new Map<string, string>());
  const saveTails = useRef(new Map<string, Promise<void>>());

  useEffect(() => {
    if (userId === null || userId.length === 0) {
      setItems([]);
      return;
    }
    const captured = revision.current;
    let cancelled = false;
    void loadAllListingsFromPocketBase(client, userId)
      .then((rows) => {
        if (!cancelled && revision.current === captured) {
          setItems(rows);
        }
      })
      .catch(() => {
        if (!cancelled && revision.current === captured) {
          setItems([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [client, userId]);

  const value = useMemo(
    (): AllListingsStoreValue => ({
      items,
      remove: (id) => {
        applyRowAfterSuccess(revision, listings.remove(id), setItems, (prev) =>
          prev.filter((item) => item.id !== id),
        );
      },
      setStatus: (id, status) => {
        const shown: ListingTableStatus =
          status === "published" || status === "moderation" ? "moderation" : status;
        const request = status === "unpublished"
          ? listings.archive(id)
          : status === "published" || status === "moderation"
            ? listings.submitForModeration(id)
            : null;
        if (request === null) {
          revision.current += 1;
          setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status: shown } : item)));
          return;
        }
        applyRowAfterSuccess(revision, request, setItems, (prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: shown } : item)),
        );
      },
      upsert: (row) => {
        revision.current += 1;
        const mapped = idMap.current.get(row.id);
        const localId = mapped ?? row.id;
        const localRow = localId === row.id ? row : { ...row, id: localId };
        setItems((prev) => {
          const withoutStale = localId === row.id
            ? prev
            : prev.filter((item) => item.id !== row.id);
          return upsertLocal(withoutStale, localRow);
        });
        if (row.status !== "draft" || userId === null) {
          return;
        }
        enqueueSave(saveTails.current, row.id, async () => {
          const saved = await persistDraftUpsert(listings, userId, row, idMap.current);
          if (saved === null) {
            return;
          }
          if (saved.id !== row.id) {
            idMap.current.set(row.id, saved.id);
          }
          const next = listingTableRowFromListing(saved);
          const known = idMap.current.get(row.id) ?? localId;
          setItems((prev) => replaceSavedRow(prev, [row.id, known], next));
        });
      },
    }),
    [items, listings, userId],
  );

  return (
    <AllListingsStoreContext.Provider value={value}>
      {children}
    </AllListingsStoreContext.Provider>
  );
}

/** Список «Мои объявления»: мок в Storage либо объявления хозяина из PocketBase. */
export function AllListingsProvider(props: AllListingsProviderProps) {
  if (resolveCabinetDataSource() === "pocketbase") {
    return <PocketBaseAllListingsProvider {...props} />;
  }
  return <MockAllListingsProvider {...props} />;
}

export function useAllListings(): AllListingsStoreValue {
  const value = useContext(AllListingsStoreContext);
  if (!value) {
    throw new Error("useAllListings must be used within AllListingsProvider");
  }
  return value;
}

async function persistDraftUpsert(
  listings: ListingsApi,
  userId: string,
  row: ListingTableRow,
  idMap: Map<string, string>,
): Promise<Listing | null> {
  const mapped = idMap.get(row.id);
  const candidate = mapped ?? (PB_RECORD_ID.test(row.id) ? row.id : undefined);
  let base: ListingDraft = emptyDraft(userId);
  let idForSave = candidate;
  if (candidate !== undefined) {
    try {
      base = await listings.get(candidate);
    } catch (error) {
      if (errorCodeOf(error) !== "NOT_FOUND") {
        return null;
      }
      idForSave = undefined;
    }
  }
  const draft: ListingDraft = {
    ...base,
    ownerId: userId,
    title: row.title,
    address: row.address,
    housingType: row.housingType,
    status: "draft",
    photos: coverPhotos(base.photos, row.coverUrl),
  };
  if (idForSave === undefined) {
    delete draft.id;
  } else {
    draft.id = idForSave;
  }
  try {
    return await listings.saveDraft(draft);
  } catch {
    return null;
  }
}

function coverPhotos(existing: readonly string[], coverUrl: string | undefined): string[] {
  if (coverUrl === undefined) {
    return [...existing];
  }
  const cover = coverUrl.trim();
  if (cover.length === 0) {
    return existing.slice(1);
  }
  if (existing[0] === cover) {
    return [...existing];
  }
  return [cover, ...existing.filter((photo) => photo !== cover)];
}
