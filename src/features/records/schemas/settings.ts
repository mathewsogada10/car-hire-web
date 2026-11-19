import { f, options } from "./fields";

export const settingsSchemas = {
  settings: {
    title: "Settings",
    fields: [
      options("currency", "Currency", ["KES"]),
      options("timeZone", "Business timezone", ["Africa/Nairobi"]),
      f("bufferMinutes", "Turnaround buffer (minutes)", "number"),
      f("remindersEnabled", "Enable reminders", "boolean"),
      f("reminderLeadDays", "Advance notice (days)", "number", true),
      f("reminderTime", "Daily reminder time (Nairobi)", "time", true),
      f(
        "backupReminderDays",
        "Backup reminder interval (days)",
        "number",
        true,
      ),
    ],
  },
};
