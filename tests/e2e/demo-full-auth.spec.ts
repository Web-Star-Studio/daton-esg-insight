/**
 * E2E: Full demo route smoke tests with REAL authentication.
 *
 * Strategy:
 *  - Login once via the UI, reuse the same browser context.
 *  - Each route gets a fresh page.goto() (equivalent to F5) to avoid
 *    error-boundary leakage between pages.
 *  - Collects runtime errors (TypeError, ReferenceError, etc.) from
 *    console and pageerror events.
 *  - Runs ALL routes and reports every failure at the end.
 */
import { test, expect, type Page } from "@playwright/test";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const AUTH_EMAIL = "joaopedrobatista010@gmail.com";
const AUTH_PASSWORD = "ZPTCgPsuWQ#Yv?6o";

const WAIT_AFTER_NAV = 2_500;
const NAV_TIMEOUT = 60_000;

/* ------------------------------------------------------------------ */
/*  All demo routes organized by module                                */
/* ------------------------------------------------------------------ */

const ROUTE_GROUPS: Record<string, string[]> = {
  "Core / Qualidade": [
    "/demo",
    "/demo/dashboard",
    "/demo/gestao-esg",
    "/demo/quality-dashboard",
    "/demo/matriz-partes-interessadas",
    "/demo/gestao-indicadores",
    "/demo/nao-conformidades",
    "/demo/acoes-corretivas",
    "/demo/controle-documentos",
    "/demo/mapeamento-processos",
    "/demo/planejamento-estrategico",
    "/demo/licenciamento",
    "/demo/licenciamento/legislacoes",
    "/demo/laia",
  ],
  Fornecedores: [
    "/demo/fornecedores/dashboard",
    "/demo/fornecedores/cadastro",
    "/demo/fornecedores/avaliacoes",
    "/demo/fornecedores/conexoes",
    "/demo/fornecedores/indicadores",
    "/demo/fornecedores/documentacao",
    "/demo/fornecedores/tipos",
    "/demo/fornecedores/categorias",
    "/demo/fornecedores/treinamentos",
    "/demo/fornecedores/entregas",
    "/demo/fornecedores/falhas",
    "/demo/fornecedores/criterios-avaliacao",
    "/demo/fornecedores/importar-exportar",
    "/demo/fornecedores/associacao-documentos",
    "/demo/fornecedores/leituras-obrigatorias",
    "/demo/fornecedores/pesquisas",
  ],
  "Social / RH": [
    "/demo/social-esg",
    "/demo/gestao-funcionarios",
    "/demo/gestao-treinamentos",
    "/demo/seguranca-trabalho",
    "/demo/desenvolvimento-carreira",
    "/demo/descricao-cargos",
    "/demo/estrutura-organizacional",
    "/demo/avaliacao-eficacia",
  ],
  Ambiental: [
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
  ],
  Governanca: [
    "/demo/governanca-esg",
    "/demo/gestao-riscos",
    "/demo/compliance",
    "/demo/auditoria",
    "/demo/gestao-stakeholders",
    "/demo/analise-materialidade",
  ],
  Financeiro: [
    "/demo/financeiro/dashboard",
    "/demo/financeiro/plano-contas",
    "/demo/financeiro/lancamentos-contabeis",
    "/demo/financeiro/contas-pagar",
    "/demo/financeiro/contas-receber",
    "/demo/financeiro/aprovacoes",
    "/demo/financeiro/esg-dashboard",
    "/demo/financeiro/orcamento",
    "/demo/financeiro/fluxo-caixa",
    "/demo/financeiro/centros-custo",
    "/demo/financeiro/relatorios",
    "/demo/financeiro/rentabilidade",
    "/demo/financeiro/residuos/contas-a-pagar",
    "/demo/financeiro/residuos/contas-a-receber",
  ],
  "Dados e Relatorios": [
    "/demo/coleta-dados",
    "/demo/documentos",
    "/demo/relatorios-integrados",
    "/demo/sdg-dashboard",
    "/demo/indicadores-recomendados",
    "/demo/ativos",
  ],
  Configuracoes: [
    "/demo/configuracao",
    "/demo/configuracao-organizacional",
    "/demo/ajuda",
    "/demo/gestao-filiais",
    "/demo/biblioteca-fatores",
    "/demo/gestao-usuarios",
    "/demo/formularios-customizados",
    "/demo/listas-de-envio",
    "/demo/system-status",
  ],
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function collectRuntimeErrors(page: Page) {
  const errors: string[] = [];
  const runtimePattern =
    /(TypeError|ReferenceError|SyntaxError|Cannot read properties|is not a function|is undefined)/i;
  const ignoredPatterns = [
    /TypeError:\s*Failed to fetch/i,
    /Error in getCurrentUser/i,
    /Error fetching user data/i,
    /Erro ao buscar permissões/i,
    /ResizeObserver loop/i,
    /Loading chunk/i,
  ];

  const onPageError = (error: Error) => {
    const msg = error.message;
    if (ignoredPatterns.some((p) => p.test(msg))) return;
    const stackPreview = error.stack
      ? ` | ${error.stack.split("\n").slice(0, 2).join(" | ")}`
      : "";
    errors.push(`pageerror: ${msg}${stackPreview}`);
  };

  const onConsole = (consoleMsg: { type(): string; text(): string }) => {
    if (consoleMsg.type() !== "error") return;
    const text = consoleMsg.text();
    if (ignoredPatterns.some((p) => p.test(text))) return;
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

async function checkRoute(
  page: Page,
  routePath: string,
): Promise<string[]> {
  const failures: string[] = [];
  const tracker = collectRuntimeErrors(page);

  try {
    await page.goto(routePath, {
      waitUntil: "domcontentloaded",
      timeout: NAV_TIMEOUT,
    });
    await page.waitForTimeout(WAIT_AFTER_NAV);

    const currentPath = new URL(page.url()).pathname;

    if (currentPath.startsWith("/auth")) {
      failures.push(`redirected to /auth (session expired?)`);
      return failures;
    }

    if (
      currentPath === "/demo" &&
      routePath !== "/demo" &&
      routePath !== "/demo/metas-sustentabilidade"
    ) {
      failures.push(`caught by catch-all -> redirected to /demo`);
    }

    const errorBoundary = await page
      .locator(
        "text=/TypeError|ReferenceError|Algo deu errado|An error occurred|Something went wrong/i",
      )
      .count();
    if (errorBoundary > 0) {
      failures.push(`visible error boundary in the UI`);
    }

    if (tracker.errors.length > 0) {
      failures.push(...tracker.errors);
    }
  } catch (error) {
    failures.push(`navigation failed: ${(error as Error).message}`);
  } finally {
    tracker.detach();
  }

  return failures;
}

/* ------------------------------------------------------------------ */
/*  Single mega-test: login once, check every route, report at end     */
/* ------------------------------------------------------------------ */

test("All demo routes — real auth, page-by-page", async ({ browser }) => {
  test.setTimeout(20 * 60 * 1000); // 20 min

  // ---- Login ----
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("/auth", { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT });
  await page.waitForTimeout(1500);

  await page.locator("#login-email").fill(AUTH_EMAIL);
  await page.locator("#login-password").fill(AUTH_PASSWORD);
  await page.getByRole("button", { name: /entrar|login|acessar/i }).click();

  await page.waitForURL((url) => !url.pathname.startsWith("/auth"), {
    timeout: 30_000,
  });
  await page.waitForTimeout(2000);

  const loginUrl = new URL(page.url()).pathname;
  expect(loginUrl.startsWith("/auth"), "Login should redirect away from /auth").toBeFalsy();
  console.log(`✓ Login successful — landed on ${loginUrl}`);

  // ---- Check all routes ----
  const allFailures: Record<string, string[]> = {};
  const totalRoutes = Object.values(ROUTE_GROUPS).flat().length;
  let checked = 0;
  let passed = 0;

  for (const [groupName, routes] of Object.entries(ROUTE_GROUPS)) {
    console.log(`\n── ${groupName} (${routes.length} routes) ──`);

    for (const route of routes) {
      checked++;
      const failures = await checkRoute(page, route);

      if (failures.length > 0) {
        allFailures[route] = failures;
        console.log(`  ✘ ${route}`);
        for (const f of failures) console.log(`    → ${f}`);
      } else {
        passed++;
        console.log(`  ✓ ${route}`);
      }
    }
  }

  // ---- Final report ----
  await page.close();
  await context.close();

  const failedCount = Object.keys(allFailures).length;
  console.log(`\n${"═".repeat(60)}`);
  console.log(`RESULT: ${passed}/${totalRoutes} passed, ${failedCount} failed`);
  console.log(`${"═".repeat(60)}`);

  if (failedCount > 0) {
    const report = Object.entries(allFailures)
      .map(([route, errs]) => `  ${route}:\n    - ${errs.join("\n    - ")}`)
      .join("\n");
    console.log(`\nFailed routes:\n${report}`);

    // Use soft assertion so the full report is visible
    expect(
      failedCount,
      `${failedCount}/${totalRoutes} routes failed:\n${report}`,
    ).toBe(0);
  }
});
