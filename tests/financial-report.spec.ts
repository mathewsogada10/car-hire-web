import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { login, navigate } from "./helpers";
import { displayMoney } from "../src/utilities/money";

test("a selected financial year shows twelve reconciled months, refunds, paid expenses and negative profit", async ({
  page,
}) => {
  await page.goto("/");
  await login(page);
  const csrf = await (await page.request.get("/api/v1/auth/csrf")).json();
  async function create(
    kind: string,
    data: Record<string, string | number | null>,
  ) {
    const response = await page.request.post("/api/v1/changes", {
      headers: { [csrf.headerName]: csrf.token },
      data: {
        operationId: randomUUID(),
        id: randomUUID(),
        kind,
        baseRevision: 0,
        data,
        deleted: false,
      },
    });
    expect(response.ok(), await response.text()).toBe(true);
    return (await response.json()).record.id as string;
  }
  const reg = `FY${randomUUID().slice(0, 8)}`.toUpperCase();
  const vehicleId = await create("vehicles", {
    registration: reg,
    make: "Toyota",
    model: "Axio",
    status: "Available",
  });
  const customerId = await create("customers", {
    name: reg,
    phone: "0700000000",
  });
  const hireId = await create("hires", {
    vehicleId,
    customerId,
    plannedStart: "2035-07-01T08:00:00Z",
    plannedEnd: "2035-07-31T08:00:00Z",
    chargeMinor: 1000000,
    status: "Booked",
  });
  const paymentId = await create("payments", {
    hireId,
    amountMinor: 500000,
    kind: "Payment",
    method: "Cash",
    status: "Received",
    date: "2035-07-10",
  });
  await create("payments", {
    hireId,
    originalPaymentId: paymentId,
    amountMinor: 100000,
    kind: "Refund",
    method: "Cash",
    status: "Received",
    date: "2035-08-01",
  });
  await create("payments", {
    hireId,
    amountMinor: 200000,
    kind: "Deposit",
    method: "Cash",
    status: "Received",
    date: "2035-07-12",
  });
  await create("payments", {
    hireId,
    amountMinor: 99999,
    kind: "Payment",
    method: "Cash",
    status: "Pending",
    date: "2035-07-13",
  });
  const categoryId = await create("categories", { name: reg });
  await create("expenses", {
    vehicleId,
    categoryId,
    name: reg,
    amountMinor: 200000,
    status: "Paid",
    date: "2035-07-09",
    paidDate: "2035-08-10",
  });
  await create("expenses", {
    vehicleId,
    categoryId,
    name: `${reg} unpaid`,
    amountMinor: 99999,
    status: "Due",
    date: "2035-07-09",
  });
  await navigate(page, "Financial report");
  await page.getByLabel("From", { exact: true }).fill("2035-07-01");
  await page.getByLabel("Through", { exact: true }).fill("2036-06-30");
  await page
    .getByLabel("Search vehicle", { exact: true })
    .selectOption({ label: reg });
  const table = page.getByRole("region", {
    name: "Monthly financial amounts",
    exact: true,
  });
  await expect(table.locator("tbody tr")).toHaveCount(12);
  await expect(table.locator("tbody tr").first().locator("th")).toHaveText(
    "2035-07",
  );
  await expect(table.locator("tbody tr").last().locator("th")).toHaveText(
    "2036-06",
  );
  const july = table.locator("tbody tr").filter({ hasText: "2035-07" });
  await expect(july.locator("td").nth(0)).toHaveText(displayMoney(500000));
  await expect(july.locator("td").nth(1)).toHaveText(displayMoney(0));
  const august = table.locator("tbody tr").filter({ hasText: "2035-08" });
  await expect(august.locator("td").nth(0)).toHaveText(displayMoney(-100000));
  await expect(august.locator("td").nth(1)).toHaveText(displayMoney(200000));
  await expect(august.locator("td").nth(2)).toHaveText(displayMoney(-300000));
  const september = table.locator("tbody tr").filter({ hasText: "2035-09" });
  await expect(september.locator("td").nth(2)).toHaveText(displayMoney(0));
  await expect(
    page.getByRole("img", { name: /Monthly financial trend/ }),
  ).toBeVisible();
  const lines = [
    ["paymentsReceivedMinor", "Payments received (net refunds)"],
    ["expensesPaidMinor", "Paid expenses"],
    ["netProfitMinor", "Net profit (cash basis)"],
  ] as const;
  for (const [key, label] of lines) {
    await expect(
      page.getByRole("checkbox", { name: label, exact: true }),
    ).toBeChecked();
    const points = await page
      .getByTestId(`trend-${key}`)
      .getAttribute("points");
    expect(points?.split(" ")).toHaveLength(12);
    expect(points).not.toContain("NaN");
  }
  for (const mask of [3, 5, 6, 1, 2, 4, 0, 1]) {
    for (const [index, [key, label]] of lines.entries()) {
      const selected = (mask & (1 << index)) !== 0;
      const checkbox = page.getByRole("checkbox", { name: label, exact: true });
      await checkbox.setChecked(selected);
      await expect(checkbox).toBeChecked({ checked: selected });
      await expect(page.getByTestId(`trend-${key}`)).toHaveCount(
        selected ? 1 : 0,
      );
    }
    await expect(
      page.getByText("Select at least one line to display the chart."),
    ).toHaveCount(mask === 0 ? 1 : 0);
    await expect(august.locator("td").nth(2)).toHaveText(displayMoney(-300000));
  }
  const paymentsCheckbox = page.getByRole("checkbox", {
    name: lines[0][1],
    exact: true,
  });
  await paymentsCheckbox.focus();
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("img", { name: /Monthly financial trend/ }),
  ).toHaveCount(0);
  await page.keyboard.press("Space");
  await expect(paymentsCheckbox).toBeChecked();
  const paymentsPoints = (await page
    .getByTestId("trend-paymentsReceivedMinor")
    .getAttribute("points"))!;
  expect(Number(paymentsPoints.split(" ")[1].split(",")[1])).toBe(240);
  const overview = await (
    await page.request.get(
      `/api/v1/reports?from=2035-08-01&to=2035-08-31&vehicleId=${vehicleId}`,
    )
  ).json();
  expect(overview.cashProfitMinor).toBe(-300000);
  await page.getByLabel("From", { exact: true }).fill("2035-07-11");
  await page.getByLabel("Through", { exact: true }).fill("2035-07-31");
  await expect(table.locator("tbody tr")).toHaveCount(1);
  await expect(table.locator("tbody td").last()).toHaveText(displayMoney(0));
  await expect(paymentsCheckbox).toBeChecked();
  await expect(page.getByTestId("trend-expensesPaidMinor")).toHaveCount(0);
  await expect(page.getByTestId("trend-netProfitMinor")).toHaveCount(0);
  await page.getByLabel("Through", { exact: true }).fill("2035-07-01");
  await expect(page.getByRole("alert")).toContainText(
    "Through on or after From",
  );
  await expect(table).toBeHidden();
});
