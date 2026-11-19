import { useEffect, useState } from "react";
import { api, message } from "../../services/api";
import type { Report } from "../../types/reports";

export function useReport() {
  const [today] = useState(() =>
    new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10),
  );
  const [from, setFrom] = useState(`${today.slice(0, 4)}-01-01`);
  const [to, setTo] = useState(today);
  const [report, setReport] = useState<Report>();
  const [vehicleId, setVehicle] = useState("");
  const [error, setError] = useState("");
  const params = new URLSearchParams({
    from,
    to,
    ...(vehicleId ? { vehicleId } : {}),
  }).toString();
  useEffect(() => {
    let active = true;
    api<Report>(`/reports?${params}`)
      .then((r) => {
        if (active) {
          setReport(r);
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
    report,
    vehicleId,
    setVehicle,
    error,
    setError,
    params,
  };
}
