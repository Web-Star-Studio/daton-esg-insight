import { expect, test } from "@playwright/test";

const protectedModuleRoutes: Array<{ route: string; label: string }> = [
  { route: "/social-esg", label: "Social" },
  { route: "/quality-dashboard", label: "Qualidade" },
  { route: "/fornecedores", label: "Fornecedores" },
];

for (const moduleRoute of protectedModuleRoutes) {
  test(`redirects unauthenticated users from ${moduleRoute.label} to /auth`, async ({
    page,
  }) => {
    await page.goto(moduleRoute.route);

    await expect(page).toHaveURL(/\/auth/);
    await expect(
      page.getByRole("heading", { name: "Bem-vindo de volta" }),
    ).toBeVisible();
  });
}
