import { useEffect, useState } from "react";
import { api, message } from "../../services/api";
import { monthlyReportSchema } from "./monthly-report";
import type { MonthlyReport } from "./monthly-report";

export function useMonthlyReport() {
  const [today] = useState(() =>
    new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10),
  );
  const [from, setFrom] = useState(`${today.slice(0, 4)}-01-01`);
  const [to, setTo] = useState(today);
  const [vehicleId, setVehicle] = useState("");
  const [report, setReport] = useState<MonthlyReport>();
  const [error, setError] = useState("");
  useEffect(() => {
    setReport(undefined);
    setError("");
    if (!from || !to || to < from) {
      setError("Enter both dates with Through on or after From.");
      return;
    }
    let active = true;
    const controller = new AbortController();
    const params = new URLSearchParams({
      from,
      to,
      ...(vehicleId ? { vehicleId } : {}),
    });
    const timer = setTimeout(() => {
      api<unknown>(`/reports/monthly?${params}`, { signal: controller.signal })
        .then((value) => {
          if (active) setReport(monthlyReportSchema.parse(value));
        })
        .catch((e) => {
          if (active) setError(message(e));
        });
    }, 200);
    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [from, to, vehicleId]);
  return { from, setFrom, to, setTo, vehicleId, setVehicle, report, error };
}
