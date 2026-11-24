import type { Data } from "../../services/api";
import { parseInstant } from "../../utilities/dates";

export const plannedFields: Record<string, string> = {
  actualStart: "plannedStart",
  actualEnd: "plannedEnd",
};

export function hireFieldValue(
  values: Record<string, string | boolean>,
  key: string,
): string | boolean {
  const value = values[key];
  return value == null || value === ""
    ? (values[plannedFields[key]] ?? "")
    : value;
}

export function hireDays(start: string, end: string): number | undefined {
  const nanoseconds = (value: string) => {
    const milliseconds = Date.parse(value);
    if (!Number.isFinite(milliseconds)) return undefined;
    const fraction = /\.(\d{1,9})(?:Z|[+-]\d{2}:\d{2})$/.exec(value)?.[1] ?? "";
    return (
      BigInt(milliseconds) * 1000000n +
      BigInt(fraction.padEnd(9, "0").slice(3) || "0")
    );
  };
  const a = nanoseconds(start),
    b = nanoseconds(end);
  if (a == null || b == null || b <= a) return undefined;
  const day = 86400000000000n;
  return Number((b - a + day - 1n) / day);
}

export function draftHireDays(
  values: Record<string, string | boolean>,
  original?: Data,
): number | undefined {
  try {
    return hireDays(
      parseInstant(
        String(values.plannedStart ?? ""),
        String(original?.plannedStart ?? ""),
      ),
      parseInstant(
        String(values.plannedEnd ?? ""),
        String(original?.plannedEnd ?? ""),
      ),
    );
  } catch (error) {
    if (error instanceof Error) return undefined;
    throw error;
  }
}
