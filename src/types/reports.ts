export interface Report {
  recognizedMinor: number;
  collectionsMinor: number;
  accruedExpensesMinor: number;
  cashExpensesMinor: number;
  expectedProfitMinor: number;
  cashProfitMinor: number;
  outstandingMinor: number;
  depositCashMinor: number;
  balances: { hireId: string; outstandingMinor: number }[];
  dateBasis: Record<string, string>;
}
