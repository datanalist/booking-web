import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { expect, test } from "vitest";

const source = fs.readFileSync(
  path.join(process.cwd(), "deploy/pocketbase/pb_hooks/listingPublishReady.js"),
  "utf8",
);
const sandbox: { module: { exports: Record<string, unknown> }; exports: Record<string, unknown> } = {
  module: { exports: {} },
  exports: {},
};
sandbox.exports = sandbox.module.exports;
vm.runInNewContext(source, sandbox);
const listingPublishReady = sandbox.module.exports.listingPublishReady as (input: {
  status: string;
  title: string;
  city: string;
  address: string;
  description: string;
  checkInTime: string;
  checkOutTime: string;
  housingType: string;
  maxGuests: number;
  guestsForbidden: boolean;
  priceNight: number;
  photoCount: number;
}) => boolean;

const readyDraft = {
  status: "pending",
  title: "Студия у парка",
  city: "Казань",
  address: "Казань, ул. Баумана 1",
  description: "Тихое жилье для двоих.",
  checkInTime: "13:00",
  checkOutTime: "15:00",
  housingType: "Квартира",
  maxGuests: 1,
  guestsForbidden: true,
  priceNight: 8900,
  photoCount: 9,
};

test("forbidden guests with at least one place are ready for moderation", () => {
  expect(listingPublishReady(readyDraft)).toBe(true);
});

test("forbidden guests with zero places are not ready for moderation", () => {
  expect(listingPublishReady({ ...readyDraft, maxGuests: 0 })).toBe(false);
});

test("pending listing without guests still needs at least one place", () => {
  expect(
    listingPublishReady({
      ...readyDraft,
      guestsForbidden: false,
      maxGuests: 0,
    }),
  ).toBe(false);
});

test("saving a draft does not require moderation fields", () => {
  expect(
    listingPublishReady({
      ...readyDraft,
      status: "draft",
      title: "",
      photoCount: 0,
    }),
  ).toBe(true);
});
