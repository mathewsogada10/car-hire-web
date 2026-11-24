import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";
import { login, navigate } from "./helpers";

test("Hires uses defined statuses, combines filters and preserves pickup ordering", async ({
  page,
}) => {
  await page.goto("/");
  await login(page);
  const csrfResponse = await page.request.get("/api/v1/auth/csrf");
  const csrf: { token: string; headerName: string } = await csrfResponse.json();
  const marker = `hire-filter-${randomUUID()}`;
  const statuses = ["Draft", "Booked", "Active", "Completed", "Cancelled"];
  async function create(kind: string, data: Record<string, string | number>) {
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
  const customerId = await create("customers", {
    name: marker,
    phone: "0700000000",
  });
  for (const [index, status] of statuses.entries()) {
    const vehicleId = await create("vehicles", {
      registration: `FILTER${randomUUID()}`,
      make: "Toyota",
      model: "Axio",
      status: "Available",
    });
    const day = 5 - index;
    const start = `2026-01-0${day}T08:00:00Z`;
    const end = `2026-01-0${day + 1}T08:00:00Z`;
    await create("hires", {
      vehicleId,
      customerId,
      status,
      plannedStart: start,
      plannedEnd: end,
      chargeMinor: (index + 1) * 10000,
      notes: marker,
      ...(status === "Active" || status === "Completed"
        ? { actualStart: start }
        : {}),
      ...(status === "Completed" ? { actualEnd: end } : {}),
    });
  }
  await navigate(page, "Hires");
  const status = page.getByRole("combobox", { name: "Status", exact: true });
  await expect(status.locator("option")).toHaveText([
    "All statuses",
    ...statuses,
  ]);
  await page.getByRole("textbox", { name: "Search", exact: true }).fill(marker);
  await page.getByLabel("From", { exact: true }).fill("2026-01-01");
  await page.getByLabel("Through", { exact: true }).fill("2026-01-05");
  const rows = page.locator("tbody tr");
  await expect(rows).toHaveCount(5);
  const pickupTimes = await rows.locator("td:nth-child(3)").allTextContents();
  expect(pickupTimes).toEqual([...pickupTimes].sort());
  for (const value of statuses) {
    await status.selectOption(value);
    await expect(rows).toHaveCount(1);
    await expect(rows.locator("td:nth-child(2)")).toContainText(
      `${statuses.indexOf(value) + 1}00.00`,
    );
    await expect(page.getByTestId("filtered-total")).toContainText(
      `${statuses.indexOf(value) + 1}00.00`,
    );
    await expect
      .poll(() => new URL(page.url()).searchParams.get("status"))
      .toBe(value);
  }
  await status.selectOption("");
  await expect(rows).toHaveCount(5);
  await page.goto(`/?view=hires&q=${marker}&status=not-a-status`);
  await expect(status).toHaveValue("not-a-status");
  await expect(status.locator("option:checked")).toContainText(
    "Unsupported status",
  );
  await status.selectOption("");
  await expect(rows).toHaveCount(5);
});
