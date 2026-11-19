import type { Data } from "../../services/api";
import { schemas } from "./schemas";

export function defaults(kind: string): Data {
  const d: Data = {};
  schemas[kind].fields.forEach((field) => {
    if (field.type === "boolean") d[field.key] = false;
    else if (field.options) d[field.key] = field.options[0];
  });
  if (kind === "settings")
    Object.assign(d, {
      bufferMinutes: 0,
      reminderLeadDays: 3,
      reminderTime: "08:00",
      backupReminderDays: 7,
    });
  return d;
}
