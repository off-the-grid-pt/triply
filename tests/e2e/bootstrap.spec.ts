import { expect, test } from "@playwright/test";

test("Triply shell loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Triply", { exact: true })).toBeVisible();
});
