import { useLayoutEffect } from "react";
import { createRoot } from "react-dom/client";
import { useReport } from "../../src/features/reports/use-report";
import { useMonthlyReport } from "../../src/features/reports/use-monthly-report";

export interface ReportObservation {
  vehicle: string;
  from: string;
  to: string;
  amount: number | undefined;
}

declare global {
  interface Window {
    reportObservations: ReportObservation[];
  }
}

window.reportObservations = [];
const params = new URLSearchParams(location.search);

function ProbeControls({
  from,
  setFrom,
  to,
  setTo,
  vehicleId,
  setVehicle,
  amount,
}: {
  from: string;
  setFrom: (value: string) => void;
  to: string;
  setTo: (value: string) => void;
  vehicleId: string;
  setVehicle: (value: string) => void;
  amount: number | undefined;
}) {
  useLayoutEffect(() => {
    window.reportObservations.push({ vehicle: vehicleId, from, to, amount });
  });
  return (
    <>
      <select
        aria-label="Probe vehicle"
        value={vehicleId}
        onChange={(e) => setVehicle(e.target.value)}
      >
        <option value="">All vehicles</option>
        <option value={params.get("first")!}>First vehicle</option>
        <option value={params.get("second")!}>Second vehicle</option>
      </select>
      <input
        aria-label="Probe from"
        type="date"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
      />
      <input
        aria-label="Probe through"
        type="date"
        value={to}
        onChange={(e) => setTo(e.target.value)}
      />
      <output data-testid="probe-amount">{amount ?? "Calculating..."}</output>
    </>
  );
}

function DashboardProbe() {
  const report = useReport();
  return <ProbeControls {...report} amount={report.report?.collectionsMinor} />;
}

function MonthlyProbe() {
  const report = useMonthlyReport();
  return (
    <ProbeControls
      {...report}
      amount={report.report?.months[0].paymentsReceivedMinor}
    />
  );
}

createRoot(document.getElementById("probe")!).render(
  params.get("view") === "financial" ? <MonthlyProbe /> : <DashboardProbe />,
);
