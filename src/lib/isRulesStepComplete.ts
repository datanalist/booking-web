import { parseClockTime } from "./clockTime";
import { parseMaxGuests } from "./parseMaxGuests";

export type RulesStepFields = {
  maxGuests: number;
  guestsForbidden: boolean;
  checkInTime: string;
  checkOutTime: string;
};

export function isRulesStepComplete(fields: RulesStepFields): boolean {
  return (
    parseMaxGuests(fields.maxGuests, fields.guestsForbidden) !== null &&
    parseClockTime(fields.checkInTime) !== null &&
    parseClockTime(fields.checkOutTime) !== null
  );
}
