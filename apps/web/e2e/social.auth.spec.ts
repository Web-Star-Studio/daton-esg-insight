import { expect, test } from "@playwright/test";

const hasAuthCreds = Boolean(process.env.E2E_EMAIL && process.env.E2E_PASSWORD);

test.describe("Social Module", () => {
  test.skip(
    !hasAuthCreds,
    "Set E2E_EMAIL and E2E_PASSWORD to run authenticated module tests.",
  );

  test("loads social dashboard shell", async ({ page }) => {
    await page.goto("/social-esg");

    await expect(page).toHaveURL(/\/social-esg/);
    await expect(
      page.getByRole("heading", { name: "ESG Social" }),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: "Visão Geral" }),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: "Impacto Social" }),
    ).toBeVisible();
  });
});
