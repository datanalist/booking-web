import { emptyDraft } from "../../lib/emptyDraft";
import { errorCodeOf } from "../../lib/errorCodeOf";
import { SESSION_KEY } from "../keys";
import type { Listing, ListingDraft, ListingEditSeed, ListingsApi } from "../types";
import { isRecord } from "./isRecord";
import { pbListingToSiteListing, siteListingToPbPayload, type PbListingPayload } from "./listingMapper";
import { photosToPb } from "./listingPhotos";
import { PbRequestError, type PbClient } from "./pbClient";
import type { PbListingRecord } from "./pbTypes";

const LISTINGS = "listings";
const PB_RECORD_ID = /^[a-z0-9]{15}$/;

type ListingsError = Error & { code: "NOT_FOUND" };

export function createPbListingsApi(options: {
  client: PbClient;
  storage: Storage;
}): ListingsApi {
  const { client, storage } = options;

  async function get(id: string): Promise<Listing> {
    let record: PbListingRecord;
    try {
      record = await client.getRecord<PbListingRecord>(LISTINGS, id);
    } catch (error) {
      if (error instanceof PbRequestError && error.status === 404) {
        throw notFound();
      }
      throw error;
    }
    const userId = readUserId(storage);
    if (userId === null || record.host !== userId) {
      throw notFound();
    }
    return pbListingToSiteListing(record, client.baseUrl);
  }

  return {
    async list({ tab, query }) {
      const userId = readUserId(storage);
      if (userId === null) {
        return [];
      }
      const result = await client.listRecords<PbListingRecord>(LISTINGS, {
        filter: listFilter(userId, tab),
        sort: "-updated",
        perPage: 200,
      });
      const needle = query.trim().toLowerCase();
      const listings = result.items.map((item) => pbListingToSiteListing(item, client.baseUrl));
      if (needle.length === 0) {
        return listings;
      }
      return listings.filter(
        (listing) =>
          listing.title.toLowerCase().includes(needle)
          || listing.address.toLowerCase().includes(needle),
      );
    },

    get,

    async ensureForEdit(input: ListingEditSeed) {
      try {
        return await get(input.id);
      } catch (error) {
        if (errorCodeOf(error) !== "NOT_FOUND") {
          throw error;
        }
      }
      const userId = readUserId(storage);
      if (userId === null) {
        throw notFound();
      }
      const payload = siteListingToPbPayload({
        ...emptyDraft(userId),
        title: input.title,
        address: input.address,
        housingType: input.housingType,
        status: "draft",
      });
      const body = PB_RECORD_ID.test(input.id) ? { ...payload, id: input.id } : payload;
      const created = await client.createRecord<PbListingRecord>(LISTINGS, body);
      return pbListingToSiteListing(created, client.baseUrl);
    },

    async saveDraft(draft: ListingDraft) {
      if (draft.status === "published") {
        throw new Error("INVALID_STATUS");
      }
      const payload = siteListingToPbPayload(draft);
      const form = new FormData();
      appendPayloadFields(form, payload);
      await appendDraftPhotos(form, draft.photos);
      const saved = draft.id
        ? await client.updateRecord<PbListingRecord>(LISTINGS, draft.id, form)
        : await client.createRecord<PbListingRecord>(LISTINGS, form);
      return pbListingToSiteListing(saved, client.baseUrl);
    },

    async submitForModeration(id) {
      const record = await client.updateRecord<PbListingRecord>(LISTINGS, id, {
        status: "pending",
      });
      return pbListingToSiteListing(record, client.baseUrl);
    },

    async archive(id) {
      const record = await client.updateRecord<PbListingRecord>(LISTINGS, id, {
        status: "archived",
      });
      return pbListingToSiteListing(record, client.baseUrl);
    },

    async remove(id) {
      await client.deleteRecord(LISTINGS, id);
    },
  };
}

function readUserId(storage: Storage): string | null {
  const raw = storage.getItem(SESSION_KEY);
  if (raw === null) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || typeof parsed.userId !== "string") {
      return null;
    }
    const userId = parsed.userId.trim();
    return userId.length > 0 ? userId : null;
  } catch {
    return null;
  }
}

function listFilter(
  userId: string,
  tab: "all" | "published" | "moderation" | "archived",
): string {
  const host = `host="${userId}"`;
  switch (tab) {
    case "all":
      return host;
    case "published":
      return `${host} && status="published"`;
    case "moderation":
      return `${host} && status="pending"`;
    case "archived":
      return `${host} && (status="archived" || status="rejected")`;
  }
}

function notFound(): ListingsError {
  return Object.assign(new Error("NOT_FOUND"), { code: "NOT_FOUND" as const });
}

function appendPayloadFields(form: FormData, payload: PbListingPayload): void {
  for (const [key, value] of Object.entries(payload)) {
    if (key === "photos" || value === undefined) {
      continue;
    }
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      form.append(key, String(value));
      continue;
    }
    form.append(key, JSON.stringify(value));
  }
}

async function appendDraftPhotos(form: FormData, photos: readonly string[]): Promise<void> {
  const seenNames = new Set<string>();
  for (const photo of photos) {
    const trimmed = photo.trim();
    if (trimmed.length === 0) {
      continue;
    }
    if (trimmed.startsWith("/data/")) {
      const filename = filenameFromDataPath(trimmed);
      const response = await fetch(trimmed);
      if (!response.ok) {
        throw new Error("PHOTO_FETCH_FAILED");
      }
      form.append("photos", await response.blob(), filename);
      continue;
    }
    const name = photosToPb([trimmed])?.[0];
    if (name === undefined || seenNames.has(name)) {
      continue;
    }
    seenNames.add(name);
    form.append("photos", name);
  }
}

function filenameFromDataPath(path: string): string {
  const name = path.slice("/data/".length).split("/").filter((part) => part.length > 0).pop() ?? "";
  return name.length > 0 ? name : "photo";
}
