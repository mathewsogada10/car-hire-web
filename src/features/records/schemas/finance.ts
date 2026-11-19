import { f, ref, options, vehicle, amount, date, notes, name } from "./fields";

export const financeSchemas = {
  payments: {
    title: "Payments & deposits",
    fields: [
      ref("hireId", "Hire", "hires"),
      options("kind", "Entry kind", [
        "Payment",
        "Deposit",
        "Refund",
        "DepositApplication",
        "DepositRefund",
      ]),
      amount,
      date,
      options("status", "Status", ["Pending", "Received", "Failed"]),
      options("method", "Method", [
        "Cash",
        "M-Pesa (manual)",
        "Bank",
        "Card",
        "Other",
      ]),
      f("reference", "Reference", "text", true),
      ref(
        "originalPaymentId",
        "Original payment (required for refunds)",
        "payments",
        true,
      ),
      notes,
    ],
  },
  expenses: {
    title: "Expenses",
    fields: [
      vehicle,
      name,
      ref("categoryId", "Category", "categories"),
      ref("providerId", "Provider", "providers", true),
      amount,
      date,
      options("status", "Status", ["Planned", "Due", "Paid", "Cancelled"]),
      f("paidDate", "Paid date (required when paid)", "date", true),
      notes,
    ],
  },
  categories: {
    title: "Expense categories",
    fields: [name, f("active", "Active", "boolean")],
  },
  providers: {
    title: "Service providers",
    fields: [name, f("phone", "Phone", "text", true), notes],
  },
};
