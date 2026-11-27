import { useEffect, useState } from "react";
import { api, message } from "../../services/api";
import type { Report } from "../../types/reports";
import type { Row } from "../../services/api";
import { recordContext } from "../../services/record-context";

export function useReport() {
  const [today] = useState(() =>
    new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10),
  );
  const [from, setFrom] = useState(`${today.slice(0, 4)}-01-01`);
  const [to, setTo] = useState(today);
  const [result, setResult] = useState<{
    params: string;
    report: Report;
    references: Row[];
  }>();
  const [vehicleId, setVehicle] = useState("");
  const [error, setError] = useState("");
  const params = new URLSearchParams({
    from,
    to,
    ...(vehicleId ? { vehicleId } : {}),
  }).toString();
  const current = result?.params === params ? result : undefined;
  useEffect(() => {
    let active = true;
    setResult(undefined);
    setError("");
    api<Report>(`/reports?${params}`)
      .then(async (report) => {
        if (!active) return;
        const references = await recordContext(
          report.balances.map((balance) => ({
            kind: "hires",
            id: balance.hireId,
          })),
        );
        if (active) {
          setResult({ params, report, references });
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(message(e));
      });
    return () => {
      active = false;
    };
  }, [params]);
  return {
    from,
    setFrom,
    to,
    setTo,
    report: current?.report,
    references: current?.references ?? [],
    vehicleId,
    setVehicle,
    error,
    setError,
    params,
  };
}
