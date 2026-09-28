import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MOCK_ALL_LISTINGS } from "./mockAllListings";
import type { ListingTableRow } from "./ListingTableRow";
import type { ListingTableStatus } from "./listingTableStatus";

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
};

/** In-memory список «Мои объявления» — живёт выше роутов, чтобы edit/back не сбрасывал удаления и статусы. */
export function AllListingsProvider({ children }: AllListingsProviderProps) {
  const [items, setItems] = useState<ListingTableRow[]>(() => [
    ...MOCK_ALL_LISTINGS,
  ]);

  const value = useMemo(
    (): AllListingsStoreValue => ({
      items,
      remove: (id) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
      },
      setStatus: (id, status) => {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status } : item)),
        );
      },
      upsert: (row) => {
        setItems((prev) => {
          const index = prev.findIndex((item) => item.id === row.id);
          if (index < 0) {
            return [row, ...prev];
          }
          return prev.map((item, i) => (i === index ? { ...item, ...row } : item));
        });
      },
    }),
    [items],
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
