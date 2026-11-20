import { expect, test } from "@playwright/test";
import { login, navigate } from "./helpers";

test("phone menu reaches every section and keeps sign out visible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await login(page);
  const trigger = page.getByRole("button", {
    name: "Open navigation menu",
    exact: true,
  });
  const menu = page.getByRole("dialog", { name: "Navigation menu" });
  await expect(page.locator(".desktop-sidebar")).toBeHidden();
  await expect(trigger).toBeVisible();
  await trigger.click();
  await expect(page.locator(".navigation-toggle")).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  const nav = menu.getByRole("navigation", { name: "Main navigation" });
  const titles = await nav.getByRole("button").allTextContents();
  expect(titles).not.toContain("Calendar");
  expect(titles).toEqual(
    expect.arrayContaining([
      "Customers",
      "Hires",
      "Settings",
      "Data & imports",
    ]),
  );
  for (const title of titles) {
    await nav.getByRole("button", { name: title, exact: true }).click();
    await expect(menu).toBeHidden();
    await expect(page.locator("header")).toContainText(title);
    await expect(
      page.getByRole("heading", { name: "Page not found" }),
    ).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await trigger.click();
    await expect(
      nav.getByRole("button", { name: title, exact: true }),
    ).toHaveAttribute("aria-current", "page");
  }
  const signOut = menu.getByRole("button", { name: "Sign out", exact: true });
  await expect(signOut).toBeInViewport();
  await signOut.click();
  await expect(menu).toBeHidden();
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();
});

test("phone record actions remain visible without discovering a horizontal scroll", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/");
  await login(page);
  await navigate(page, "Customers");
  await page.getByRole("button", { name: "+ Add record", exact: true }).click();
  const name = `Navigation customer ${Date.now()}`;
  await page.getByLabel("Name", { exact: true }).fill(name);
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  const table = page.getByRole("region", {
    name: "Customers records",
    exact: true,
  });
  await expect(table).toBeVisible();
  await table.scrollIntoViewIfNeeded();
  const row = table.getByRole("row").filter({ hasText: name });
  await expect(
    row.getByRole("button", { name: "Open", exact: true }),
  ).toBeInViewport();
  await expect(
    row.getByRole("button", { name: "Delete", exact: true }),
  ).toBeInViewport();
  expect(await table.evaluate((element) => element.scrollLeft)).toBe(0);
  await row.getByRole("button", { name: "Open", exact: true }).click();
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue(name);
});

test("desktop and tablet menus preserve drafts, keyboard dismissal and resize access", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 480 });
  await page.goto("/");
  await login(page);
  await navigate(page, "Settings");
  const time = page.getByLabel("Daily reminder time (Nairobi) (optional)", {
    exact: true,
  });
  await time.fill("09:43");
  await expect(
    page.getByRole("button", { name: "Sign out", exact: true }),
  ).toBeInViewport();
  await page.setViewportSize({ width: 768, height: 600 });
  const trigger = page.getByRole("button", {
    name: "Open navigation menu",
    exact: true,
  });
  const menu = page.getByRole("dialog", { name: "Navigation menu" });
  await trigger.click();
  await expect(
    menu.getByRole("button", { name: "Close navigation menu", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(time).toHaveValue("09:43");
  await navigate(page, "Settings");
  await expect(menu).toBeHidden();
  await expect(time).toHaveValue("09:43");
  await trigger.click();
  await menu
    .getByRole("button", { name: "Close navigation menu", exact: true })
    .click();
  await expect(menu).toBeHidden();
  await trigger.click();
  await page.setViewportSize({ width: 1280, height: 720 });
  await expect(menu).toBeHidden();
  await expect(trigger).toBeHidden();
  await expect(
    page
      .getByRole("navigation")
      .getByRole("button", { name: "Settings", exact: true }),
  ).toBeVisible();
  await expect(time).toHaveValue("09:43");
});
