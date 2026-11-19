import { test, expect } from "@playwright/test";
import { login, navigate } from "./helpers";

test("light and dark themes apply immediately, retain drafts and survive reload/sign-out", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await login(page);
  await navigate(page, "Settings");
  const reminderTime = page.getByLabel(
    "Daily reminder time (Nairobi) (optional)",
    { exact: true },
  );
  await reminderTime.fill("09:37");
  let businessWrites = 0;
  page.on("request", (request) => {
    if (
      request.method() === "POST" &&
      new URL(request.url()).pathname === "/api/v1/changes"
    )
      businessWrites++;
  });
  const theme = page.getByRole("combobox", { name: "Theme", exact: true });
  await theme.selectOption("light");
  await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
  await expect(page.locator(".editor")).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
  await theme.selectOption("dark");
  await expect(page.locator("html")).toHaveCSS(
    "background-color",
    "rgb(16, 28, 24)",
  );
  await expect(page.locator(".editor")).toHaveCSS(
    "background-color",
    "rgb(24, 43, 38)",
  );
  await expect(reminderTime).toHaveValue("09:37");
  expect(businessWrites).toBe(0);
  await page.reload();
  await expect(
    page.getByRole("combobox", { name: "Theme", exact: true }),
  ).toHaveValue("dark");
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeVisible();
  await expect(page.locator(".login .dialog")).toHaveCSS(
    "background-color",
    "rgb(24, 43, 38)",
  );
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await login(page);
  await expect(
    page.getByRole("combobox", { name: "Theme", exact: true }),
  ).toHaveValue("dark");
});

test("system appearance follows device changes and theme choices synchronize between tabs", async ({
  page,
  context,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await login(page);
  await navigate(page, "Settings");
  const theme = page.getByRole("combobox", { name: "Theme", exact: true });
  await expect(theme).toHaveValue("system");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await theme.selectOption("light");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await theme.selectOption("system");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const other = await context.newPage();
  await other.emulateMedia({ colorScheme: "light" });
  await other.goto("/?view=settings");
  await expect(other.locator("html")).toHaveAttribute("data-theme", "light");
  await other
    .getByRole("combobox", { name: "Theme", exact: true })
    .selectOption("dark");
  await expect(theme).toHaveValue("dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await theme.selectOption("system");
  await expect(
    other.getByRole("combobox", { name: "Theme", exact: true }),
  ).toHaveValue("system");
  await expect(other.locator("html")).toHaveAttribute("data-theme", "light");
});

test("blocked theme storage is reported and the current tab still changes appearance", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.addInitScript(() => {
    const read = Storage.prototype.getItem;
    const write = Storage.prototype.setItem;
    Storage.prototype.getItem = function (key) {
      if (key === "carhire.theme")
        throw new DOMException("Test storage denial", "SecurityError");
      return read.call(this, key);
    };
    Storage.prototype.setItem = function (key, value) {
      if (key === "carhire.theme")
        throw new DOMException("Test storage denial", "SecurityError");
      return write.call(this, key, value);
    };
  });
  await page.goto("/");
  await login(page);
  await navigate(page, "Settings");
  await expect(page.getByRole("alert")).toContainText(
    "Theme storage is unavailable",
  );
  await page
    .getByRole("combobox", { name: "Theme", exact: true })
    .selectOption("dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("alert")).toContainText("could not be saved");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});
