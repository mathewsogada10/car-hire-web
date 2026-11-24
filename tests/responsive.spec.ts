import { expect, test } from "@playwright/test";
import { login, navigate } from "./helpers";

test("dashboard, financial chart, forms and tools fit phone, tablet and desktop breakpoints", async ({
  page,
}) => {
  await page.route("**/api/v1/reports?**", (route) =>
    route.fulfill({
      json: {
        recognizedMinor: 999999999999999,
        collectionsMinor: 0,
        outstandingMinor: 0,
        expectedProfitMinor: 0,
        cashProfitMinor: 0,
        accruedExpensesMinor: 0,
        cashExpensesMinor: 0,
        depositCashMinor: 0,
        balances: [],
        dateBasis: {},
      },
    }),
  );
  await page.goto("/");
  await login(page);
  for (const width of [320, 390, 580, 768, 850, 851, 1024, 1440]) {
    await page.setViewportSize({ width, height: 720 });
    for (const name of [
      "Overview",
      "Financial report",
      "Hires",
      "Expenses",
      "Data & imports",
      "Settings",
    ]) {
      await navigate(page, name);
      await expect(page.locator("header")).toContainText(name);
      if (name === "Overview")
        await expect(page.locator(".card").first()).toBeVisible();
      if (name === "Financial report")
        await expect(
          page.getByRole("img", { name: /Monthly financial trend/ }),
        ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        `${name} fits ${width}px`,
      ).toBe(true);
      if (name === "Expenses" || name === "Hires") {
        await page
          .getByRole("button", {
            name: name === "Hires" ? "+ Add hire" : "+ Add record",
            exact: true,
          })
          .click();
        await expect(page.locator(".editor")).toBeVisible();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
          `${name} form fits ${width}px`,
        ).toBe(true);
        await page.getByRole("button", { name: "Cancel", exact: true }).click();
      }
    }
  }
  await page.setViewportSize({ width: 320, height: 320 });
  await page
    .getByRole("button", { name: "Open navigation menu", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Navigation menu" })
    .getByRole("button", { name: "Sign out", exact: true })
    .click();
  const dialog = page.locator(".login .dialog");
  await expect(dialog).toBeVisible();
  const bounds = (await dialog.boundingBox())!;
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(320);
  await login(page);
});
