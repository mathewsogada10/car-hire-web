import { useEffect, useState } from "react";
import { message } from "../../services/api";
import type { Row } from "../../services/api";
import { allRecords } from "../../services/all-records";

export function useReportVehicles() {
  const [vehicles, setVehicles] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const rows = await allRecords("vehicles");
        if (!active) return;
        setVehicles([...new Map(rows.map((row) => [row.id, row])).values()]);
      } catch (e) {
        if (active) setError(message(e));
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);
  return { vehicles, loading, error };
}
