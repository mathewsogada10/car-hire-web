import type { Row } from "../../services/api";

export function dueReminders(
  rows: Row[],
  vehicles: Row[],
  today: string,
  lead: number,
): Row[] {
  const mileage = new Map(
    vehicles.map((v) => [v.id, Number(v.data.odometerKm ?? -1)]),
  );
  const cutoff = new Date(`${today}T00:00:00Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() + lead);
  const through = cutoff.toISOString().slice(0, 10);
  return rows.filter(
    (r) =>
      (r.data.status === "Open" ||
        (r.data.status === "Snoozed" &&
          String(r.data.snoozedUntil) <= today)) &&
      ((Boolean(r.data.dueDate) && String(r.data.dueDate) <= through) ||
        (r.data.dueKm != null &&
          (mileage.get(String(r.data.vehicleId)) ?? -1) >=
            Number(r.data.dueKm))),
  );
}
export function backupReminderDue(
  last: string | undefined,
  today: string,
  days: number,
) {
  if (!last) return true;
  const lastDay = new Date(Date.parse(last) + 3 * 3600000)
    .toISOString()
    .slice(0, 10);
  return (Date.parse(today) - Date.parse(lastDay)) / 86400000 >= days;
}
