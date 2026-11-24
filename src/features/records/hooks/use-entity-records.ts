import { useEffect, useState } from "react";
import { list, message, save } from "../../../services/api";
import type { Row } from "../../../services/api";

export function useEntityRecords(kind: string) {
  const initial = new URLSearchParams(location.search);
  const [query, setQuery] = useState(initial.get("q") ?? "");
  const [from, setFrom] = useState(initial.get("from") ?? "");
  const [to, setTo] = useState(initial.get("to") ?? "");
  const [status, setStatus] = useState(initial.get("status") ?? "");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<Row[]>([]);
  const [references, setReferences] = useState<Row[]>([]);
  const [amountTotalMinor, setAmountTotalMinor] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);
  useEffect(() => {
    let active = true;
    const p = new URLSearchParams(location.search);
    for (const [k, v] of Object.entries({
      q: query,
      from,
      to,
      status,
      page: String(page),
    })) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    history.replaceState(null, "", `?${p}`);
    setLoading(true);
    const params = new URLSearchParams({
      q: query,
      from,
      to,
      status,
      page: String(page),
      size: "25",
    });
    const timer = setTimeout(() => {
      list(kind, params)
        .then((result) => {
          if (active) {
            setRows(result.items);
            setReferences(result.references);
            setAmountTotalMinor(result.amountTotalMinor);
            setTotal(result.total);
            setError("");
            if (kind === "settings") setEditing(result.items[0] ?? "new");
          }
        })
        .catch((e) => {
          if (active) setError(message(e));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [kind, page, query, from, to, status, refresh]);

  async function deleteRecord() {
    try {
      await save({
        operationId: crypto.randomUUID(),
        id: deleting!.id,
        kind,
        baseRevision: deleting!.revision,
        data: deleting!.data,
        deleted: true,
      });
      setDeleting(null);
      setRefresh((n) => n + 1);
    } catch (e) {
      setError(message(e));
      setDeleting(null);
    }
  }
  return {
    query,
    setQuery,
    from,
    setFrom,
    to,
    setTo,
    status,
    setStatus,
    page,
    setPage,
    rows,
    references,
    amountTotalMinor,
    total,
    error,
    loading,
    setRefresh,
    editing,
    setEditing,
    deleting,
    setDeleting,
    deleteRecord,
  };
}
