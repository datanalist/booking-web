import { describe, expect, test } from "vitest";
import { chatPhotoUrl } from "../domain/ChatPhoto";
import type { PbChatRecord, PbMessageRecord, PbNotificationRecord } from "./pbChatTypes";
import {
  buildPbMarkChatReadPayload,
  buildPbSendMessagePayload,
  countUnreadNotifications,
  pbChatToHeading,
  pbChatToThread,
  pbMessageToChatMessage,
} from "./index";

const HOST_ID = "host-1";
const GUEST_ID = "guest-1";
const MESSAGE_ID = "11111111-1111-4111-8111-111111111111";
const BASE = "https://pb.booking.vallome.ru";

function clock(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function chat(patch: Partial<PbChatRecord> & Pick<PbChatRecord, "id" | "kind" | "guest">): PbChatRecord {
  return patch;
}

function message(
  patch: Partial<PbMessageRecord> & Pick<PbMessageRecord, "id" | "author" | "created">,
): PbMessageRecord {
  return { chat: "chat-1", ...patch };
}

describe("pbChatToThread", () => {
  test("поддержка: имя, роль и превью из last_message", () => {
    const at = "2026-10-19T09:05:00.000Z";
    const thread = pbChatToThread(
      chat({
        id: "chat-support",
        kind: "support",
        guest: GUEST_ID,
        staff: "staff-1",
        last_message: "Добрый день",
        last_message_at: at,
        expand: { guest: { id: GUEST_ID, name: "Анна" } },
      }),
    );

    expect(thread.id).toBe("chat-support");
    expect(thread.counterpartRole).toBe("support");
    expect(thread.counterpartName).toBe("Поддержка");
    expect(thread.avatarKey).toBe("support");
    expect(thread.preview).toBe("Добрый день");
    expect(thread.sentAt).toBe(clock(at));
    expect(thread.unread).toEqual({ status: "none" });
  });

  test("имя гостя из name, иначе из имени и фамилии, иначе «Гость»", () => {
    const named = pbChatToThread(
      chat({
        id: "c1",
        kind: "listing",
        guest: GUEST_ID,
        expand: {
          guest: { id: GUEST_ID, name: "Екатерина", first_name: "Иван", last_name: "Петров" },
        },
      }),
    );
    const composed = pbChatToThread(
      chat({
        id: "c2",
        kind: "listing",
        guest: GUEST_ID,
        expand: { guest: { id: GUEST_ID, first_name: "Иван", last_name: "Петров" } },
      }),
    );
    const firstOnly = pbChatToThread(
      chat({
        id: "c3",
        kind: "listing",
        guest: GUEST_ID,
        expand: { guest: { id: GUEST_ID, first_name: "Мария" } },
      }),
    );
    const fallback = pbChatToThread(chat({ id: "c4", kind: "listing", guest: GUEST_ID }));

    expect(named.counterpartName).toBe("Екатерина");
    expect(composed.counterpartName).toBe("Иван Петров");
    expect(firstOnly.counterpartName).toBe("Мария");
    expect(fallback.counterpartName).toBe("Гость");
    expect(named.counterpartRole).toBe("guest");
    expect(named.avatarKey).toBe("ekaterina");
  });

  test("фото в списке — файл аккаунта собеседника, а не общий портрет макета", () => {
    const thread = pbChatToThread(
      chat({
        id: "c-photo",
        kind: "listing",
        guest: GUEST_ID,
        expand: { guest: { id: GUEST_ID, name: "Анна Ковалёва", avatar: "anna.jpg" } },
      }),
      undefined,
      undefined,
      BASE,
    );
    const noPhoto = pbChatToThread(
      chat({
        id: "c-nophoto",
        kind: "listing",
        guest: GUEST_ID,
        expand: { guest: { id: GUEST_ID, name: "Без фото" } },
      }),
      undefined,
      undefined,
      BASE,
    );

    expect(thread.counterpartName).toBe("Анна Ковалёва");
    expect(thread.avatarUrl).toBe(`${BASE}/api/files/users/${GUEST_ID}/anna.jpg`);
    expect(noPhoto.avatarUrl).toBe("");
  });

  test("сотрудник в listing-чате делает собеседника модератором", () => {
    const thread = pbChatToThread(
      chat({
        id: "c-mod",
        kind: "listing",
        guest: GUEST_ID,
        staff: "staff-1",
        expand: { guest: { id: GUEST_ID, name: "Анна" } },
      }),
    );
    const blankStaff = pbChatToThread(
      chat({ id: "c-blank", kind: "listing", guest: GUEST_ID, staff: "  " }),
    );

    const namedStaff = pbChatToThread(
      chat({
        id: "c-staff-name",
        kind: "listing",
        guest: GUEST_ID,
        staff: "staff-1",
        expand: {
          staff: { id: "staff-1", name: "Ольга" },
          guest: { id: GUEST_ID, name: "Анна" },
        },
      }),
    );
    const moderatorFallback = pbChatToThread(
      chat({ id: "c-mod-empty", kind: "listing", guest: GUEST_ID, staff: "staff-1" }),
    );

    expect(thread.counterpartRole).toBe("moderator");
    expect(thread.counterpartName).toBe("Анна");
    expect(namedStaff.counterpartName).toBe("Ольга");
    expect(moderatorFallback.counterpartName).toBe("Модератор");
    expect(blankStaff.counterpartRole).toBe("guest");
  });

  test("превью берёт текст последнего сообщения, время — updated, если нет last_message_at", () => {
    const updated = "2026-10-19T18:40:00.000Z";
    const thread = pbChatToThread(
      chat({ id: "c-prev", kind: "listing", guest: GUEST_ID, updated }),
      [
        message({ id: "m1", author: GUEST_ID, created: "2026-10-19T10:00:00.000Z", text: "раннее" }),
        message({ id: "m2", author: GUEST_ID, created: "2026-10-19T12:00:00.000Z", text: "  позже  " }),
      ],
    );

    expect(thread.preview).toBe("позже");
    expect(thread.sentAt).toBe(clock(updated));
  });

  test("непрочитанные — входящие строго новее host_last_read, свои не считаются, потолок 99", () => {
    const readAt = "2026-10-19T10:00:00.000Z";
    const record = chat({
      id: "c-unread",
      kind: "listing",
      guest: GUEST_ID,
      host_last_read: readAt,
    });
    const thread = pbChatToThread(
      record,
      [
        message({ id: "a", author: GUEST_ID, created: "2026-10-19T09:00:00.000Z", text: "старое" }),
        message({ id: "b", author: GUEST_ID, created: readAt, text: "на границе" }),
        message({ id: "c", author: HOST_ID, created: "2026-10-19T11:00:00.000Z", text: "своё" }),
        message({ id: "d", author: GUEST_ID, created: "2026-10-19T12:00:00.000Z", text: "новое" }),
      ],
      HOST_ID,
    );
    const capped = pbChatToThread(
      chat({ id: "c-cap", kind: "listing", guest: GUEST_ID }),
      Array.from({ length: 120 }, (_, index) =>
        message({
          id: `m-${index}`,
          author: GUEST_ID,
          created: `2026-10-19T12:${String(index % 60).padStart(2, "0")}:00.000Z`,
          text: "ещё",
        }),
      ),
      HOST_ID,
    );
    const none = pbChatToThread(record, [], HOST_ID);

    const spaced = pbChatToThread(
      chat({
        id: "c-space",
        kind: "listing",
        guest: GUEST_ID,
        host_last_read: "2026-10-19T12:00:00.000Z",
      }),
      [
        message({ id: "old", author: GUEST_ID, created: "2026-10-19 09:00:00.000Z", text: "раньше" }),
        message({ id: "new", author: GUEST_ID, created: "2026-10-19 15:00:00.000Z", text: "позже" }),
      ],
      HOST_ID,
    );

    expect(thread.unread).toEqual({ status: "unread", count: 1 });
    expect(spaced.unread).toEqual({ status: "unread", count: 1 });
    expect(capped.unread).toEqual({ status: "unread", count: 99 });
    expect(none.unread).toEqual({ status: "none" });
  });

  test("без id хозяина все сообщения считаются входящими", () => {
    const thread = pbChatToThread(chat({ id: "c-all", kind: "listing", guest: GUEST_ID }), [
      message({ id: "a", author: GUEST_ID, created: "2026-10-19T12:00:00.000Z" }),
      message({ id: "b", author: HOST_ID, created: "2026-10-19T12:01:00.000Z" }),
    ]);

    expect(thread.unread).toEqual({ status: "unread", count: 2 });
  });

  test("пустой id чата не становится ChatId", () => {
    expect(() => pbChatToThread(chat({ id: "  ", kind: "listing", guest: GUEST_ID }))).toThrow(
      "Идентификатор чата не может быть пустым",
    );
  });
});

describe("pbChatToHeading", () => {
  test("поддержка — прямая шапка и аватар сотрудника", () => {
    const heading = pbChatToHeading(
      chat({
        id: "chat-support",
        kind: "support",
        guest: GUEST_ID,
        expand: {
          staff: { id: "staff-1", avatar: "staff.png" },
          guest: { id: GUEST_ID, name: "Анна", avatar: "guest.png" },
          listing: { id: "lst", title: "Студия" },
        },
      }),
      BASE,
    );

    expect(heading).toEqual({
      kind: "direct",
      peerName: "Поддержка",
      peerAvatarUrl: `${BASE}/api/files/users/staff-1/staff.png`,
    });
  });

  test("модератор в шапке показывает фото того же сотрудника, что и имя", () => {
    const heading = pbChatToHeading(
      chat({
        id: "c-mod",
        kind: "listing",
        guest: GUEST_ID,
        staff: "staff-1",
        expand: {
          staff: { id: "staff-1", name: "Ольга", avatar: "staff.png" },
          guest: { id: GUEST_ID, name: "Анна", avatar: "guest.png" },
        },
      }),
      BASE,
    );

    expect(heading.peerName).toBe("Ольга");
    expect(heading.peerAvatarUrl).toBe(`${BASE}/api/files/users/staff-1/staff.png`);
  });

  test("listing-шапка собирает даты, гостей и первое фото", () => {
    const heading = pbChatToHeading(
      chat({
        id: "c-list",
        kind: "listing",
        guest: GUEST_ID,
        expand: {
          guest: { id: GUEST_ID, name: "Екатерина", avatar: "ava.jpg" },
          listing: {
            id: "lst1",
            title: "Уютная студия",
            city: "Москва",
            photos: ["  ", "cover.jpg", "second.jpg"],
          },
          booking: {
            id: "bkg1",
            check_in: "2024-09-12 00:00:00.000Z",
            check_out: "2024-09-15",
            adults: 3,
            children: 1,
          },
        },
      }),
      `${BASE}/`,
    );

    expect(heading).toEqual({
      kind: "listing",
      peerName: "Екатерина",
      peerAvatarUrl: `${BASE}/api/files/users/${GUEST_ID}/ava.jpg`,
      listingTitle: "Уютная студия",
      city: "Москва",
      datesLabel: "12.09.24 - 15.09.24",
      guestsLabel: "4 гостя",
      listingThumbUrl: `${BASE}/api/files/listings/lst1/cover.jpg`,
    });
  });

  test("склонение числа гостей и относительный адрес фото без baseUrl", () => {
    const guests = (adults: number, children = 0) =>
      pbChatToHeading(
        chat({
          id: `g-${adults}-${children}`,
          kind: "listing",
          guest: GUEST_ID,
          expand: {
            listing: { id: "lst", photos: ["a.png"] },
            booking: { id: "b", adults, children },
          },
        }),
      );

    expect(guests(1)).toMatchObject({ guestsLabel: "1 гость", listingThumbUrl: "/api/files/listings/lst/a.png" });
    expect(guests(2)).toMatchObject({ guestsLabel: "2 гостя" });
    expect(guests(5)).toMatchObject({ guestsLabel: "5 гостей" });
    expect(guests(11)).toMatchObject({ guestsLabel: "11 гостей" });
    expect(guests(21)).toMatchObject({ guestsLabel: "21 гость" });
    expect(guests(0)).toMatchObject({ guestsLabel: "0 гостей", datesLabel: "", listingTitle: "", city: "" });
  });
});

describe("pbMessageToChatMessage", () => {
  test("текст своего и чужого, время из created", () => {
    const created = "2026-10-19T07:08:00.000Z";
    const own = pbMessageToChatMessage(
      message({ id: MESSAGE_ID, author: HOST_ID, created, text: "Привет" }),
      HOST_ID,
    );
    const peer = pbMessageToChatMessage(
      message({ id: MESSAGE_ID, author: GUEST_ID, created, text: "Привет" }),
      HOST_ID,
    );

    expect(own).toEqual([
      {
        kind: "text",
        id: MESSAGE_ID,
        author: "self",
        timeLabel: clock(created),
        body: "Привет",
        receipt: "read",
      },
    ]);
    expect(peer[0]?.author).toBe("peer");
    expect(peer[0]?.receipt).toBe("unread");
  });

  test("чужое новее host_last_read непрочитано, на границе и своё — прочитано", () => {
    const readAt = "2026-10-19T11:00:00.000Z";
    const unread = pbMessageToChatMessage(
      message({ id: MESSAGE_ID, author: GUEST_ID, created: "2026-10-19T12:00:00.000Z", text: "Новое" }),
      HOST_ID,
      undefined,
      readAt,
    );
    const boundary = pbMessageToChatMessage(
      message({ id: MESSAGE_ID, author: GUEST_ID, created: readAt, text: "На границе" }),
      HOST_ID,
      undefined,
      readAt,
    );
    const own = pbMessageToChatMessage(
      message({ id: MESSAGE_ID, author: HOST_ID, created: "2026-10-19T12:00:00.000Z", text: "Своё" }),
      HOST_ID,
      undefined,
      "",
    );

    expect(unread[0]?.receipt).toBe("unread");
    expect(boundary[0]?.receipt).toBe("read");
    expect(own[0]?.receipt).toBe("read");
  });

  test("текст и фото дают несколько сообщений с адресами файлов", () => {
    const created = "2026-10-19T07:08:00.000Z";
    const mapped = pbMessageToChatMessage(
      message({
        id: "rec15charvalue1",
        author: GUEST_ID,
        created,
        text: "Смотрите",
        images: ["room.png", "двор 1.jpg"],
        files: ["bill.pdf"],
      }),
      HOST_ID,
      BASE,
    );

    expect(mapped).toHaveLength(3);
    expect(mapped[0]).toMatchObject({ kind: "text", author: "peer", body: "Смотрите" });
    expect(mapped[1]).toEqual({
      kind: "photo",
      id: mapped[1]?.id,
      author: "peer",
      timeLabel: clock(created),
      receipt: "unread",
      photo: {
        url: chatPhotoUrl(`${BASE}/api/files/messages/rec15charvalue1/room.png`),
        alt: "room.png",
      },
    });
    expect(mapped[2]).toMatchObject({
      kind: "photo",
      photo: {
        url: chatPhotoUrl(
          `${BASE}/api/files/messages/rec15charvalue1/${encodeURIComponent("двор 1.jpg")}`,
        ),
        alt: "двор 1.jpg",
      },
    });
    expect(mapped[0]?.id).not.toBe(mapped[1]?.id);
    expect(mapped[1]?.id).not.toBe(mapped[2]?.id);
    expect(mapped.map((item) => item.id).join(" ")).not.toContain("bill.pdf");
  });

  test("одно фото сохраняет uuid записи, пустой текст не создаёт пузырь", () => {
    const created = "2026-10-19T07:08:00.000Z";
    const mapped = pbMessageToChatMessage(
      message({
        id: MESSAGE_ID,
        author: GUEST_ID,
        created,
        text: "   ",
        images: ["only.png"],
      }),
      HOST_ID,
    );

    expect(mapped).toEqual([
      {
        kind: "photo",
        id: MESSAGE_ID,
        author: "peer",
        timeLabel: clock(created),
        receipt: "unread",
        photo: {
          url: chatPhotoUrl(`/api/files/messages/${MESSAGE_ID}/only.png`),
          alt: "only.png",
        },
      },
    ]);
  });

  test("битая дата сообщения даёт 00:00", () => {
    const mapped = pbMessageToChatMessage(
      message({ id: MESSAGE_ID, author: HOST_ID, created: "не-дата", text: "ок" }),
      HOST_ID,
    );
    expect(mapped[0]?.timeLabel).toBe("00:00");
  });
});

describe("payloads and notifications", () => {
  test("отправка текста и фото", () => {
    const photo = chatPhotoUrl("blob:photo");
    expect(photo).not.toBeNull();
    if (photo === null) {
      return;
    }

    expect(
      buildPbSendMessagePayload({
        chatId: "chat-1",
        authorId: HOST_ID,
        send: { kind: "text", body: "Здравствуйте" },
      }),
    ).toEqual({ chat: "chat-1", author: HOST_ID, text: "Здравствуйте" });
    expect(
      buildPbSendMessagePayload({
        chatId: "chat-1",
        authorId: HOST_ID,
        send: { kind: "photo", photo: { url: photo, alt: "Чек" } },
      }),
    ).toEqual({ chat: "chat-1", author: HOST_ID, images: [photo] });
  });

  test("отметка прочтения пишет host_last_read", () => {
    expect(buildPbMarkChatReadPayload("2026-10-19T12:00:00.000Z")).toEqual({
      host_last_read: "2026-10-19T12:00:00.000Z",
    });
    const before = Date.now();
    const payload = buildPbMarkChatReadPayload();
    const parsed = Date.parse(payload.host_last_read);
    expect(parsed).toBeGreaterThanOrEqual(before - 1000);
    expect(parsed).toBeLessThanOrEqual(Date.now() + 1000);
  });

  test("бейдж считает только непрочитанные уведомления", () => {
    const records: readonly PbNotificationRecord[] = [
      { id: "n1", user: HOST_ID, title: "A", read: false, created: "2026-10-19T10:00:00.000Z" },
      { id: "n2", user: HOST_ID, title: "B", read: true, created: "2026-10-19T11:00:00.000Z", body: "текст" },
      { id: "n3", user: HOST_ID, title: "C", read: false, created: "2026-10-19T12:00:00.000Z", chat: "c1" },
    ];

    expect(countUnreadNotifications(records)).toBe(2);
    expect(countUnreadNotifications([])).toBe(0);
  });
});
