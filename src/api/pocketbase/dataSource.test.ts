import { describe, expect, test } from "vitest";
import { resolveCabinetDataSource } from "./dataSource";

describe("resolveCabinetDataSource", () => {
  test("пустой и неизвестный источник остаются моком", () => {
    expect(resolveCabinetDataSource(undefined)).toBe("mock");
    expect(resolveCabinetDataSource("")).toBe("mock");
    expect(resolveCabinetDataSource("local")).toBe("mock");
  });

  test("только точное pocketbase включает живой адаптер", () => {
    expect(resolveCabinetDataSource("pocketbase")).toBe("pocketbase");
    expect(resolveCabinetDataSource(" pocketbase ")).toBe("mock");
  });
});
