import { useMemo } from "react";
import { Notice } from "../../components/notice";
import { useReportVehicles } from "./use-report-vehicles";

export function ReportVehicleFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const { vehicles, loading, error } = useReportVehicles();
  const options = useMemo(
    () =>
      [...vehicles].sort((a, b) =>
        String(a.data.registration).localeCompare(String(b.data.registration)),
      ),
    [vehicles],
  );
  return (
    <div className="reference report-vehicle-filter">
      <label>
        Search vehicle
        <select
          aria-label="Search vehicle"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading || !!error}
        >
          <option value="">
            {loading ? "Loading vehicles..." : "All vehicles"}
          </option>
          {options.map((row) => (
            <option key={row.id} value={row.id}>
              {String(row.data.registration)}
            </option>
          ))}
        </select>
      </label>
      <Notice error={error} />
    </div>
  );
}
