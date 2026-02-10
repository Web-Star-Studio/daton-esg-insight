import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test as setup } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authDir = path.join(__dirname, ".auth");
const authFile = path.join(authDir, "user.json");

setup("authenticate", async ({ page }) => {
  fs.mkdirSync(authDir, { recursive: true });

  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  if (!email || !password) {
    // Keep tests runnable in CI/local without credentials.
    await page.context().storageState({ path: authFile });
    return;
  }

  await page.goto("/auth");

  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();

  await page.waitForURL((url) => !url.pathname.startsWith("/auth"), {
    timeout: 45_000,
  });
  await expect(page).not.toHaveURL(/\/auth/);

  await page.context().storageState({ path: authFile });
});
