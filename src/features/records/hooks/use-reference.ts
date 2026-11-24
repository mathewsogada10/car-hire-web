import { useEffect, useState } from "react";
import { list, message, record } from "../../../services/api";
import type { Row } from "../../../services/api";

export function useReference(kind: string, selectedId: string) {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [cache, setCache] = useState(new Map<string, Row>());
  useEffect(() => {
    if (!selectedId || cache.has(selectedId)) {
      setLookupError("");
      return;
    }
    let active = true;
    async function selected() {
      try {
        const row = await record(kind, selectedId);
        const extra =
          row.kind === "hires" && row.data.vehicleId
            ? [await record("vehicles", String(row.data.vehicleId))]
            : [];
        if (active) {
          setCache(
            (previous) =>
              new Map([
                ...previous,
                ...[row, ...extra].map((r): [string, Row] => [r.id, r]),
              ]),
          );
          setLookupError("");
        }
      } catch (e) {
        if (active) setLookupError(message(e));
      }
    }
    void selected();
    return () => {
      active = false;
    };
  }, [kind, selectedId, cache]);
  useEffect(() => {
    let active = true;
    const timeout = setTimeout(() => {
      list(kind, new URLSearchParams({ q: query, size: "50" }))
        .then((p) => {
          if (active) {
            setRows(p.items);
            setCache(
              (previous) =>
                new Map([
                  ...previous,
                  ...[...p.items, ...p.references].map((row): [string, Row] => [
                    row.id,
                    row,
                  ]),
                ]),
            );
            setError("");
          }
        })
        .catch((e) => {
          if (active) setError(message(e));
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [kind, query]);
  return {
    query,
    setQuery,
    rows,
    references: cache,
    selected: cache.get(selectedId),
    error: lookupError || error,
  };
}
