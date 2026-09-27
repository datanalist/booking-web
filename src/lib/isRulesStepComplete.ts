import { parseClockTime } from "./clockTime";

export type RulesStepFields = {
  maxGuests: number;
  checkInTime: string;
  checkOutTime: string;
};

export function isRulesStepComplete(fields: RulesStepFields): boolean {
  return (
    Number.isFinite(fields.maxGuests) &&
    fields.maxGuests >= 1 &&
    parseClockTime(fields.checkInTime) !== null &&
    parseClockTime(fields.checkOutTime) !== null
  );
}
