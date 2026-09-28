import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ListingTableRow } from "./ListingTableRow";
import type { ListingTableStatus } from "./listingTableStatus";
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

function persist(
  storage: Storage,
  next: ListingTableRow[],
): ListingTableRow[] {
  writeAllListingsToStorage(storage, next);
  return next;
}

/** Список «Мои объявления» с персистентностью в Storage (статусы и upsert переживают reload). */
export function AllListingsProvider({
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
            prev.map((item, i) => (i === index ? { ...item, ...row } : item)),
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

export function useAllListings(): AllListingsStoreValue {
  const value = useContext(AllListingsStoreContext);
  if (!value) {
    throw new Error("useAllListings must be used within AllListingsProvider");
  }
  return value;
}
