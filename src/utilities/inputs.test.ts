import { describe, expect, it } from "vitest";
import { moneyInput } from "./money";
import { parseInstant, instantInput } from "./dates";
import { pageSchema } from "../services/api";
import { backupReminderDue } from "../features/reminders/reminder-dates";
describe("financial and timezone input", () => {
  it("evaluates backup age by Nairobi calendar days and prompts before a first export", () => {
    expect(backupReminderDue(undefined, "2026-01-09", 7)).toBe(true);
    expect(backupReminderDue("2026-01-01T22:30:00Z", "2026-01-08", 7)).toBe(
      false,
    );
    expect(backupReminderDue("2026-01-01T22:30:00Z", "2026-01-09", 7)).toBe(
      true,
    );
  });
  it("converts money without floating point multiplication", () => {
    expect(moneyInput("40000")).toBe(4000000);
    expect(moneyInput("0.29")).toBe(29);
    expect(moneyInput("15.5")).toBe(1550);
  });
  it.each(["-1", "1.001", "1e5", "Infinity", "", "NaN"])(
    "rejects invalid amount %s",
    (value) => {
      expect(() => moneyInput(value)).toThrow();
    },
  );
  it("round trips Nairobi pickup across UTC midnight", () => {
    expect(parseInstant("2026-01-02T01:00")).toBe("2026-01-01T22:00:00.000Z");
    expect(instantInput("2026-01-01T22:00:00Z")).toBe("2026-01-02T01:00");
  });
  it("rejects a malformed server contract rather than displaying zero records", () => {
    expect(() =>
      pageSchema.parse({ items: [], total: "50", page: 0, size: 25 }),
    ).toThrow();
  });
});
