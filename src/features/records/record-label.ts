import type { Data } from "../../services/api";

export function label(row: { id: string; kind: string; data: Data }): string {
  return String(
    row.data.registration ??
      row.data.name ??
      (row.kind === "hires"
        ? `${row.data.plannedStart} | ${row.id.slice(0, 8)}`
        : row.data.date
          ? `${row.data.date} | ${row.id.slice(0, 8)}`
          : row.id.slice(0, 8)),
  );
}
