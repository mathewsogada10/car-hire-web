import { Notice } from "../components/notice";
import { displayMoney } from "../utilities/money";
import { FinancialLineChart } from "../features/reports/financial-line-chart";
import { ReportVehicleFilter } from "../features/reports/report-vehicle-filter";
import { useMonthlyReport } from "../features/reports/use-monthly-report";
import { financialSeries } from "../features/reports/monthly-report";
import "../styles/financial-report.css";

export function FinancialReport() {
  const { from, setFrom, to, setTo, vehicleId, setVehicle, report, error } =
    useMonthlyReport();
  return (
    <>
      <h1>Financial report</h1>
      <p>
        Monthly cash-basis trend in KES. Payments received are net of refunds;
        security deposits and deposit applications are excluded. Net profit =
        payments received - paid expenses. This is not recognized-revenue
        profit.
      </p>
      <p className="muted">
        Choose any financial year or other period. Empty months show zero, and
        partial months include only the selected dates. Expenses use paid date,
        falling back to business date when absent.
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
      {!report && !error && (
        <p role="status">Loading monthly financial trend...</p>
      )}
      {report && (
        <>
          <section className="panel" aria-label="Monthly financial chart">
            <FinancialLineChart months={report.months} />
          </section>
          <h2>Monthly amounts (KES)</h2>
          <div
            className="table-wrap"
            role="region"
            aria-label="Monthly financial amounts"
            tabIndex={0}
          >
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  {financialSeries.map((s) => (
                    <th key={s.key}>{s.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.months.map((month) => (
                  <tr key={month.month}>
                    <th scope="row">{month.month}</th>
                    {financialSeries.map((s) => (
                      <td key={s.key}>{displayMoney(month[s.key])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
