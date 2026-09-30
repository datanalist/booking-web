import { expect, test } from "vitest";
import { listingsLocationStateFromOrigin } from "./listingsLocationStateFromOrigin";
import { parseListingOriginState } from "./parseListingOriginState";

test("валидная вкладка источника сохраняется", () => {
  expect(parseListingOriginState({ fromTab: "published" })).toEqual({
    fromTab: "published",
  });
});

test.each([null, undefined, "x", 1, {}, { fromTab: "nope" }, { fromTab: 3 }])(
  "некорректный state %j даёт пустое состояние",
  (state) => {
    expect(parseListingOriginState(state)).toEqual({});
  },
);

test("state списка строится из вкладки источника", () => {
  expect(listingsLocationStateFromOrigin({ fromTab: "archived" })).toEqual({
    tab: "archived",
  });
  expect(listingsLocationStateFromOrigin(null)).toBeUndefined();
});
