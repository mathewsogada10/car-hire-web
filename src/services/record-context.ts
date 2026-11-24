import { record } from "./api";
import type { Row } from "./api";

type Reference = { kind: string; id: string };

export async function recordContext(
  references: Reference[],
  known: Row[] = [],
): Promise<Row[]> {
  const rows = new Map(known.map((row) => [row.id, row]));
  async function load(requests: Reference[]) {
    const missing = [
      ...new Map(requests.map((r) => [r.id, r])).values(),
    ].filter((r) => !rows.has(r.id));
    for (let offset = 0; offset < missing.length; offset += 6) {
      const batch = await Promise.all(
        missing.slice(offset, offset + 6).map((r) => record(r.kind, r.id)),
      );
      batch.forEach((row) => rows.set(row.id, row));
    }
  }
  await load(references);
  await load(
    [...rows.values()]
      .filter((row) => row.kind === "hires" && row.data.vehicleId)
      .map((row) => ({ kind: "vehicles", id: String(row.data.vehicleId) })),
  );
  return [...rows.values()];
}
