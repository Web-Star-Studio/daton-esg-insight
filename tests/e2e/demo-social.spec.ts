import { expect, test, type Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const SUPABASE_URL = "https://dqlvioijqzlvnvvajmft.supabase.co";
const SUPABASE_AUTH_STORAGE_KEY = "sb-dqlvioijqzlvnvvajmft-auth-token";

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

const DEMO_USER: MockUser = {
  id: "pw-social-viewer",
  email: "social.viewer@example.com",
  fullName: "Social Viewer",
  role: "platform_admin",
  isApproved: true,
  companyId: "demo-company-001",
  companyName: "Demo Company",
  hasCompletedOnboarding: true,
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
  const ignoredConsolePatterns = [
    /TypeError:\s*Failed to fetch/i,
    /Error in getCurrentUser Erro ao buscar permissões/i,
    /Error fetching user data Erro ao buscar permissões/i,
  ];

  const onPageError = (error: Error) => {
    const stackPreview = error.stack
      ? ` | stack: ${error.stack.split("\n").slice(0, 2).join(" | ")}`
      : "";
    errors.push(`pageerror: ${error.message}${stackPreview}`);
  };

  const onConsole = (msg: { type(): string; text(): string }) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (ignoredConsolePatterns.some((pattern) => pattern.test(text))) return;
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

async function openDemoRoute(page: Page, path: string) {
  await mockAuthenticatedUser(page, DEMO_USER);
  await page.goto(path, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await page.waitForTimeout(1200);
  const currentPath = new URL(page.url()).pathname;
  expect(currentPath.startsWith("/auth")).toBeFalsy();
  expect(currentPath).toBe(path);
}

test("social-esg shows mocked dashboard data", async ({ page }) => {
  const tracker = collectRuntimeErrors(page);
  try {
    await openDemoRoute(page, "/demo/social-esg");
    await expect(page.getByRole("heading", { name: "ESG Social" })).toBeVisible();
    await expect(page.getByText("Gestão de Colaboradores")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Funcionários" })).toBeVisible();
    await expect(page.getByText("Projetos Sociais")).toBeVisible();
    await expect(page.getByText("Nenhum projeto cadastrado")).not.toBeVisible();
    expect(tracker.errors).toEqual([]);
  } finally {
    tracker.detach();
  }
});

test("descricao-cargos shows mocked positions", async ({ page }) => {
  const tracker = collectRuntimeErrors(page);
  try {
    await openDemoRoute(page, "/demo/descricao-cargos");
    await expect(page.getByRole("heading", { name: "Gestão de Cargos" })).toBeVisible();
    await expect(page.getByText("Diretor(a) Geral")).toBeVisible();
    await expect(page.getByText("Nenhum cargo encontrado")).not.toBeVisible();
    expect(tracker.errors).toEqual([]);
  } finally {
    tracker.detach();
  }
});

test("estrutura-organizacional shows mocked hierarchy", async ({ page }) => {
  const tracker = collectRuntimeErrors(page);
  try {
    await openDemoRoute(page, "/demo/estrutura-organizacional");
    await expect(page.getByRole("heading", { name: "Estrutura Organizacional" })).toBeVisible();
    await expect(page.getByText("Juliana Lima")).toBeVisible();
    await expect(page.getByText("Nenhuma estrutura organizacional definida")).not.toBeVisible();
    expect(tracker.errors).toEqual([]);
  } finally {
    tracker.detach();
  }
});

test("gestao-funcionarios uses mocked employees and benefits", async ({ page }) => {
  const tracker = collectRuntimeErrors(page);
  try {
    await openDemoRoute(page, "/demo/gestao-funcionarios");
    await expect(page.getByRole("heading", { name: "Gestão de Colaboradores" })).toBeVisible();
    await page.getByRole("tab", { name: "Benefícios" }).click();
    await expect(page.getByText("Plano de Saúde")).toBeVisible();
    await expect(page.getByText("Nenhum benefício cadastrado")).not.toBeVisible();
    expect(tracker.errors).toEqual([]);
  } finally {
    tracker.detach();
  }
});

test("seguranca-trabalho shows mocked incidents and inspections", async ({ page }) => {
  const tracker = collectRuntimeErrors(page);
  try {
    await openDemoRoute(page, "/demo/seguranca-trabalho");
    await expect(page.getByRole("heading", { name: "Segurança do Trabalho" })).toBeVisible();
    await page.getByRole("tab", { name: "Incidentes" }).click();
    await expect(page.getByText("Quase Acidente")).toBeVisible();
    await expect(page.getByText("Nenhum incidente registrado ainda")).not.toBeVisible();
    expect(tracker.errors).toEqual([]);
  } finally {
    tracker.detach();
  }
});

test("gestao-treinamentos shows mocked training programs", async ({ page }) => {
  const tracker = collectRuntimeErrors(page);
  try {
    await openDemoRoute(page, "/demo/gestao-treinamentos");
    await expect(page.getByRole("heading", { name: "Gestão de Treinamentos" })).toBeVisible();
    await page.getByRole("tab", { name: "Programas" }).click();
    await expect(page.getByText("NR-12 Segurança em Máquinas")).toBeVisible();
    await expect(page.getByText("Nenhum programa encontrado")).not.toBeVisible();
    expect(tracker.errors).toEqual([]);
  } finally {
    tracker.detach();
  }
});

test("avaliacao-eficacia shows mocked pending evaluations", async ({ page }) => {
  const tracker = collectRuntimeErrors(page);
  try {
    await openDemoRoute(page, "/demo/avaliacao-eficacia");
    await expect(page.getByRole("heading", { name: "Avaliação de Eficácia" })).toBeVisible();
    await expect(page.getByText("NR-12 Segurança em Máquinas")).toBeVisible();
    await expect(page.getByText("Nenhum treinamento encontrado")).not.toBeVisible();
    expect(tracker.errors).toEqual([]);
  } finally {
    tracker.detach();
  }
});

test("desenvolvimento-carreira shows mocked plans", async ({ page }) => {
  const tracker = collectRuntimeErrors(page);
  try {
    await openDemoRoute(page, "/demo/desenvolvimento-carreira");
    await expect(page.getByRole("heading", { name: "Desenvolvimento de Carreira" })).toBeVisible();
    await page.getByRole("tab", { name: "PDIs" }).click();
    await expect(page.getByText("Mariana Costa")).toBeVisible();
    await expect(page.getByText("Nenhum PDI encontrado")).not.toBeVisible();
    expect(tracker.errors).toEqual([]);
  } finally {
    tracker.detach();
  }
});
