import { z } from "zod";

const monthSchema = z
  .object({
    month: z.string().regex(/^\d{4}-\d{2}$/),
    paymentsReceivedMinor: z.number().int().safe(),
    expensesPaidMinor: z.number().int().safe(),
    netProfitMinor: z.number().int().safe(),
  })
  .refine(
    (month) =>
      month.netProfitMinor ===
      month.paymentsReceivedMinor - month.expensesPaidMinor,
    "Monthly net profit must equal received payments less paid expenses",
  );

export const monthlyReportSchema = z.object({
  from: z.string(),
  to: z.string(),
  currency: z.literal("KES"),
  months: z.array(monthSchema).min(1).max(1200),
});
export type FinancialMonth = z.infer<typeof monthSchema>;
export type MonthlyReport = z.infer<typeof monthlyReportSchema>;

export const financialSeries = [
  {
    key: "paymentsReceivedMinor",
    label: "Payments received (net refunds)",
    className: "trend-payments",
    dash: undefined,
  },
  {
    key: "expensesPaidMinor",
    label: "Paid expenses",
    className: "trend-expenses",
    dash: "8 4",
  },
  {
    key: "netProfitMinor",
    label: "Net profit (cash basis)",
    className: "trend-profit",
    dash: "2 4",
  },
] as const;
