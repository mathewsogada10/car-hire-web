import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

export async function login(page: Page) {
  await page
    .getByLabel("Password", { exact: true })
    .fill("carhire-browser-test-only");
  await page.getByRole("button", { name: "Sign in securely" }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome back." }),
  ).toBeHidden();
}

export async function navigate(page: Page, name: string) {
  const menu = page.getByRole("button", {
    name: "Open navigation menu",
    exact: true,
  });
  if (await menu.isVisible()) await menu.click();
  await page
    .getByRole("navigation")
    .getByRole("button", { name, exact: true })
    .click();
}
