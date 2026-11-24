import { download, message } from "../services/api";
import { Notice } from "../components/notice";
import { displayMoney } from "../utilities/money";
import { useReport } from "../features/reports/use-report";
import { ReportVehicleFilter } from "../features/reports/report-vehicle-filter";
import { label } from "../features/records/record-label";
import { useMemo } from "react";

export function Dashboard() {
  const {
    from,
    setFrom,
    to,
    setTo,
    report,
    references,
    vehicleId,
    setVehicle,
    error,
    setError,
    params,
  } = useReport();
  const context = useMemo(
    () => new Map(references.map((row) => [row.id, row])),
    [references],
  );
  return (
    <>
      <p className="eyebrow">YOUR BUSINESS, CLEARLY</p>
      <h1>Fleet overview</h1>
      <p className="muted">
        KES | Africa/Nairobi | Revenue and cash are deliberately separate.
      </p>
      <div className="filters">
        <label>
          From
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label>
          Through
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <ReportVehicleFilter value={vehicleId} onChange={setVehicle} />
      </div>
      <Notice error={error} />
      {!report && !error && <p role="status">Loading overview...</p>}
      {report && (
        <>
          <div className="cards">
            {(
              [
                [
                  "Recognized revenue",
                  report.recognizedMinor,
                  "Completed actual-return date",
                ],
                [
                  "Cash collections",
                  report.collectionsMinor,
                  "Received less refunds; deposits excluded",
                ],
                [
                  "Outstanding",
                  report.outstandingMinor,
                  "Current balances of hires picked up in period",
                ],
                [
                  "Expected profit",
                  report.expectedProfitMinor,
                  "Recognized revenue less accrued expenses",
                ],
                [
                  "Cash profit",
                  report.cashProfitMinor,
                  "Collections less expenses paid",
                ],
                [
                  "Accrued expenses",
                  report.accruedExpensesMinor,
                  "Expense date",
                ],
                ["Expenses paid", report.cashExpensesMinor, "Paid date"],
                [
                  "Deposit cash movement",
                  report.depositCashMinor,
                  "Not hire income",
                ],
              ] as const
            ).map(([title, amount, basis]) => (
              <article className="card" key={title}>
                <span>{title}</span>
                <strong>{displayMoney(amount)}</strong>
                <small>{basis}</small>
              </article>
            ))}
          </div>
          <section className="panel">
            <div className="section-head">
              <h2>Hire balances</h2>
              <button
                className="quiet"
                onClick={() => {
                  download(
                    `/reports/balances.csv?${params}`,
                    "hire-balances.csv",
                  ).catch((e) => setError(message(e)));
                }}
              >
                Download CSV
              </button>
            </div>
            {report.balances.length ? (
              <div
                className="table-wrap"
                role="region"
                aria-label="Hire balances"
                tabIndex={0}
              >
                <table>
                  <thead>
                    <tr>
                      <th>Hire</th>
                      <th>Outstanding (KES)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.balances.map((b) => {
                      const hire = context.get(b.hireId);
                      return (
                        <tr key={b.hireId}>
                          <td>
                            {hire ? label(hire, context) : "Hire unavailable"}
                          </td>
                          <td>{displayMoney(b.outstandingMinor)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No hire balances in this period.</p>
            )}
          </section>
        </>
      )}
    </>
  );
}
