import { AMENITY_LABELS, EXTRA_AMENITY_LABELS } from "../../config";
import type { AmenityId, ExtraAmenityId } from "../types";
import type { PbAmenityLabel, PbExtraLabel } from "./pbTypes";

const AMENITY_ID_BY_LABEL = new Map<string, AmenityId>(
  (Object.entries(AMENITY_LABELS) as [AmenityId, PbAmenityLabel][]).map(
    ([id, label]) => [label, id],
  ),
);

const EXTRA_ID_BY_LABEL = new Map<string, ExtraAmenityId>(
  (Object.entries(EXTRA_AMENITY_LABELS) as [ExtraAmenityId, PbExtraLabel][]).map(
    ([id, label]) => [label, id],
  ),
);

function idsToLabels<TId extends string, TLabel extends string>(
  ids: readonly TId[],
  labels: Record<TId, TLabel>,
): TLabel[] {
  const result: TLabel[] = [];
  const seen = new Set<TId>();
  for (const id of ids) {
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);
    result.push(labels[id]);
  }
  return result;
}

function labelsToIds<TId extends string>(
  labels: readonly string[],
  idsByLabel: ReadonlyMap<string, TId>,
): TId[] {
  const result: TId[] = [];
  const seen = new Set<TId>();
  for (const label of labels) {
    const id = idsByLabel.get(label);
    if (id === undefined || seen.has(id)) {
      continue;
    }
    seen.add(id);
    result.push(id);
  }
  return result;
}

export function amenityIdsToPb(ids: readonly AmenityId[]): PbAmenityLabel[] {
  return idsToLabels(ids, AMENITY_LABELS);
}

export function amenityIdsFromPb(labels: readonly string[]): AmenityId[] {
  return labelsToIds(labels, AMENITY_ID_BY_LABEL);
}

export function extraAmenityIdsToPb(ids: readonly ExtraAmenityId[]): PbExtraLabel[] {
  return idsToLabels(ids, EXTRA_AMENITY_LABELS);
}

export function extraAmenityIdsFromPb(labels: readonly string[]): ExtraAmenityId[] {
  return labelsToIds(labels, EXTRA_ID_BY_LABEL);
}
