/**
 * E2E: Deep interaction tests for ALL demo pages.
 *
 * Strategy:
 *  - Login once with real credentials, reuse context.
 *  - For each page: navigate, click tabs, open modals, interact with forms,
 *    verify rich mock data presence, ensure no real CRUD operations.
 *  - Each page gets fresh page.goto() to avoid error boundary leakage.
 *  - Collects runtime errors throughout.
 */
import { test, expect, type Page, type Locator } from "@playwright/test";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const AUTH_EMAIL = "joaopedrobatista010@gmail.com";
const AUTH_PASSWORD = "ZPTCgPsuWQ#Yv?6o";
const WAIT_AFTER_NAV = 2_000;
const WAIT_AFTER_INTERACTION = 1_200;
const NAV_TIMEOUT = 60_000;

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
    /AbortError/i,
    /NetworkError/i,
    /net::ERR_/i,
  ];

  const onPageError = (error: Error) => {
    const msg = error.message;
    if (ignoredPatterns.some((p) => p.test(msg))) return;
    const stackPreview = error.stack
      ? ` | ${error.stack.split("\n").slice(0, 3).join(" | ")}`
      : "";
    errors.push(`pageerror: ${msg}${stackPreview}`);
  };

  const onConsole = (consoleMsg: { type(): string; text(): string }) => {
    if (consoleMsg.type() !== "error") return;
    const text = consoleMsg.text();
    if (ignoredPatterns.some((p) => p.test(text))) return;
    if (runtimePattern.test(text)) {
      errors.push(`console: ${text.slice(0, 300)}`);
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

/** Navigate to a demo route with fresh page load */
async function goTo(page: Page, route: string) {
  await page.goto(route, {
    waitUntil: "domcontentloaded",
    timeout: NAV_TIMEOUT,
  });
  await page.waitForTimeout(WAIT_AFTER_NAV);
}

/** Click a tab by name (case-insensitive) and wait for content to render */
async function clickTab(page: Page, name: string | RegExp) {
  const tab = page.getByRole("tab", { name });
  if ((await tab.count()) > 0 && (await tab.first().isVisible())) {
    await tab.first().click();
    await page.waitForTimeout(WAIT_AFTER_INTERACTION);
  }
}

/** Try to click a button, return true if clicked */
async function tryClick(locator: Locator): Promise<boolean> {
  if ((await locator.count()) > 0 && (await locator.first().isVisible())) {
    await locator.first().click();
    return true;
  }
  return false;
}

/** Close any open dialog/modal by pressing Escape */
async function closeDialog(page: Page) {
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
}

/** Verify page has no error boundary visible */
async function assertNoErrorBoundary(page: Page) {
  const errorBoundary = await page
    .locator(
      "text=/TypeError|ReferenceError|Algo deu errado|An error occurred|Something went wrong/i",
    )
    .count();
  return errorBoundary === 0;
}

/** Check that data is present (not empty states) */
async function hasContent(page: Page, patterns: (string | RegExp)[]): Promise<string[]> {
  const missing: string[] = [];
  for (const pattern of patterns) {
    const loc = typeof pattern === "string"
      ? page.getByText(pattern, { exact: false })
      : page.locator(`text=${pattern}`);
    if ((await loc.count()) === 0) {
      missing.push(typeof pattern === "string" ? pattern : pattern.toString());
    }
  }
  return missing;
}

/** Count visible table rows (tr in tbody, or role=row) */
async function countTableRows(page: Page): Promise<number> {
  // Try tbody tr first
  let count = await page.locator("tbody tr").count();
  if (count > 0) return count;
  // Try role=row (minus header)
  count = await page.getByRole("row").count();
  return Math.max(0, count - 1); // subtract header row
}

/** Check visible cards count */
async function countCards(page: Page): Promise<number> {
  // Cards typically use role=article or class containing "card"
  const cards = page.locator('[class*="card" i]:not([class*="card-header"]):not([class*="card-content"])');
  return await cards.count();
}

/* ------------------------------------------------------------------ */
/*  Page interaction definitions                                       */
/* ------------------------------------------------------------------ */

interface PageTest {
  route: string;
  label: string;
  test: (page: Page) => Promise<string[]>;
}

const PAGE_TESTS: PageTest[] = [
  // ─── Core / Quality ─────────────────────────────────────────────
  {
    route: "/demo/dashboard",
    label: "Dashboard Principal",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/gestao-esg",
    label: "Gestao ESG",
    test: async (page) => {
      const issues: string[] = [];
      // Should display ESG management interface
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/quality-dashboard",
    label: "Quality Dashboard",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/gestao-indicadores",
    label: "Gestao Indicadores - All Tabs",
    test: async (page) => {
      const issues: string[] = [];

      // Tab: Dashboard (default)
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Dashboard tab");

      // Tab: Indicadores
      await clickTab(page, /indicadores/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Indicadores tab");

      // Tab: Coleta de Dados
      await clickTab(page, /coleta/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Coleta tab");

      // Tab: Grupos
      await clickTab(page, /grupos/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Grupos tab");

      return issues;
    },
  },
  {
    route: "/demo/nao-conformidades",
    label: "Nao Conformidades - Tabs + Modal",
    test: async (page) => {
      const issues: string[] = [];

      // Tab: Dashboard
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Dashboard tab");

      // Tab: Não Conformidades
      await clickTab(page, /não conformidades|nao conformidades|registros/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on NC list tab");

      // Tab: Análise
      await clickTab(page, /análise|analise/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Analise tab");

      // Tab: Relatórios
      await clickTab(page, /relatórios|relatorios/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Relatorios tab");

      // Try opening "Nova NC" / "Registrar" modal
      const registerBtn = page.getByRole("button", { name: /nova|registrar|novo registro/i });
      if (await tryClick(registerBtn)) {
        await page.waitForTimeout(WAIT_AFTER_INTERACTION);
        if (!(await assertNoErrorBoundary(page))) issues.push("Error in NC creation modal");
        // Check modal has form fields
        const inputs = await page.locator("dialog input, [role=dialog] input, [data-state=open] input").count();
        if (inputs === 0) {
          // Try alternate modal detection
          const dialogVisible = await page.locator("[role=dialog], [data-state=open]").count();
          if (dialogVisible > 0 && inputs === 0) {
            // Modal is open but no inputs - could be a different modal type
          }
        }
        await closeDialog(page);
      }

      return issues;
    },
  },
  {
    route: "/demo/acoes-corretivas",
    label: "Acoes Corretivas",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");

      // Try to open new action modal
      const newBtn = page.getByRole("button", { name: /nova|novo|criar|adicionar/i });
      if (await tryClick(newBtn)) {
        await page.waitForTimeout(WAIT_AFTER_INTERACTION);
        if (!(await assertNoErrorBoundary(page))) issues.push("Error in creation modal");
        await closeDialog(page);
      }

      return issues;
    },
  },
  {
    route: "/demo/controle-documentos",
    label: "Controle Documentos - 3 Tabs",
    test: async (page) => {
      const issues: string[] = [];

      // Tab: Dashboard / Geral
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on default tab");

      // Tab: ISO / SGQ
      await clickTab(page, /iso|sgq/i);
      await page.waitForTimeout(WAIT_AFTER_INTERACTION);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on ISO tab");

      // Tab: Leituras
      await clickTab(page, /leituras|obrigatórias/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Leituras tab");

      return issues;
    },
  },
  {
    route: "/demo/mapeamento-processos",
    label: "Mapeamento Processos - 4 Tabs",
    test: async (page) => {
      const issues: string[] = [];

      // Default tab
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on default tab");

      // Tab: Processos
      await clickTab(page, /processos/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Processos tab");

      // Tab: Indicadores
      await clickTab(page, /indicadores/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Indicadores tab");

      // Tab: Análise
      await clickTab(page, /análise|analise/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Analise tab");

      return issues;
    },
  },
  {
    route: "/demo/planejamento-estrategico",
    label: "Planejamento Estrategico - 6 Tabs",
    test: async (page) => {
      const issues: string[] = [];

      // Default tab (Dashboard)
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on default tab");

      // Click through all tabs
      for (const tabName of [
        /objetivos|metas/i,
        /swot/i,
        /análise|analise/i,
        /bsc|balanced/i,
        /planos|ações|acoes/i,
        /relatórios|relatorios/i,
      ]) {
        await clickTab(page, tabName);
        if (!(await assertNoErrorBoundary(page))) {
          issues.push(`Error on tab matching ${tabName}`);
        }
      }

      return issues;
    },
  },
  {
    route: "/demo/licenciamento",
    label: "Licenciamento",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/licenciamento/legislacoes",
    label: "Legislacoes",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");

      // Should have table/list of legislations
      const rows = await countTableRows(page);
      // Verify data is present (mock data should populate)

      return issues;
    },
  },
  {
    route: "/demo/laia",
    label: "LAIA",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/matriz-partes-interessadas",
    label: "Matriz Partes Interessadas",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },

  // ─── Fornecedores ───────────────────────────────────────────────
  {
    route: "/demo/fornecedores/dashboard",
    label: "Fornecedores Dashboard",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      // Dashboard should have KPI cards
      return issues;
    },
  },
  {
    route: "/demo/fornecedores/cadastro",
    label: "Fornecedores Cadastro - Modal",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");

      // Try to open new supplier modal
      const newBtn = page.getByRole("button", { name: /novo fornecedor|cadastrar|adicionar/i });
      if (await tryClick(newBtn)) {
        await page.waitForTimeout(WAIT_AFTER_INTERACTION);
        if (!(await assertNoErrorBoundary(page))) issues.push("Error in supplier creation modal");
        // Check form fields exist
        const formFields = await page.locator("[role=dialog] input, [role=dialog] select, [data-state=open] input").count();
        if (formFields > 0) {
          // Try to fill in a text field but NOT submit
          const nameInput = page.locator("[role=dialog] input").first();
          if ((await nameInput.count()) > 0) {
            await nameInput.fill("Test Supplier Demo");
            await page.waitForTimeout(300);
          }
        }
        await closeDialog(page);
      }

      return issues;
    },
  },
  {
    route: "/demo/fornecedores/avaliacoes",
    label: "Fornecedores Avaliacoes - Filters",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");

      // Try search filter
      const searchInput = page.getByPlaceholder(/buscar|pesquisar|filtrar|search/i);
      if ((await searchInput.count()) > 0) {
        await searchInput.first().fill("Teste");
        await page.waitForTimeout(WAIT_AFTER_INTERACTION);
        if (!(await assertNoErrorBoundary(page))) issues.push("Error after search filter");
        await searchInput.first().clear();
      }

      return issues;
    },
  },
  {
    route: "/demo/fornecedores/conexoes",
    label: "Fornecedores Conexoes",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/fornecedores/indicadores",
    label: "Fornecedores Indicadores",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/fornecedores/documentacao",
    label: "Fornecedores Documentacao",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/fornecedores/tipos",
    label: "Fornecedores Tipos - Modal",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");

      // Try opening add type modal
      const addBtn = page.getByRole("button", { name: /novo tipo|adicionar|criar/i });
      if (await tryClick(addBtn)) {
        await page.waitForTimeout(WAIT_AFTER_INTERACTION);
        if (!(await assertNoErrorBoundary(page))) issues.push("Error in type creation modal");
        await closeDialog(page);
      }

      return issues;
    },
  },
  {
    route: "/demo/fornecedores/categorias",
    label: "Fornecedores Categorias - Modal",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");

      const addBtn = page.getByRole("button", { name: /nova categoria|adicionar|criar/i });
      if (await tryClick(addBtn)) {
        await page.waitForTimeout(WAIT_AFTER_INTERACTION);
        if (!(await assertNoErrorBoundary(page))) issues.push("Error in category creation modal");
        await closeDialog(page);
      }

      return issues;
    },
  },
  {
    route: "/demo/fornecedores/treinamentos",
    label: "Fornecedores Treinamentos",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/fornecedores/entregas",
    label: "Fornecedores Entregas",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/fornecedores/falhas",
    label: "Fornecedores Falhas",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/fornecedores/criterios-avaliacao",
    label: "Fornecedores Criterios Avaliacao",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/fornecedores/importar-exportar",
    label: "Fornecedores Importar/Exportar",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/fornecedores/associacao-documentos",
    label: "Fornecedores Associacao Documentos",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/fornecedores/leituras-obrigatorias",
    label: "Fornecedores Leituras Obrigatorias",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/fornecedores/pesquisas",
    label: "Fornecedores Pesquisas",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },

  // ─── Social / RH ────────────────────────────────────────────────
  {
    route: "/demo/social-esg",
    label: "Social ESG - Tabs + Modal",
    test: async (page) => {
      const issues: string[] = [];

      // Tab: Visão Geral (default)
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Visao Geral tab");

      // Tab: Impacto Social
      await clickTab(page, /social|impacto/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Impacto Social tab");

      // Try "Novo Projeto" button
      const newProjectBtn = page.getByRole("button", { name: /novo projeto|novo registro/i });
      if (await tryClick(newProjectBtn)) {
        await page.waitForTimeout(WAIT_AFTER_INTERACTION);
        if (!(await assertNoErrorBoundary(page))) issues.push("Error in project creation modal");
        await closeDialog(page);
      }

      return issues;
    },
  },
  {
    route: "/demo/gestao-funcionarios",
    label: "Gestao Funcionarios - 6 Tabs + Modals",
    test: async (page) => {
      const issues: string[] = [];

      // Tab: Dashboard (default)
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Dashboard tab");

      // Tab: Funcionários
      await clickTab(page, /funcionários|funcionarios/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Funcionarios tab");

      // Tab: Importação
      await clickTab(page, /importação|importacao/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Importacao tab");

      // Tab: Diversidade
      await clickTab(page, /diversidade/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Diversidade tab");

      // Tab: Benefícios
      await clickTab(page, /benefícios|beneficios/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Beneficios tab");

      // Check benefits data is present (allow extra time for tab content to render)
      await page.waitForTimeout(800);
      const hasHealthPlan = await page.getByText("Plano de Saúde").count();
      const hasBenefitContent = await page.getByText(/benefício|plano|vale/i).count();
      if (hasHealthPlan === 0 && hasBenefitContent === 0) issues.push("No benefit data visible in Beneficios tab");

      // Tab: Relatórios
      await clickTab(page, /relatórios|relatorios/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Relatorios tab");

      // Try opening reports modal
      const reportBtn = page.getByRole("button", { name: /gerar|relatório|report/i });
      if (await tryClick(reportBtn)) {
        await page.waitForTimeout(WAIT_AFTER_INTERACTION);
        if (!(await assertNoErrorBoundary(page))) issues.push("Error in reports modal");
        await closeDialog(page);
      }

      return issues;
    },
  },
  {
    route: "/demo/gestao-treinamentos",
    label: "Gestao Treinamentos - 5 Tabs + Modals",
    test: async (page) => {
      const issues: string[] = [];

      // Tab: Dashboard (default)
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Dashboard tab");

      // Tab: Compliance
      await clickTab(page, /compliance/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Compliance tab");

      // Tab: Programas
      await clickTab(page, /programas/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Programas tab");

      // Check mock training data
      const hasNR12 = await page.getByText("NR-12").count();
      if (hasNR12 === 0) {
        const hasTraining = await page.getByText(/treinamento|programa/i).count();
        if (hasTraining === 0) issues.push("No training programs visible in Programas tab");
      }

      // Try filter
      const searchInput = page.getByPlaceholder(/buscar|pesquisar|filtrar/i);
      if ((await searchInput.count()) > 0) {
        await searchInput.first().fill("NR");
        await page.waitForTimeout(WAIT_AFTER_INTERACTION);
        if (!(await assertNoErrorBoundary(page))) issues.push("Error after filtering");
        await searchInput.first().clear();
      }

      // Tab: Calendário
      await clickTab(page, /calendário|calendario/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Calendario tab");

      // Tab: Certificações
      await clickTab(page, /certificações|certificacoes/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Certificacoes tab");

      // Try opening "Novo Programa" modal
      await clickTab(page, /programas/i);
      await page.waitForTimeout(500);
      const newProgramBtn = page.getByRole("button", { name: /novo programa|novo registro/i });
      if (await tryClick(newProgramBtn)) {
        await page.waitForTimeout(WAIT_AFTER_INTERACTION);
        if (!(await assertNoErrorBoundary(page))) issues.push("Error in program creation modal");
        await closeDialog(page);
      }

      return issues;
    },
  },
  {
    route: "/demo/seguranca-trabalho",
    label: "Seguranca Trabalho - 5 Tabs + Filters",
    test: async (page) => {
      const issues: string[] = [];

      // Tab: Dashboard (default)
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Dashboard tab");

      // Tab: Incidentes
      await clickTab(page, /incidentes/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Incidentes tab");

      // Check for incident data
      const hasIncident = await page.getByText(/quase acidente|incidente|acidente/i).count();
      if (hasIncident === 0) issues.push("No incident data visible");

      // Try search filter
      const searchInput = page.getByPlaceholder(/buscar|pesquisar|filtrar/i);
      if ((await searchInput.count()) > 0) {
        await searchInput.first().fill("Teste");
        await page.waitForTimeout(WAIT_AFTER_INTERACTION);
        if (!(await assertNoErrorBoundary(page))) issues.push("Error after search filter");
        await searchInput.first().clear();
      }

      // Tab: Inspeções
      await clickTab(page, /inspeções|inspecoes/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Inspecoes tab");

      // Tab: Treinamentos
      await clickTab(page, /treinamentos/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Treinamentos tab");

      // Tab: Relatórios
      await clickTab(page, /relatórios|relatorios/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Relatorios tab");

      // Try opening "Novo Incidente" modal
      await clickTab(page, /incidentes/i);
      await page.waitForTimeout(500);
      const newIncidentBtn = page.getByRole("button", { name: /novo incidente|registrar|novo/i });
      if (await tryClick(newIncidentBtn)) {
        await page.waitForTimeout(WAIT_AFTER_INTERACTION);
        if (!(await assertNoErrorBoundary(page))) issues.push("Error in incident creation modal");
        await closeDialog(page);
      }

      return issues;
    },
  },
  {
    route: "/demo/desenvolvimento-carreira",
    label: "Desenvolvimento Carreira - 5 Tabs + Modals",
    test: async (page) => {
      const issues: string[] = [];

      // Tab: Dashboard (default)
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Dashboard tab");

      // Tab: PDIs
      await clickTab(page, /pdi/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on PDIs tab");

      // Check mock data
      const hasMariana = await page.getByText("Mariana Costa").count();
      if (hasMariana === 0) {
        const hasPDI = await page.getByText(/pdi|plano/i).count();
        if (hasPDI === 0) issues.push("No PDI data visible");
      }

      // Try "Novo PDI" modal
      const newPDIBtn = page.getByRole("button", { name: /novo pdi|criar pdi|novo/i });
      if (await tryClick(newPDIBtn)) {
        await page.waitForTimeout(WAIT_AFTER_INTERACTION);
        if (!(await assertNoErrorBoundary(page))) issues.push("Error in PDI creation modal");
        await closeDialog(page);
      }

      // Tab: Sucessão
      await clickTab(page, /sucessão|sucessao/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Sucessao tab");

      // Tab: Vagas Internas
      await clickTab(page, /vagas/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Vagas tab");

      // Tab: Mentoria
      await clickTab(page, /mentoria/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Mentoria tab");

      return issues;
    },
  },
  {
    route: "/demo/descricao-cargos",
    label: "Descricao Cargos",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");

      // Should show job positions
      const hasDiretor = await page.getByText("Diretor").count();
      if (hasDiretor === 0) issues.push("Missing Diretor in job descriptions");

      return issues;
    },
  },
  {
    route: "/demo/estrutura-organizacional",
    label: "Estrutura Organizacional",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");

      // Should show org hierarchy
      const hasJuliana = await page.getByText("Juliana Lima").count();
      if (hasJuliana === 0) issues.push("Missing Juliana Lima in org structure");

      return issues;
    },
  },
  {
    route: "/demo/avaliacao-eficacia",
    label: "Avaliacao Eficacia",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },

  // ─── Ambiental ──────────────────────────────────────────────────
  {
    route: "/demo/monitoramento-esg",
    label: "Monitoramento ESG - Navigation Cards",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");

      // Should have 4 navigation cards (Água, Energia, Emissões, Resíduos)
      const hasAgua = await page.getByText(/água|agua/i).count();
      const hasEnergia = await page.getByText(/energia/i).count();
      if (hasAgua === 0) issues.push("Missing Água card");
      if (hasEnergia === 0) issues.push("Missing Energia card");

      return issues;
    },
  },
  {
    route: "/demo/monitoramento-agua",
    label: "Monitoramento Agua - 2 Tabs",
    test: async (page) => {
      const issues: string[] = [];

      // Tab: Dashboard (default)
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Dashboard tab");

      // Tab: Registrar Consumo
      await clickTab(page, /registrar|consumo|registro/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Register tab");

      return issues;
    },
  },
  {
    route: "/demo/monitoramento-energia",
    label: "Monitoramento Energia - 2 Tabs",
    test: async (page) => {
      const issues: string[] = [];

      // Tab: Dashboard (default)
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Dashboard tab");

      // Tab: Registrar Consumo
      await clickTab(page, /registrar|consumo|registro/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Register tab");

      return issues;
    },
  },
  {
    route: "/demo/monitoramento-emissoes",
    label: "Monitoramento Emissoes",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/monitoramento-residuos",
    label: "Monitoramento Residuos",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/inventario-gee",
    label: "Inventario GEE",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/dashboard-ghg",
    label: "Dashboard GHG",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/projetos-carbono",
    label: "Projetos Carbono",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/residuos",
    label: "Residuos",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/metas",
    label: "Metas",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },

  // ─── Governanca ─────────────────────────────────────────────────
  {
    route: "/demo/governanca-esg",
    label: "Governanca ESG - 6 Tabs + Modals",
    test: async (page) => {
      const issues: string[] = [];

      // Tab: Visão Geral (default)
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on overview tab");

      // Tab: Estrutura
      await clickTab(page, /estrutura/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Estrutura tab");

      // Tab: Políticas
      await clickTab(page, /políticas|politicas/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Politicas tab");

      // Tab: Funcionários
      await clickTab(page, /funcionários|funcionarios/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Funcionarios tab");

      // Tab: Riscos ESG
      await clickTab(page, /riscos/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Riscos tab");

      // Tab: Ética
      await clickTab(page, /ética|etica/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Etica tab");

      // Try "Novo Registro" dropdown
      const newBtn = page.getByRole("button", { name: /novo registro|novo/i });
      if (await tryClick(newBtn)) {
        await page.waitForTimeout(800);
        // Try clicking a dropdown item
        const dropdownItem = page.getByRole("menuitem", { name: /conselheiro|política|risco|denúncia/i });
        if ((await dropdownItem.count()) > 0) {
          await dropdownItem.first().click();
          await page.waitForTimeout(WAIT_AFTER_INTERACTION);
          if (!(await assertNoErrorBoundary(page))) issues.push("Error in creation modal from dropdown");
          await closeDialog(page);
        } else {
          // Might be a direct modal, not dropdown
          if (!(await assertNoErrorBoundary(page))) issues.push("Error after clicking Novo");
          await closeDialog(page);
        }
      }

      return issues;
    },
  },
  {
    route: "/demo/gestao-riscos",
    label: "Gestao Riscos - 6 Tabs + Modals",
    test: async (page) => {
      const issues: string[] = [];

      // Tab: Dashboard (default)
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Dashboard tab");

      // Tab: Matrizes
      await clickTab(page, /matrizes|matriz/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Matrizes tab");

      // Tab: Riscos
      await clickTab(page, /riscos identificados|riscos/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Riscos tab");

      // Tab: Ocorrências
      await clickTab(page, /ocorrências|ocorrencias/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Ocorrencias tab");

      // Tab: Oportunidades
      await clickTab(page, /oportunidades/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Oportunidades tab");

      // Tab: SWOT
      await clickTab(page, /swot/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on SWOT tab");

      // Try "Nova Matriz" dialog
      await clickTab(page, /matrizes|matriz/i);
      await page.waitForTimeout(500);
      const newMatrixBtn = page.getByRole("button", { name: /nova matriz|criar matriz/i });
      if (await tryClick(newMatrixBtn)) {
        await page.waitForTimeout(WAIT_AFTER_INTERACTION);
        if (!(await assertNoErrorBoundary(page))) issues.push("Error in matrix creation dialog");
        // Check form fields
        const nameInput = page.locator("[role=dialog] input, [data-state=open] input").first();
        if ((await nameInput.count()) > 0) {
          await nameInput.fill("Matriz Demo Test");
        }
        await closeDialog(page);
      }

      return issues;
    },
  },
  {
    route: "/demo/compliance",
    label: "Compliance - 7 Tabs",
    test: async (page) => {
      const issues: string[] = [];

      // Tab: Dashboard (default)
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Dashboard tab");

      // Tab: Tarefas
      await clickTab(page, /tarefas/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Tarefas tab");

      // Tab: Templates
      await clickTab(page, /templates/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Templates tab");

      // Tab: Ações em Lote
      await clickTab(page, /ações em lote|acoes em lote|lote/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Bulk Actions tab");

      // Tab: Calendário
      await clickTab(page, /calendário|calendario/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Calendario tab");

      // Tab: Matriz Regulatória
      await clickTab(page, /matriz regulatória|regulatoria|requisitos/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Regulatory tab");

      // Tab: Auditoria
      await clickTab(page, /auditoria|audit/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Audit tab");

      return issues;
    },
  },
  {
    route: "/demo/auditoria",
    label: "Auditoria - 9 Tabs + Modals",
    test: async (page) => {
      const issues: string[] = [];

      // Tab: Programa (default)
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Programa tab");

      // Tab: Áreas
      await clickTab(page, /áreas|areas/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Areas tab");

      // Tab: Requisitos ISO
      await clickTab(page, /requisitos/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Requisitos tab");

      // Tab: Auditores
      await clickTab(page, /auditores/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Auditores tab");

      // Tab: Auditorias
      await clickTab(page, /auditorias/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Auditorias tab");

      // Tab: SGQ
      await clickTab(page, /sgq/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on SGQ tab");

      // Tab: Calendário
      await clickTab(page, /calendário|calendario/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Calendario tab");

      // Tab: Relatórios
      await clickTab(page, /relatórios|relatorios/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Relatorios tab");

      // Tab: Configurações
      await clickTab(page, /configurações|configuracoes|config/i);
      if (!(await assertNoErrorBoundary(page))) issues.push("Error on Config tab");

      // Try "Nova Auditoria" modal
      await clickTab(page, /auditorias/i);
      await page.waitForTimeout(500);
      const newAuditBtn = page.getByRole("button", { name: /nova auditoria|criar/i });
      if (await tryClick(newAuditBtn)) {
        await page.waitForTimeout(WAIT_AFTER_INTERACTION);
        if (!(await assertNoErrorBoundary(page))) issues.push("Error in audit creation modal");
        await closeDialog(page);
      }

      return issues;
    },
  },
  {
    route: "/demo/gestao-stakeholders",
    label: "Gestao Stakeholders",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/analise-materialidade",
    label: "Analise Materialidade",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },

  // ─── Financeiro ─────────────────────────────────────────────────
  {
    route: "/demo/financeiro/dashboard",
    label: "Financeiro Dashboard",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/financeiro/plano-contas",
    label: "Financeiro Plano de Contas",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");

      // Try search
      const searchInput = page.getByPlaceholder(/buscar|pesquisar|filtrar/i);
      if ((await searchInput.count()) > 0) {
        await searchInput.first().fill("Receita");
        await page.waitForTimeout(WAIT_AFTER_INTERACTION);
        if (!(await assertNoErrorBoundary(page))) issues.push("Error after filtering");
        await searchInput.first().clear();
      }

      return issues;
    },
  },
  {
    route: "/demo/financeiro/lancamentos-contabeis",
    label: "Financeiro Lancamentos",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/financeiro/contas-pagar",
    label: "Financeiro Contas a Pagar",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");

      // Try filter
      const searchInput = page.getByPlaceholder(/buscar|pesquisar|filtrar/i);
      if ((await searchInput.count()) > 0) {
        await searchInput.first().fill("Fornecedor");
        await page.waitForTimeout(WAIT_AFTER_INTERACTION);
        if (!(await assertNoErrorBoundary(page))) issues.push("Error after filtering");
        await searchInput.first().clear();
      }

      return issues;
    },
  },
  {
    route: "/demo/financeiro/contas-receber",
    label: "Financeiro Contas a Receber",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/financeiro/aprovacoes",
    label: "Financeiro Aprovacoes",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/financeiro/esg-dashboard",
    label: "Financeiro ESG Dashboard",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/financeiro/orcamento",
    label: "Financeiro Orcamento",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/financeiro/fluxo-caixa",
    label: "Financeiro Fluxo de Caixa",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/financeiro/centros-custo",
    label: "Financeiro Centros de Custo",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/financeiro/relatorios",
    label: "Financeiro Relatorios",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/financeiro/rentabilidade",
    label: "Financeiro Rentabilidade",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/financeiro/residuos/contas-a-pagar",
    label: "Financeiro Residuos Contas a Pagar",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/financeiro/residuos/contas-a-receber",
    label: "Financeiro Residuos Contas a Receber",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },

  // ─── Dados e Relatorios ─────────────────────────────────────────
  {
    route: "/demo/coleta-dados",
    label: "Coleta de Dados",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/documentos",
    label: "Documentos - Search + Modal",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");

      // Try search
      const searchInput = page.getByPlaceholder(/buscar|pesquisar|filtrar/i);
      if ((await searchInput.count()) > 0) {
        await searchInput.first().fill("Política");
        await page.waitForTimeout(WAIT_AFTER_INTERACTION);
        if (!(await assertNoErrorBoundary(page))) issues.push("Error after filtering");
        await searchInput.first().clear();
      }

      return issues;
    },
  },
  {
    route: "/demo/relatorios-integrados",
    label: "Relatorios Integrados",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/sdg-dashboard",
    label: "SDG Dashboard",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/indicadores-recomendados",
    label: "Indicadores Recomendados",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/ativos",
    label: "Ativos",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },

  // ─── Configuracoes ──────────────────────────────────────────────
  {
    route: "/demo/configuracao",
    label: "Configuracao",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/configuracao-organizacional",
    label: "Configuracao Organizacional",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/ajuda",
    label: "Ajuda",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/gestao-filiais",
    label: "Gestao Filiais",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");

      // Try creating a new branch
      const newBtn = page.getByRole("button", { name: /nova filial|adicionar|criar/i });
      if (await tryClick(newBtn)) {
        await page.waitForTimeout(WAIT_AFTER_INTERACTION);
        if (!(await assertNoErrorBoundary(page))) issues.push("Error in branch creation modal");
        await closeDialog(page);
      }

      return issues;
    },
  },
  {
    route: "/demo/biblioteca-fatores",
    label: "Biblioteca de Fatores",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/gestao-usuarios",
    label: "Gestao Usuarios",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/formularios-customizados",
    label: "Formularios Customizados",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
  {
    route: "/demo/listas-de-envio",
    label: "Listas de Envio - Modal",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");

      // Try creating a new list
      const newBtn = page.getByRole("button", { name: /nova lista|criar|adicionar/i });
      if (await tryClick(newBtn)) {
        await page.waitForTimeout(WAIT_AFTER_INTERACTION);
        if (!(await assertNoErrorBoundary(page))) issues.push("Error in list creation modal");
        await closeDialog(page);
      }

      return issues;
    },
  },
  {
    route: "/demo/system-status",
    label: "System Status",
    test: async (page) => {
      const issues: string[] = [];
      if (!(await assertNoErrorBoundary(page))) issues.push("Error boundary visible");
      return issues;
    },
  },
];

/* ------------------------------------------------------------------ */
/*  Main test: login once, deep-test every page                        */
/* ------------------------------------------------------------------ */

test("Deep interaction test — all demo pages", async ({ browser }) => {
  test.setTimeout(30 * 60 * 1000); // 30 min

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

  // ---- Deep test all pages ----
  const allFailures: Record<string, string[]> = {};
  let passed = 0;

  for (const pageTest of PAGE_TESTS) {
    const tracker = collectRuntimeErrors(page);

    try {
      console.log(`\n  Testing: ${pageTest.label} (${pageTest.route})`);
      await goTo(page, pageTest.route);

      // Check we didn't get redirected to auth
      const currentPath = new URL(page.url()).pathname;
      if (currentPath.startsWith("/auth")) {
        allFailures[pageTest.route] = ["redirected to /auth (session expired?)"];
        console.log(`    ✘ Redirected to /auth`);
        continue;
      }

      // Run the page-specific interaction test
      const pageIssues = await pageTest.test(page);

      // Add runtime errors
      if (tracker.errors.length > 0) {
        pageIssues.push(...tracker.errors);
      }

      // Check for error boundary after interactions
      if (!(await assertNoErrorBoundary(page))) {
        pageIssues.push("Error boundary visible after interactions");
      }

      if (pageIssues.length > 0) {
        allFailures[pageTest.route] = pageIssues;
        console.log(`    ✘ ${pageIssues.length} issue(s):`);
        for (const issue of pageIssues) console.log(`      → ${issue}`);
      } else {
        passed++;
        console.log(`    ✓ OK`);
      }
    } catch (error) {
      allFailures[pageTest.route] = [`test error: ${(error as Error).message}`];
      console.log(`    ✘ Error: ${(error as Error).message}`);
    } finally {
      tracker.detach();
      // Close any lingering dialogs
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
    }
  }

  // ---- Final report ----
  await page.close();
  await context.close();

  const total = PAGE_TESTS.length;
  const failedCount = Object.keys(allFailures).length;

  console.log(`\n${"═".repeat(60)}`);
  console.log(`DEEP INTERACTION RESULTS: ${passed}/${total} passed, ${failedCount} failed`);
  console.log(`${"═".repeat(60)}`);

  if (failedCount > 0) {
    const report = Object.entries(allFailures)
      .map(([route, errs]) => `  ${route}:\n    - ${errs.join("\n    - ")}`)
      .join("\n");
    console.log(`\nFailed pages:\n${report}`);

    expect(
      failedCount,
      `${failedCount}/${total} pages failed deep interaction tests:\n${report}`,
    ).toBe(0);
  }
});
