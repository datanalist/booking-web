import { DESCRIPTION_MAX } from "../config";

/** Текст доп. сведений с доказанным лимитом длины. */
export type LimitedDetailsText = string & {
  readonly __brand: "LimitedDetailsText";
};

export type AnnouncementDetails = {
  accessInfo: LimitedDetailsText;
  houseRules: LimitedDetailsText;
  extraInfo: LimitedDetailsText;
};

export type ParseAnnouncementDetailsResult =
  | { ok: true; value: AnnouncementDetails }
  | { ok: false; errors: Record<string, string> };

function parseLimitedDetailsText(
  raw: string,
  field: string,
): { ok: true; value: LimitedDetailsText } | { ok: false; field: string; message: string } {
  if (raw.length > DESCRIPTION_MAX) {
    return {
      ok: false,
      field,
      message: `Не более ${DESCRIPTION_MAX} символов`,
    };
  }
  return { ok: true, value: raw as LimitedDetailsText };
}

/** Parse, don't validate: либо типизированные поля, либо карта ошибок. */
export function parseAnnouncementDetails(input: {
  accessInfo: string;
  houseRules: string;
  extraInfo: string;
}): ParseAnnouncementDetailsResult {
  const access = parseLimitedDetailsText(input.accessInfo, "accessInfo");
  const rules = parseLimitedDetailsText(input.houseRules, "houseRules");
  const extra = parseLimitedDetailsText(input.extraInfo, "extraInfo");

  const errors: Record<string, string> = {};
  if (!access.ok) {
    errors[access.field] = access.message;
  }
  if (!rules.ok) {
    errors[rules.field] = rules.message;
  }
  if (!extra.ok) {
    errors[extra.field] = extra.message;
  }

  if (!access.ok || !rules.ok || !extra.ok) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      accessInfo: access.value,
      houseRules: rules.value,
      extraInfo: extra.value,
    },
  };
}
