export type CabinetDataSource = "mock" | "pocketbase";

export function resolveCabinetDataSource(envValue?: string): CabinetDataSource {
  const raw = envValue ?? readViteSource();
  return raw === "pocketbase" ? "pocketbase" : "mock";
}

function readViteSource(): string {
  const value: unknown = import.meta.env.VITE_DATA_SOURCE;
  return typeof value === "string" ? value : "";
}
