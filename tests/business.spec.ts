import { test, expect } from "@playwright/test";
import { login, navigate } from "./helpers";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await login(page);
});

test("creates vehicle and customer, completes hire and reconciles cash vs revenue", async ({
  page,
}) => {
  const suffix = Date.now().toString();
  const registration = `TEST${suffix}`;
  await navigate(page, "Vehicles");
  await page.getByRole("button", { name: "+ Add record" }).click();
  await page.getByLabel("Registration", { exact: true }).fill(registration);
  await page.getByLabel("Make", { exact: true }).fill("Toyota");
  await page.getByLabel("Model", { exact: true }).fill("Axio");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(
    page.getByRole("cell", { name: registration, exact: true }),
  ).toBeVisible();
  await navigate(page, "Customers");
  await page.getByRole("button", { name: "+ Add record" }).click();
  await page.getByLabel("Name", { exact: true }).fill(`Customer ${suffix}`);
  await page.getByLabel("Phone (optional)", { exact: true }).fill("0700000000");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(
    page.getByRole("cell", { name: `Customer ${suffix}`, exact: true }),
  ).toBeVisible();
  await navigate(page, "Hires");
  await page.getByRole("button", { name: "+ Add hire" }).click();
  await page
    .getByLabel("Choose Vehicles", { exact: true })
    .selectOption({ label: registration });
  await page
    .getByLabel("Choose Customers", { exact: true })
    .selectOption({ label: `Customer ${suffix}` });
  await page
    .getByLabel("Planned pickup (local time)", { exact: true })
    .fill("2026-01-01T10:00");
  await page
    .getByLabel("Planned return (local time)", { exact: true })
    .fill("2026-01-03T10:00");
  await expect(page.getByLabel("Number of days", { exact: true })).toHaveValue(
    "2",
  );
  await expect(
    page.getByLabel("Number of days", { exact: true }),
  ).toHaveAttribute("readonly", "");
  await expect(
    page.getByLabel("Actual pickup (local time) (optional)", { exact: true }),
  ).toHaveValue("2026-01-01T10:00");
  await expect(
    page.getByLabel("Actual return (local time) (optional)", { exact: true }),
  ).toHaveValue("2026-01-03T10:00");
  await page
    .getByLabel("Actual pickup (local time) (optional)", { exact: true })
    .fill("2026-01-01T10:00");
  await page
    .getByLabel("Actual return (local time) (optional)", { exact: true })
    .fill("2026-01-03T10:00");
  await page.getByLabel("Agreed charge (KES)", { exact: true }).fill("40000");
  await page.getByLabel("Status", { exact: true }).selectOption("Completed");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(
    page.getByRole("heading", { name: "Hires", exact: true }),
  ).toBeVisible();
  await navigate(page, "Payments & deposits");
  await page.getByRole("button", { name: "+ Add record" }).click();
  const hireChoice = page.getByLabel("Choose Hires", { exact: true });
  await expect(hireChoice.locator("option")).not.toHaveCount(1);
  await hireChoice.selectOption({ index: 1 });
  await page.getByLabel("Amount (KES)", { exact: true }).fill("15000");
  await page.getByLabel("Business date", { exact: true }).fill("2026-01-03");
  await page.getByLabel("Status", { exact: true }).selectOption("Received");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(
    page.getByRole("heading", { name: "Payments & deposits", exact: true }),
  ).toBeVisible();
  await navigate(page, "Overview");
  await page
    .getByLabel("Search vehicle", { exact: true })
    .selectOption({ label: registration });
  await page.getByLabel("From", { exact: true }).fill("2026-01-01");
  await page.getByLabel("Through", { exact: true }).fill("2026-01-31");
  await expect(
    page
      .locator(".card")
      .filter({ hasText: /^Recognized revenue/ })
      .locator("strong"),
  ).toContainText("40,000.00");
  await expect(
    page
      .locator(".card")
      .filter({ hasText: "Cash collections" })
      .locator("strong"),
  ).toContainText("15,000.00");
  await expect(
    page.locator(".card").filter({ hasText: "Outstanding" }).locator("strong"),
  ).toContainText("25,000.00");
});

test("enabled reminders require configuration and preserve invalid form", async ({
  page,
}) => {
  await navigate(page, "Settings");
  await page.getByLabel("Enable reminders", { exact: true }).check();
  await page
    .getByLabel("Daily reminder time (Nairobi) (optional)", { exact: true })
    .fill("");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("alert")).toContainText("require a time");
  await expect(
    page.getByLabel("Enable reminders", { exact: true }),
  ).toBeChecked();
  await page
    .getByLabel("Daily reminder time (Nairobi) (optional)", { exact: true })
    .fill("08:00");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("alert")).toBeHidden();
  await expect(
    page.getByLabel("Enable reminders", { exact: true }),
  ).toBeChecked();
});

test("expired session retains form and resubmits after login", async ({
  page,
}) => {
  await navigate(page, "Customers");
  await page.getByRole("button", { name: "+ Add record" }).click();
  const name = `Retained ${Date.now()}`;
  await page.getByLabel("Name", { exact: true }).fill(name);
  await page.route(
    "**/api/v1/changes",
    async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ message: "Session expired" }),
      });
    },
    { times: 1 },
  );
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();
  await login(page);
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue(name);
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("cell", { name, exact: true })).toBeVisible();
});

test("portable export validates and imports idempotently", async ({ page }) => {
  await navigate(page, "Data & imports");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Create & download export" }).click();
  const downloaded = await pending;
  const path = await downloaded.path();
  expect(path).not.toBeNull();
  await page.getByLabel("Portable ZIP", { exact: true }).setInputFiles(path!);
  await page.getByRole("button", { name: "Validate package" }).click();
  await expect(page.locator("pre").first()).toContainText("packageHash");
  await page.getByRole("button", { name: "Commit validated import" }).click();
  await expect(page.locator(".success")).toContainText(
    "Import committed and reconciled.",
  );
});

test("mobile layout keeps navigation and dashboard within viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("heading", { name: "Fleet overview", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await navigate(page, "Customers");
  await expect(
    page.getByRole("heading", { name: "Customers", exact: true }),
  ).toBeVisible();
});
