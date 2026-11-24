import { afterEach, expect, it, vi } from "vitest";
import { instantInput, parseInstant } from "./dates";
import {
  hireDays,
  hireFieldValue,
  draftHireDays,
} from "../features/records/hire-timing";
import { label, registration } from "../features/records/record-label";
import type { RecordLabelSource } from "../features/records/record-label";
import { displayMoney } from "./money";

afterEach(() => vi.unstubAllEnvs());

it("uses the user's timezone without losing seconds, milliseconds or an unchanged original instant", () => {
  vi.stubEnv("TZ", "UTC");
  expect(instantInput("2026-12-01T07:15:45.123Z")).toBe(
    "2026-12-01T07:15:45.123",
  );
  expect(parseInstant("2026-12-01T07:15:45.123")).toBe(
    "2026-12-01T07:15:45.123Z",
  );
  vi.stubEnv("TZ", "Africa/Nairobi");
  expect(instantInput("2026-12-01T07:00:00Z")).toBe("2026-12-01T10:00");
  expect(parseInstant("2026-12-01T10:00")).toBe("2026-12-01T07:00:00.000Z");
  const original = "2026-12-01T07:00:00.123456Z";
  expect(parseInstant(instantInput(original), original)).toBe(original);
});

it("rejects invalid and ambiguous new local dates while retaining either existing repeated-time instant", () => {
  vi.stubEnv("TZ", "America/New_York");
  expect(() => parseInstant("2026-03-08T02:30")).toThrow("does not exist");
  expect(() => parseInstant("2026-02-30T12:00")).toThrow("invalid");
  expect(() => parseInstant("2026-11-01T01:30")).toThrow("occurs twice");
  for (const original of ["2026-11-01T05:30:00Z", "2026-11-01T06:30:00Z"])
    expect(parseInstant(instantInput(original), original)).toBe(original);
});

it("rounds only partial elapsed days up, including submillisecond precision, and defaults only blank actual fields", () => {
  expect(hireDays("2026-12-01T07:00:00Z", "2026-12-02T07:00:00Z")).toBe(1);
  expect(
    hireDays("2026-12-01T07:00:00Z", "2026-12-02T07:00:00.000000001Z"),
  ).toBe(2);
  expect(hireDays("invalid", "2026-12-02T07:00:00Z")).toBeUndefined();
  expect(
    hireDays("2026-12-02T07:00:00Z", "2026-12-01T07:00:00Z"),
  ).toBeUndefined();
  expect(draftHireDays({ plannedStart: "invalid" })).toBeUndefined();
  expect(
    hireFieldValue({ actualStart: "", plannedStart: "planned" }, "actualStart"),
  ).toBe("planned");
  expect(
    hireFieldValue(
      { actualStart: "actual", plannedStart: "planned" },
      "actualStart",
    ),
  ).toBe("actual");
});

it("hire choices and payment registration resolve related rows without exposing UUIDs or GMT suffixes", () => {
  vi.stubEnv("TZ", "Africa/Nairobi");
  const vehicle = {
    id: "vehicle",
    kind: "vehicles",
    data: { registration: "KAA 123A" },
  };
  const hire = {
    id: "hire",
    kind: "hires",
    data: {
      vehicleId: "vehicle",
      plannedStart: "2026-12-01T07:00:00Z",
      plannedEnd: "2026-12-02T09:00:00Z",
      chargeMinor: 250000,
    },
  };
  const references = new Map<string, RecordLabelSource>([
    [vehicle.id, vehicle],
    [hire.id, hire],
  ]);
  expect(label(hire, references)).toBe(
    `2026-12-01 10:00 - 2026-12-02 12:00 | KAA 123A | ${displayMoney(250000)}`,
  );
  expect(
    registration(
      { id: "payment", kind: "payments", data: { hireId: "hire" } },
      references,
    ),
  ).toBe("KAA 123A");
});
