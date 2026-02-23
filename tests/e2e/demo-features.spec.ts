import { expect, test, type Page } from "@playwright/test";

const SUPABASE_URL = "https://dqlvioijqzlvnvvajmft.supabase.co";
const SUPABASE_AUTH_STORAGE_KEY = "sb-dqlvioijqzlvnvvajmft-auth-token";

const DEMO_ESG_ROUTES = [
  "/demo",
  "/demo/dashboard",
  "/demo/gestao-esg",
  "/demo/quality-dashboard",
  "/demo/gestao-indicadores",
  "/demo/nao-conformidades",
  "/demo/acoes-corretivas",
  "/demo/controle-documentos",
  "/demo/mapeamento-processos",
  "/demo/planejamento-estrategico",
  "/demo/licenciamento",
  "/demo/laia",
  "/demo/social-esg",
  "/demo/gestao-funcionarios",
  "/demo/gestao-treinamentos",
  "/demo/seguranca-trabalho",
  "/demo/desenvolvimento-carreira",
  "/demo/descricao-cargos",
  "/demo/estrutura-organizacional",
  "/demo/avaliacao-eficacia",
  "/demo/monitoramento-esg",
  "/demo/monitoramento-agua",
  "/demo/monitoramento-energia",
  "/demo/monitoramento-emissoes",
  "/demo/monitoramento-residuos",
  "/demo/inventario-gee",
  "/demo/dashboard-ghg",
  "/demo/projetos-carbono",
  "/demo/residuos",
  "/demo/metas",
  "/demo/metas-sustentabilidade",
  "/demo/governanca-esg",
  "/demo/gestao-riscos",
  "/demo/compliance",
  "/demo/auditoria",
  "/demo/gestao-stakeholders",
  "/demo/analise-materialidade",
  "/demo/ativos",
] as const;

type MockUser = {
  id: string;
  email: string;
  fullName: string;
  role: "platform_admin" | "viewer";
  isApproved: boolean;
  companyId: string;
  companyName: string;
  hasCompletedOnboarding: boolean;
};

function buildSession(user: MockUser) {
  const nowIso = new Date().toISOString();
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 24;

  return {
    access_token: "pw-demo-access-token",
    refresh_token: "pw-demo-refresh-token",
    token_type: "bearer",
    expires_in: 60 * 60 * 24,
    expires_at: expiresAt,
    user: {
      id: user.id,
      aud: "authenticated",
      role: "authenticated",
      email: user.email,
      email_confirmed_at: nowIso,
      phone: "",
      confirmed_at: nowIso,
      last_sign_in_at: nowIso,
      app_metadata: {
        provider: "email",
        providers: ["email"],
      },
      user_metadata: {
        full_name: user.fullName,
        company_id: user.companyId,
        company_name: user.companyName,
      },
      identities: [],
      created_at: nowIso,
      updated_at: nowIso,
    },
  };
}

function postgrestPayload(
  headers: Record<string, string>,
  record: Record<string, unknown>,
) {
  const accept = headers.accept ?? "";
  const wantsObject = accept.includes("application/vnd.pgrst.object+json");
  return wantsObject ? record : [record];
}

async function mockAuthenticatedUser(page: Page, user: MockUser) {
  const session = buildSession(user);

  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, JSON.stringify(value));
    },
    { key: SUPABASE_AUTH_STORAGE_KEY, value: session },
  );

  await page.route(`${SUPABASE_URL}/**`, async (route) => {
    const request = route.request();
    const method = request.method();
    const headers = request.headers();
    const url = new URL(request.url());
    const { pathname } = url;

    const commonHeaders = {
      "access-control-allow-origin": "*",
      "content-type": "application/json",
    };

    if (method === "OPTIONS") {
      await route.fulfill({ status: 200, headers: commonHeaders, body: "{}" });
      return;
    }

    if (pathname === "/auth/v1/user") {
      await route.fulfill({
        status: 200,
        headers: commonHeaders,
        body: JSON.stringify(session.user),
      });
      return;
    }

    if (pathname === "/auth/v1/token") {
      await route.fulfill({
        status: 200,
        headers: commonHeaders,
        body: JSON.stringify(session),
      });
      return;
    }

    if (pathname === "/auth/v1/logout") {
      await route.fulfill({ status: 204, headers: commonHeaders, body: "" });
      return;
    }

    if (pathname.startsWith("/rest/v1/profiles")) {
      const profile = {
        id: user.id,
        full_name: user.fullName,
        job_title: "QA Analyst",
        role: user.role,
        is_approved: user.isApproved,
        has_completed_onboarding: user.hasCompletedOnboarding,
        company_id: user.companyId,
        email: user.email,
      };
      await route.fulfill({
        status: 200,
        headers: commonHeaders,
        body: JSON.stringify(postgrestPayload(headers, profile)),
      });
      return;
    }

    if (pathname.startsWith("/rest/v1/companies")) {
      const company = {
        id: user.companyId,
        name: user.companyName,
      };
      await route.fulfill({
        status: 200,
        headers: commonHeaders,
        body: JSON.stringify(postgrestPayload(headers, company)),
      });
      return;
    }

    if (pathname.startsWith("/rest/v1/user_roles")) {
      await route.fulfill({
        status: 200,
        headers: commonHeaders,
        body: JSON.stringify(postgrestPayload(headers, { role: user.role })),
      });
      return;
    }

    if (pathname.startsWith("/rest/v1/")) {
      const accept = headers.accept ?? "";
      const wantsObject = accept.includes("application/vnd.pgrst.object+json");
      await route.fulfill({
        status: 200,
        headers: commonHeaders,
        body: JSON.stringify(wantsObject ? {} : []),
      });
      return;
    }

    await route.continue();
  });
}

function collectRuntimeErrors(page: Page) {
  const errors: string[] = [];
  const runtimePattern =
    /(TypeError|ReferenceError|SyntaxError|Cannot read properties|is not a function| is undefined)/i;

  const onPageError = (error: Error) => {
    errors.push(`pageerror: ${error.message}`);
  };

  const onConsole = (msg: { type(): string; text(): string }) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (runtimePattern.test(text)) {
      errors.push(`console: ${text}`);
    }
  };

  page.on("pageerror", onPageError);
  page.on("console", onConsole);

  return {
    errors,
    detach: () => {
      page.off("pageerror", onPageError);
      page.off("console", onConsole);
    },
  };
}

test.describe("Demo route access", () => {
  const users: MockUser[] = [
    {
      id: "pw-platform-admin",
      email: "platform.admin@example.com",
      fullName: "Platform Admin",
      role: "platform_admin",
      isApproved: true,
      companyId: "demo-company-001",
      companyName: "Demo Company",
      hasCompletedOnboarding: true,
    },
    {
      id: "pw-viewer",
      email: "viewer@example.com",
      fullName: "Viewer User",
      role: "viewer",
      isApproved: false,
      companyId: "demo-company-001",
      companyName: "Demo Company",
      hasCompletedOnboarding: false,
    },
  ];

  for (const user of users) {
    test(`/demo is accessible in dev for account role=${user.role}`, async ({ page }) => {
      await mockAuthenticatedUser(page, user);

      await page.goto("/demo", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1200);

      const currentPath = new URL(page.url()).pathname;
      expect(currentPath).toContain("/demo");
      expect(currentPath.startsWith("/auth")).toBeFalsy();
    });
  }
});

test("all /demo ESG routes open without runtime errors", async ({ page }) => {
  test.setTimeout(10 * 60 * 1000);

  const user: MockUser = {
    id: "pw-esg-viewer",
    email: "esg.viewer@example.com",
    fullName: "ESG Viewer",
    role: "viewer",
    isApproved: false,
    companyId: "demo-company-001",
    companyName: "Demo Company",
    hasCompletedOnboarding: true,
  };

  await mockAuthenticatedUser(page, user);

  const failures: string[] = [];

  for (const routePath of DEMO_ESG_ROUTES) {
    const tracker = collectRuntimeErrors(page);

    try {
      await page.goto(routePath, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await page.waitForTimeout(1200);

      const currentPath = new URL(page.url()).pathname;
      if (currentPath.startsWith("/auth")) {
        failures.push(`${routePath} -> redirected to /auth`);
      }
      if (currentPath.includes("404")) {
        failures.push(`${routePath} -> navigated to 404 (${currentPath})`);
      }

      const visibleErrorBoundary = await page
        .locator("text=/TypeError|ReferenceError|Algo deu errado|An error occurred/i")
        .count();
      if (visibleErrorBoundary > 0) {
        failures.push(`${routePath} -> visible error boundary/message in UI`);
      }

      if (tracker.errors.length > 0) {
        failures.push(`${routePath} -> ${tracker.errors.join(" | ")}`);
      }
    } catch (error) {
      failures.push(`${routePath} -> navigation failed: ${(error as Error).message}`);
    } finally {
      tracker.detach();
    }
  }

  expect(
    failures,
    failures.length
      ? `Routes with runtime/navigation failures:\n${failures.join("\n")}`
      : "No failures",
  ).toEqual([]);
});
