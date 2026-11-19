import { download, message } from "../services/api";
import { Notice } from "../components/notice";
import { displayMoney } from "../utilities/money";
import { useReport } from "../features/reports/use-report";

export function Dashboard({ full = false }: { full?: boolean }) {
  const {
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
  } = useReport();
  return (
    <>
      <p className="eyebrow">YOUR BUSINESS, CLEARLY</p>
      <h1>{full ? "Financial reports" : "Fleet overview"}</h1>
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
        <label>
          Vehicle UUID (optional)
          <input
            value={vehicleId}
            onChange={(e) => setVehicle(e.target.value)}
            placeholder="All vehicles"
          />
        </label>
      </div>
      <Notice error={error} />
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
              <table>
                <thead>
                  <tr>
                    <th>Hire</th>
                    <th>Outstanding (KES)</th>
                  </tr>
                </thead>
                <tbody>
                  {report.balances.map((b) => (
                    <tr key={b.hireId}>
                      <td>{b.hireId}</td>
                      <td>{displayMoney(b.outstandingMinor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No hire balances in this period.</p>
            )}
          </section>
        </>
      )}
    </>
  );
}
