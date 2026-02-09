import { expect, test } from "@playwright/test";

const hasAuthCreds = Boolean(process.env.E2E_EMAIL && process.env.E2E_PASSWORD);

test.describe("Quality Module", () => {
  test.skip(
    !hasAuthCreds,
    "Set E2E_EMAIL and E2E_PASSWORD to run authenticated module tests.",
  );

  test("loads quality dashboard shell", async ({ page }) => {
    await page.goto("/quality-dashboard");

    await expect(page).toHaveURL(/\/quality-dashboard/);
    await expect(
      page.getByRole("heading", { name: "Sistema de Gestão da Qualidade" }),
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: /Visão Geral|Geral/ }),
    ).toBeVisible();
    await expect(page.getByRole("tab", { name: /Indicadores|KPIs/ })).toBeVisible();
  });

  test("loads non-conformities page and opens create dialog", async ({ page }) => {
    await page.goto("/nao-conformidades");

    await expect(page).toHaveURL(/\/nao-conformidades/);
    await expect(
      page.getByRole("heading", { name: "Não Conformidades" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Registrar NC" }).click();
    await expect(
      page.getByRole("heading", { name: "Registrar Não Conformidade" }),
    ).toBeVisible();
  });
});
