import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import type { Row } from "../src/services/api";
import { displayMoney } from "../src/utilities/money";

const vehicles = ["KAA123A", "KBB456B", "KCC789C"].map(
  (registration): Row => ({
    id: randomUUID(),
    kind: "vehicles",
    revision: 1,
    data: { registration, make: "Toyota", model: "Axio", status: "Available" },
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    deletedAt: null,
  }),
);

function resultPage(items: Row[]) {
  return {
    items,
    references: [],
    amountTotalMinor: 0,
    total: items.length,
    page: 0,
    size: 200,
  };
}

async function mockReports(page: Page) {
  const requests: { path: string; vehicle: string | null }[] = [];
  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace("/api/v1", "");
    if (path === "/auth/me")
      return route.fulfill({ json: { username: "owner" } });
    if (path === "/records/settings")
      return route.fulfill({ json: resultPage([]) });
    if (path === "/records/vehicles")
      return route.fulfill({ json: resultPage(vehicles) });
    if (path === "/reports" || path === "/reports/monthly") {
      const vehicle = url.searchParams.get("vehicleId");
      requests.push({ path, vehicle });
      const factor =
        vehicle == null
          ? 3
          : vehicle === vehicles[0].id
            ? 1
            : vehicle === vehicles[1].id
              ? 2
              : 0;
      if (path === "/reports/monthly")
        return route.fulfill({
          json: {
            from: url.searchParams.get("from"),
            to: url.searchParams.get("to"),
            currency: "KES",
            months: [
              {
                month: "2026-01",
                paymentsReceivedMinor: 900000 * factor,
                expensesPaidMinor: 500000 * factor,
                netProfitMinor: 400000 * factor,
              },
            ],
          },
        });
      return route.fulfill({
        json: {
          recognizedMinor: 4000000 * factor,
          collectionsMinor: 900000 * factor,
          outstandingMinor: 3300000 * factor,
          depositCashMinor: 200000 * factor,
          accruedExpensesMinor: 500000 * factor,
          cashExpensesMinor: 500000 * factor,
          expectedProfitMinor: 3500000 * factor,
          cashProfitMinor: 400000 * factor,
          balances: [],
          dateBasis: {},
        },
      });
    }
    return route.fulfill({
      status: 500,
      json: { message: `Unexpected test request: ${path}` },
    });
  });
  return requests;
}

for (const view of ["dashboard", "financial"]) {
  test(`${view} never publishes previous totals under changed vehicle or date filters`, async ({
    page,
  }) => {
    function amount(
      vehicle: string | null,
      from: string | null,
      to: string | null,
    ) {
      const base =
        vehicle === vehicles[0].id
          ? 1000
          : vehicle === vehicles[1].id
            ? 2000
            : 3000;
      return (
        base +
        (from === "2026-02-01" ? 100 : 0) +
        (to === "2026-10-31" ? 200 : 0)
      );
    }
    await page.route("**/api/v1/reports**", async (route) => {
      const url = new URL(route.request().url());
      const from = url.searchParams.get("from"),
        to = url.searchParams.get("to");
      const value = amount(url.searchParams.get("vehicleId"), from, to);
      const json =
        view === "financial"
          ? {
              from,
              to,
              currency: "KES",
              months: [
                {
                  month: "2026-01",
                  paymentsReceivedMinor: value,
                  expensesPaidMinor: 0,
                  netProfitMinor: value,
                },
              ],
            }
          : {
              recognizedMinor: value,
              collectionsMinor: value,
              outstandingMinor: 0,
              depositCashMinor: 0,
              accruedExpensesMinor: 0,
              cashExpensesMinor: 0,
              expectedProfitMinor: value,
              cashProfitMinor: value,
              balances: [],
              dateBasis: {},
            };
      await route.fulfill({ json });
    });
    await page.goto(
      `/tests/fixtures/report-probe.html?view=${view}&first=${vehicles[0].id}&second=${vehicles[1].id}`,
    );
    const result = page.getByTestId("probe-amount");
    await expect(result).toHaveText("3000");
    const selector = page.getByLabel("Probe vehicle");
    await selector.selectOption(vehicles[0].id);
    await expect(result).toHaveText("1000");
    await selector.selectOption(vehicles[1].id);
    await expect(result).toHaveText("2000");
    await page.getByLabel("Probe from").fill("2026-02-01");
    await expect(result).toHaveText("2100");
    await page.getByLabel("Probe through").fill("2026-10-31");
    await expect(result).toHaveText("2300");
    await selector.selectOption("");
    await expect(result).toHaveText("3300");
    const displayed = await page.evaluate(() => window.reportObservations);
    expect(
      displayed.filter(
        (sample) =>
          sample.amount != null &&
          sample.amount !== amount(sample.vehicle, sample.from, sample.to),
      ),
    ).toEqual([]);
  });

  test(`${view} requests and displays each selected vehicle, an empty vehicle, and fleet totals`, async ({
    page,
  }) => {
    const requests = await mockReports(page);
    await page.goto(`/?view=${view}`);
    const selector = page.getByLabel("Search vehicle", { exact: true });
    await expect(selector).toBeEnabled();
    const path = view === "dashboard" ? "/reports" : "/reports/monthly";
    const metrics =
      view === "dashboard"
        ? ([
            [
              page
                .locator(".card")
                .filter({ hasText: /^Recognized revenue/ })
                .locator("strong"),
              4000000,
            ],
            [
              page
                .locator(".card")
                .filter({ hasText: /^Cash collections/ })
                .locator("strong"),
              900000,
            ],
            [
              page
                .locator(".card")
                .filter({ hasText: /^Expenses paid/ })
                .locator("strong"),
              500000,
            ],
            [
              page
                .locator(".card")
                .filter({ hasText: /^Cash profit/ })
                .locator("strong"),
              400000,
            ],
          ] as const)
        : ([
            [page.locator("tbody td").nth(0), 900000],
            [page.locator("tbody td").nth(1), 500000],
            [page.locator("tbody td").nth(2), 400000],
          ] as const);
    for (const [id, factor] of [
      ["", 3],
      [vehicles[0].id, 1],
      [vehicles[1].id, 2],
      [vehicles[2].id, 0],
      ["", 3],
    ] as const) {
      await selector.selectOption(id);
      await expect(selector).toHaveValue(id);
      for (const [cell, amount] of metrics)
        await expect(cell).toHaveText(displayMoney(amount * factor));
      expect(requests.filter((r) => r.path === path).at(-1)?.vehicle).toBe(
        id || null,
      );
    }
    await expect(page.getByRole("alert")).toHaveCount(0);
  });
}

test("the hire editor displays readable overlap dates, days and amount without a UUID", async ({
  page,
}) => {
  await mockReports(page);
  const customer: Row = {
    ...vehicles[0],
    id: randomUUID(),
    kind: "customers",
    data: { name: "Test customer" },
  };
  await page.route("**/api/v1/records/hires?**", (route) =>
    route.fulfill({ json: resultPage([]) }),
  );
  await page.route("**/api/v1/records/customers?**", (route) =>
    route.fulfill({ json: resultPage([customer]) }),
  );
  await page.route("**/api/v1/auth/csrf", (route) =>
    route.fulfill({
      json: { headerName: "X-CSRF-TOKEN", token: "browser-test-only" },
    }),
  );
  const summary = "2026-12-01 10:00 - 2026-12-02 12:00 | Days:2 | KES 2,500.99";
  await page.route("**/api/v1/changes", (route) =>
    route.fulfill({
      status: 409,
      json: {
        message: `Vehicle has an overlapping hire: ${summary}`,
        detail: { conflictingHire: summary },
      },
    }),
  );
  await page.goto("/?view=hires");
  await page.getByRole("button", { name: "+ Add hire" }).click();
  await page
    .getByLabel("Choose Vehicles", { exact: true })
    .selectOption(vehicles[0].id);
  await page
    .getByLabel("Choose Customers", { exact: true })
    .selectOption(customer.id);
  await page
    .getByLabel("Planned pickup (local time)", { exact: true })
    .fill("2026-12-01T10:00");
  await page
    .getByLabel("Planned return (local time)", { exact: true })
    .fill("2026-12-02T12:00");
  await page
    .getByRole("combobox", { name: "Status", exact: true })
    .last()
    .selectOption("Booked");
  await page.getByLabel("Agreed charge (KES)", { exact: true }).fill("2500.99");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(summary);
  const evidence = page
    .getByText("Conflict / validation evidence")
    .locator("..");
  await expect(evidence).toContainText(summary);
  await expect(evidence).not.toContainText("conflictingId");
  await expect(evidence).not.toContainText(vehicles[0].id);
});
