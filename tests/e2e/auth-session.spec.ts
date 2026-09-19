import { expect, test } from "@playwright/test";

test("legacy verification screen leads to sign-in without a resend loop", async ({ page }) => {
  await page.goto("/auth/verify");
  await expect(page).toHaveURL(/\/auth\/sign-in$/);
  await expect(page.getByRole("heading", { name: "Iniciar sessão" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Reenviar/ })).toHaveCount(0);
});

test("invalid legacy email links retain a recovery path", async ({ page }) => {
  await page.goto("/auth/verify?error=invalid");
  await expect(page).toHaveURL(/\/auth\/sign-in\?link=invalid$/);
  await expect(page.getByRole("alert")).toContainText("inválida ou expirou");
  await expect(page.getByRole("link", { name: "Esqueci-me da palavra-passe" })).toHaveAttribute("href", "/auth/forgot-password");
});
