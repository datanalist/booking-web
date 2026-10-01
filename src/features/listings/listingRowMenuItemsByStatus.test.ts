import { expect, test } from "vitest";
import { listingRowMenuItemsByStatus } from "./listingRowMenuItemsByStatus";
import type { ListingTableStatus } from "./listingTableStatus";

test("published menu has calendar, edit, unpublish and red delete", () => {
  const items = listingRowMenuItemsByStatus("published");
  expect(items.map((item) => item.id)).toEqual([
    "calendar",
    "edit",
    "unpublish",
    "delete",
  ]);
  expect(items.map((item) => item.label)).toEqual([
    "Календарь бронирования",
    "Редактировать",
    "Снять с публикации",
    "Удалить",
  ]);
  expect(items.at(-1)?.tone).toBe("danger");
  expect(items.slice(0, -1).every((item) => item.tone === "default")).toBe(
    true,
  );
});

test("moderation menu has only red delete", () => {
  const items = listingRowMenuItemsByStatus("moderation");
  expect(items.map((item) => item.id)).toEqual(["delete"]);
  expect(items.map((item) => item.label)).toEqual(["Удалить"]);
  expect(items[0]?.tone).toBe("danger");
});

test("unpublished menu has edit, publish and red delete", () => {
  const items = listingRowMenuItemsByStatus("unpublished");
  expect(items.map((item) => item.id)).toEqual(["edit", "publish", "delete"]);
  expect(items.map((item) => item.label)).toEqual([
    "Редактировать",
    "Опубликовать",
    "Удалить",
  ]);
  expect(items.at(-1)?.tone).toBe("danger");
  expect(items.slice(0, -1).every((item) => item.tone === "default")).toBe(
    true,
  );
});

test("each status excludes foreign menu actions", () => {
  const cases: Record<
    ListingTableStatus,
    { present: string[]; absent: string[] }
  > = {
    published: {
      present: [
        "Календарь бронирования",
        "Редактировать",
        "Снять с публикации",
        "Удалить",
      ],
      absent: ["Опубликовать"],
    },
    moderation: {
      present: ["Удалить"],
      absent: [
        "Календарь бронирования",
        "Редактировать",
        "Снять с публикации",
        "Опубликовать",
      ],
    },
    unpublished: {
      present: ["Редактировать", "Опубликовать", "Удалить"],
      absent: ["Календарь бронирования", "Снять с публикации"],
    },
    draft: {
      present: ["Редактировать", "Удалить"],
      absent: ["Календарь бронирования", "Снять с публикации", "Опубликовать"],
    },
  };

  for (const status of Object.keys(cases) as ListingTableStatus[]) {
    const labels = listingRowMenuItemsByStatus(status).map(
      (item) => item.label,
    );
    expect(labels).toEqual(cases[status].present);
    for (const foreign of cases[status].absent) {
      expect(labels).not.toContain(foreign);
    }
  }
});
