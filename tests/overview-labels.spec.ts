import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import type { Data, Row } from "../src/services/api";
import { login } from "./helpers";

test.use({ timezoneId: "Africa/Nairobi" });

async function seed(page: Page) {
  const response = await page.request.get("/api/v1/auth/csrf");
  const csrf: { headerName: string; token: string } = await response.json();
  return async (kind: string, data: Data): Promise<Row> => {
    const saved = await page.request.post("/api/v1/changes", {
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
    expect(saved.ok(), await saved.text()).toBe(true);
    return (await saved.json()).record;
  };
}

test("one overview has a single registration selector across vehicle pages and descriptive hire balances", async ({
  page,
}) => {
  await page.goto("/?view=reports");
  await login(page);
  await expect(
    page.getByLabel("Search vehicle", { exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("heading", { name: "Fleet overview", exact: true }),
  ).toBeVisible();
  const nav = page.getByRole("navigation");
  await expect(
    nav.getByRole("button", { name: "Reports", exact: true }),
  ).toHaveCount(0);
  await expect(
    nav.getByRole("button", { name: "Overview", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  const create = await seed(page);
  const tag = randomUUID().slice(0, 8).toUpperCase();
  const vehicles = await Promise.all(
    ["123A", "456B"].map((suffix) =>
      create("vehicles", {
        registration: `VIEW${tag} ${suffix}`,
        make: "Toyota",
        model: "Axio",
        status: "Available",
      }),
    ),
  );
  const customer = await create("customers", {
    name: `Overview ${tag}`,
    phone: "0700000000",
  });
  let firstHire: Row | undefined;
  for (const [index, vehicle] of vehicles.entries()) {
    const hire = await create("hires", {
      vehicleId: vehicle.id,
      customerId: customer.id,
      plannedStart: "2034-01-01T08:00:00Z",
      plannedEnd: "2034-01-04T08:00:00Z",
      status: "Booked",
      chargeMinor: (index + 1) * 350000,
    });
    if (!firstHire) firstHire = hire;
  }
  await create("payments", {
    hireId: firstHire!.id,
    amountMinor: 100000,
    kind: "Payment",
    method: "Cash",
    status: "Received",
    date: "2034-01-02",
  });
  const fleet: Row[] = [
    ...Array.from({ length: 200 }, (_, index) => ({
      ...vehicles[0],
      id: randomUUID(),
      data: { registration: `OTHER ${index}` },
    })),
    ...vehicles,
  ];
  const requestedPages: number[] = [];
  await page.route("**/api/v1/records/vehicles?**", async (route) => {
    const params = new URL(route.request().url()).searchParams;
    const pageNumber = Number(params.get("page"));
    requestedPages.push(pageNumber);
    await route.fulfill({
      json: {
        items: fleet.slice(pageNumber * 200, (pageNumber + 1) * 200),
        references: [],
        amountTotalMinor: 0,
        total: fleet.length,
        page: pageNumber,
        size: 200,
      },
    });
  });
  await page.reload();
  const selector = page.getByLabel("Search vehicle", {
    exact: true,
  });
  await expect(selector).toBeEnabled();
  await expect(
    page.getByRole("textbox", {
      name: "Search vehicle registration",
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Report vehicle", { exact: true })).toHaveCount(
    0,
  );
  expect(requestedPages).toEqual(expect.arrayContaining([0, 1]));
  await page.getByLabel("From", { exact: true }).fill("2034-01-01");
  await page.getByLabel("Through", { exact: true }).fill("2034-01-31");
  const outstanding = page
    .locator(".card")
    .filter({ hasText: /^Outstanding/ })
    .locator("strong");
  const balances = page.getByRole("region", {
    name: "Hire balances",
    exact: true,
  });
  await expect(outstanding).toContainText("9,500.00");
  await expect(selector.locator("option")).toHaveCount(203);
  await selector.selectOption({ label: String(vehicles[0].data.registration) });
  await expect(outstanding).toContainText("2,500.00");
  await expect(balances.locator("tbody tr")).toHaveCount(1);
  const hire = balances.locator("tbody tr td").first();
  await expect(hire).toContainText(String(vehicles[0].data.registration));
  await expect(hire).toContainText("2034-01-01 11:00");
  await expect(hire).toContainText("2034-01-04 11:00");
  await expect(hire).toContainText("3,500.00");
  await expect(hire).not.toContainText(firstHire!.id);
  await expect(hire).not.toContainText("GMT");
  await expect(selector).not.toContainText(vehicles[0].id);
  await expect(selector).toHaveValue(vehicles[0].id);
  await expect(outstanding).toContainText("2,500.00");
  await selector.selectOption({ label: "All vehicles" });
  await expect(outstanding).toContainText("9,500.00");
  await expect(balances.locator("tbody tr")).toHaveCount(2);
  await page.setViewportSize({ width: 320, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("expense categories and providers show names, missing providers show a dash, and lookup failures are visible", async ({
  page,
}) => {
  await page.goto("/");
  await login(page);
  const create = await seed(page);
  const tag = `EXP${randomUUID().slice(0, 8)}`;
  const vehicle = await create("vehicles", {
    registration: tag,
    make: "Toyota",
    model: "Axio",
    status: "Available",
  });
  const category = await create("categories", { name: `Repairs ${tag}` });
  const provider = await create("providers", { name: `Garage ${tag}` });
  for (const suffix of ["with provider", "without provider"])
    await create("expenses", {
      vehicleId: vehicle.id,
      categoryId: category.id,
      providerId: suffix === "with provider" ? provider.id : null,
      name: `${tag} ${suffix}`,
      amountMinor: 15000,
      date: "2034-01-02",
      status: "Due",
    });
  let categoryReads = 0;
  let providerReads = 0;
  page.on("request", (request) => {
    if (
      new URL(request.url()).pathname ===
      `/api/v1/records/categories/${category.id}`
    )
      categoryReads++;
    if (
      new URL(request.url()).pathname ===
      `/api/v1/records/providers/${provider.id}`
    )
      providerReads++;
  });
  await page.goto(`/?view=expenses&q=${tag}`);
  const table = page.getByRole("region", {
    name: "Expenses records",
    exact: true,
  });
  await expect(table.locator("tbody tr")).toHaveCount(2);
  const withProvider = table
    .locator("tbody tr")
    .filter({ hasText: `${tag} with provider` });
  const withoutProvider = table
    .locator("tbody tr")
    .filter({ hasText: `${tag} without provider` });
  await expect(withProvider.locator("td").nth(2)).toHaveText(`Repairs ${tag}`);
  await expect(withProvider.locator("td").nth(3)).toHaveText(`Garage ${tag}`);
  await expect(withoutProvider.locator("td").nth(2)).toHaveText(
    `Repairs ${tag}`,
  );
  await expect(withoutProvider.locator("td").nth(3)).toHaveText("-");
  expect(categoryReads).toBe(1);
  expect(providerReads).toBe(1);
  await page.route(`**/api/v1/records/categories/${category.id}`, (route) =>
    route.fulfill({
      status: 500,
      json: { message: "Category lookup unavailable" },
    }),
  );
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Category lookup unavailable",
  );
  await expect(page.getByTestId("filtered-total")).toHaveCount(0);
});
