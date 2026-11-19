import { list } from "./api";
import type { Row } from "./api";

export async function allRecords(kind: string) {
  const result: Row[] = [];
  let page = 0;
  for (;;) {
    const current = await list(
      kind,
      new URLSearchParams({ page: String(page++), size: "200" }),
    );
    result.push(...current.items);
    if (result.length >= current.total) return result;
  }
}
