import { expect, test } from "vitest";
import { chatAssets } from "../assets/chatAssets";
import { visiblePeerAvatarUrl } from "./visiblePeerAvatarUrl";

test("пустой файл поддержки — значок поддержки, пустой файл гостя — общая заглушка", () => {
  expect(
    visiblePeerAvatarUrl({ kind: "direct", peerName: "Поддержка", peerAvatarUrl: "" }),
  ).toBe(chatAssets.avatarSupport);
  expect(
    visiblePeerAvatarUrl({
      kind: "direct",
      peerName: "Поддержка",
      peerAvatarUrl: " https://pb.example/staff.jpg ",
    }),
  ).toBe("https://pb.example/staff.jpg");
  expect(
    visiblePeerAvatarUrl({
      kind: "listing",
      peerName: "Анна",
      peerAvatarUrl: "  ",
      listingTitle: "",
      city: "",
      datesLabel: "",
      guestsLabel: "",
      listingThumbUrl: "",
    }),
  ).toBe("/avatar-placeholder.png");
});
