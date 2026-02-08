import { expect, test } from "@playwright/test";

const hasAuthCreds = Boolean(process.env.E2E_EMAIL && process.env.E2E_PASSWORD);

test.describe("Suppliers Module", () => {
  test.skip(
    !hasAuthCreds,
    "Set E2E_EMAIL and E2E_PASSWORD to run authenticated module tests.",
  );

  test("loads suppliers page and opens create modal", async ({ page }) => {
    await page.goto("/fornecedores");

    await expect(page).toHaveURL(/\/fornecedores/);
    await expect(
      page.getByRole("heading", { name: "Gestão de Fornecedores" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Adicionar Fornecedor" }).click();
    await expect(
      page.getByRole("heading", { name: "Novo Fornecedor - Escopo 3" }),
    ).toBeVisible();
  });
});
