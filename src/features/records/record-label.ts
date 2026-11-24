import type { Data, Value } from "../../services/api";
import { displayInstant } from "../../utilities/dates";
import { displayMoney } from "../../utilities/money";

export type RecordLabelSource = { id: string; kind: string; data: Data };
export type RecordReferences = ReadonlyMap<string, RecordLabelSource>;

export function registration(
  row: RecordLabelSource,
  references: RecordReferences,
): string {
  const hire =
    row.kind === "payments" ? references.get(String(row.data.hireId)) : row;
  const vehicle = references.get(String(hire?.data.vehicleId));
  return vehicle?.kind === "vehicles"
    ? String(vehicle.data.registration ?? "Vehicle unavailable")
    : "Vehicle unavailable";
}

export function label(
  row: RecordLabelSource,
  references: RecordReferences = new Map(),
): string {
  return String(
    row.data.registration ??
      row.data.name ??
      (row.kind === "hires"
        ? `${registration(row, references)} | ${displayInstant(row.data.plannedStart)} - ${displayInstant(row.data.plannedEnd)} | ${displayMoney(Number(row.data.chargeMinor ?? 0))}`
        : row.data.date
          ? `${row.data.date} | ${row.id.slice(0, 8)}`
          : row.id.slice(0, 8)),
  );
}

export function referenceLabel(
  value: Value | undefined,
  references: RecordReferences,
): string {
  if (!value) return "-";
  const row = references.get(String(value));
  return row ? label(row, references) : String(value).slice(0, 8);
}
