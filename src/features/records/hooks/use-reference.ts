import { useEffect, useState } from "react";
import { list, message } from "../../../services/api";
import type { Row } from "../../../services/api";

export function useReference(kind: string) {
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const timeout = setTimeout(() => {
      list(kind, new URLSearchParams({ q: query, size: "50" }))
        .then((p) => {
          if (active) {
            setRows(p.items);
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
  return { query, setQuery, rows, error };
}
