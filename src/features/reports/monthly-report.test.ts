import { expect, it } from "vitest";
import { monthlyReportSchema } from "./monthly-report";

it("accepts zero months and negative profits but rejects an unreconciled financial response", () => {
  const report = {
    from: "2025-07-01",
    to: "2026-06-30",
    currency: "KES",
    months: [
      {
        month: "2025-07",
        paymentsReceivedMinor: 10000,
        expensesPaidMinor: 13000,
        netProfitMinor: -3000,
      },
      {
        month: "2025-08",
        paymentsReceivedMinor: 0,
        expensesPaidMinor: 0,
        netProfitMinor: 0,
      },
    ],
  };
  expect(monthlyReportSchema.parse(report)).toEqual(report);
  expect(() =>
    monthlyReportSchema.parse({
      ...report,
      months: [{ ...report.months[0], netProfitMinor: 3000 }],
    }),
  ).toThrow();
});
