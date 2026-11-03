/** Единая причина изменения: проверки текста плашек обложки и склонения гостей. */
import { describe, expect, test } from "vitest";
import { coverBadgeLines, guestLine, guestWord, guestWordAfterDlya } from "./coverBadgeLines.ts";

describe("cover guest declension", () => {
  test("именительный ряд гость / гостя / гостей", () => {
    expect(guestWord(1)).toBe("гость");
    expect(guestWord(2)).toBe("гостя");
    expect(guestWord(5)).toBe("гостей");
    expect(guestWord(11)).toBe("гостей");
    expect(guestWord(21)).toBe("гость");
    expect(guestWord(22)).toBe("гостя");
  });

  test("после «для» на плашке: 1 гостя, 2 гостей, 5 гостей", () => {
    expect(guestWordAfterDlya(1)).toBe("гостя");
    expect(guestWordAfterDlya(2)).toBe("гостей");
    expect(guestWordAfterDlya(5)).toBe("гостей");
    expect(guestLine(1)).toBe("ДЛЯ 1 ГОСТЯ");
    expect(guestLine(2)).toBe("ДЛЯ 2 ГОСТЕЙ");
    expect(guestLine(5)).toBe("ДЛЯ 5 ГОСТЕЙ");
    expect(guestLine(21)).toBe("ДЛЯ 21 ГОСТЯ");
    expect(guestLine(11)).toBe("ДЛЯ 11 ГОСТЕЙ");
    expect(guestLine(0)).toBe("");
  });
});

describe("coverBadgeLines", () => {
  test("берёт поля карточки и пропускает пустые", () => {
    expect(coverBadgeLines({
      title: "Студия рядом с центром",
      address: "Москва, ул. Тверская, 48",
      priceNight: 3000,
      maxGuests: 1,
      hasKitchen: true,
    })).toEqual([
      { text: "СТУДИЯ РЯДОМ С ЦЕНТРОМ", role: "title" },
      { text: "МОСКВА, УЛ. ТВЕРСКАЯ, 48", role: "detail" },
      { text: "ДО 3000₽/СУТКИ", role: "detail" },
      { text: "ДЛЯ 1 ГОСТЯ", role: "detail" },
      { text: "ЕСТЬ КУХНЯ", role: "detail" },
    ]);
  });

  test("пустые цена, гости, адрес и кухня не попадают на обложку", () => {
    const lines = coverBadgeLines({
      title: "  Студия  ",
      address: "   ",
      priceNight: 0,
      maxGuests: 0,
      hasKitchen: false,
    });
    expect(lines).toEqual([{ text: "СТУДИЯ", role: "title" }]);
    const text = lines.map((line) => line.text).join("\n");
    expect(text).not.toContain("₽");
    expect(text).not.toContain("ГОСТ");
    expect(text).not.toContain("КУХН");
  });
});
