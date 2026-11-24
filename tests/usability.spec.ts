import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { login, navigate } from "./helpers";

test("registrations, day counts, paid dates and filtered totals stay coherent across pages", async ({
  page,
}) => {
  await page.goto("/");
  await login(page);
  const csrfResponse = await page.request.get("/api/v1/auth/csrf");
  const csrf: { headerName: string; token: string } = await csrfResponse.json();
  async function create(
    kind: string,
    data: Record<string, string | number | null>,
  ) {
    const id = randomUUID();
    const response = await page.request.post("/api/v1/changes", {
      headers: { [csrf.headerName]: csrf.token },
      data: {
        operationId: randomUUID(),
        id,
        kind,
        baseRevision: 0,
        data,
        deleted: false,
      },
    });
    expect(response.ok(), await response.text()).toBe(true);
    return id;
  }
  const reg = `TOTAL${randomUUID().slice(0, 8)}`.toUpperCase();
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
  let hireId = "";
  for (let day = 1; day <= 26; day++) {
    const id = await create("hires", {
      vehicleId,
      customerId,
      plannedStart: `2033-01-${String(day).padStart(2, "0")}T08:00:00Z`,
      plannedEnd: `2033-01-${String(day + 1).padStart(2, "0")}T08:00:00Z`,
      status: day % 2 ? "Draft" : "Booked",
      chargeMinor: 10000,
    });
    if (!hireId) hireId = id;
  }
  for (const [index, status] of ["Received", "Pending", "Failed"].entries())
    await create("payments", {
      hireId,
      amountMinor: (index + 1) * 10000,
      kind: "Payment",
      method: "Cash",
      status,
      date: `2033-01-0${index + 1}`,
    });
  const hire = await (
    await page.request.get(`/api/v1/records/hires/${hireId}`)
  ).json();
  expect(hire.data.actualStart).toBe(hire.data.plannedStart);
  expect(hire.data.actualEnd).toBe(hire.data.plannedEnd);
  const categoryId = await create("categories", { name: `Category ${reg}` });
  for (let day = 1; day <= 3; day++)
    await create("expenses", {
      vehicleId,
      categoryId,
      name: `Fuel ${day}`,
      amountMinor: day * 5000,
      date: `2033-01-0${day}`,
      status: day === 3 ? "Paid" : "Due",
      paidDate: day === 3 ? "2033-01-04" : null,
    });

  await navigate(page, "Hires");
  const search = page.getByRole("textbox", { name: "Search", exact: true });
  const total = page.getByTestId("filtered-total");
  const status = page.getByRole("combobox", { name: "Status", exact: true });
  await search.fill(reg);
  await expect(page.locator("tbody tr")).toHaveCount(25);
  await expect(total).toContainText("2,600.00");
  await expect(total).toContainText("26 matching records");
  await expect(
    page.getByRole("cell", { name: "1", exact: true }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(total).toContainText("2,600.00");
  await status.selectOption("Draft");
  await expect(page.locator("tbody tr")).toHaveCount(13);
  await expect(total).toContainText("1,300.00");
  await search.fill("no matching registration");
  await expect(total).toContainText("0.00");
  await expect(total).toContainText("0 matching records");

  await navigate(page, "Payments & deposits");
  await search.fill(reg);
  await expect(page.locator("tbody tr")).toHaveCount(3);
  await expect(total).toContainText("600.00");
  await status.selectOption("Received");
  await expect(total).toContainText("100.00");
  await page.getByRole("button", { name: "+ Add record" }).click();
  await page.getByLabel("Search Hires", { exact: true }).fill(reg);
  const choices = page.getByLabel("Choose Hires", { exact: true });
  await expect(choices.locator("option")).toHaveCount(27);
  await choices.selectOption(hireId);
  await expect(choices.locator("option:checked")).toContainText(reg);
  await expect(choices.locator("option:checked")).toContainText("100.00");
  await expect(choices.locator("option:checked")).not.toContainText("GMT");
  await page
    .getByLabel("Search Hires", { exact: true })
    .fill("nothing matches");
  await expect(choices.locator("option")).toHaveCount(2);
  await expect(choices.locator("option:checked")).toContainText(reg);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();

  await navigate(page, "Expenses");
  await search.fill(reg);
  await expect(page.locator("tbody tr")).toHaveCount(3);
  await expect(total).toContainText("300.00");
  await expect(
    page.locator("tbody tr").filter({ hasText: "Fuel 1" }).locator("td").nth(6),
  ).toHaveText("2033-01-01");
  await expect(
    page.locator("tbody tr").filter({ hasText: "Fuel 3" }).locator("td").nth(6),
  ).toHaveText("2033-01-04");
  await status.selectOption("Due");
  await expect(total).toContainText("150.00");
  await page.getByLabel("From", { exact: true }).fill("2033-01-02");
  await page.getByLabel("Through", { exact: true }).fill("2033-01-02");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(total).toContainText("100.00");
});
