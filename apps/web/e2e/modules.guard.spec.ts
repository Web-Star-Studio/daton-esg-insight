import { expect, test } from "@playwright/test";

const moduleRoutes: Array<{ route: string; label: string; heading: string }> = [
  { route: "/social-esg", label: "Social", heading: "ESG Social" },
  {
    route: "/quality-dashboard",
    label: "Qualidade",
    heading: "Sistema de Gestão da Qualidade",
  },
  {
    route: "/fornecedores",
    label: "Fornecedores",
    heading: "Gestão de Fornecedores",
  },
];

for (const moduleRoute of moduleRoutes) {
  test(`loads ${moduleRoute.label} route (auth redirect or module shell)`, async ({
    page,
  }) => {
    await page.goto(moduleRoute.route);

    await expect.poll(() => new URL(page.url()).pathname, {
      timeout: 20_000,
    }).toMatch(new RegExp(`^(${moduleRoute.route}|/auth)$`));

    const authHeading = page.getByRole("heading", { name: "Bem-vindo de volta" });
    const moduleHeading = page.getByRole("heading", { name: moduleRoute.heading });

    await expect.poll(
      async () => {
        if (await authHeading.isVisible().catch(() => false)) {
          return "auth";
        }

        if (await moduleHeading.isVisible().catch(() => false)) {
          return "module";
        }

        return "pending";
      },
      { timeout: 20_000 },
    ).toMatch(/^(auth|module)$/);
  });
}
