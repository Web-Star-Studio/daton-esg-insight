import { test, expect, Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Load creds from .env.test (gitignored) without adding dotenv dep
function loadEnvTest() {
  try {
    const content = readFileSync(resolve(process.cwd(), ".env.test"), "utf8");
    const vars: Record<string, string> = {};
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      vars[key] = value;
    }
    return vars;
  } catch {
    return {};
  }
}

const envTest = loadEnvTest();
const EMAIL = process.env.PLAYWRIGHT_USER_EMAIL ?? envTest.PLAYWRIGHT_USER_EMAIL;
const PASSWORD = process.env.PLAYWRIGHT_USER_PASSWORD ?? envTest.PLAYWRIGHT_USER_PASSWORD;

async function login(page: Page) {
  if (!EMAIL || !PASSWORD) {
    throw new Error("Missing PLAYWRIGHT_USER_EMAIL / PLAYWRIGHT_USER_PASSWORD (.env.test or env)");
  }
  await page.goto("/auth", { waitUntil: "domcontentloaded" });
  await page.locator("#login-email").fill(EMAIL);
  await page.locator("#login-password").fill(PASSWORD);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith("/auth"), { timeout: 30_000 }),
    page.getByRole("button", { name: /^entrar/i }).click(),
  ]);
}

async function openExportModal(page: Page) {
  await page.goto("/gestao-treinamentos", { waitUntil: "domcontentloaded" });
  const trigger = page.getByRole("button", { name: /exportar horas/i });
  await trigger.waitFor({ state: "visible", timeout: 30_000 });
  await trigger.click();
  const title = page.getByText("Exportar Horas de Treinamento", { exact: true });
  await title.waitFor({ state: "visible", timeout: 15_000 });
}

function modalRoot(page: Page) {
  return page.getByRole("dialog").filter({ hasText: "Exportar Horas de Treinamento" });
}

async function selectReportType(page: Page, label: string) {
  await modalRoot(page).getByRole("button", { name: new RegExp(`^${label}`, "i") }).first().click();
}

async function waitForPreview(page: Page) {
  const modal = modalRoot(page);
  // Wait until either preview table or empty state is rendered (and skeleton is gone)
  await expect.poll(async () => {
    const hasSkeleton = await modal.locator(".animate-pulse").count();
    return hasSkeleton === 0;
  }, { timeout: 30_000 }).toBeTruthy();
}

async function openMultiSelect(page: Page, labelText: string) {
  const modal = modalRoot(page);
  const group = modal.locator("div.space-y-1\\.5").filter({
    has: page.locator(`label:has-text("${labelText}")`),
  }).first();
  await group.getByRole("combobox").click();
}

// SLOW_MO env slows each action (ms) — only applies in headed runs. Set 0/unset in CI.
const slowMoMs = Number(process.env.SLOW_MO ?? 0);
if (slowMoMs > 0) {
  test.use({ launchOptions: { slowMo: slowMoMs } });
}

test.describe("Exportar Horas de Treinamento", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("Cenário A — Detalhado lista funcionário Inativo (com filtro Setor=Frota)", async ({ page }) => {
    await openExportModal(page);
    await selectReportType(page, "Detalhado");
    await waitForPreview(page);

    // Aplicar filtro Setor=Frota para garantir que DIEGO caiba nas 10 primeiras linhas do preview
    await openMultiSelect(page, "Setor");
    await page.getByRole("option", { name: "Frota", exact: true }).click();
    await page.keyboard.press("Escape");
    await waitForPreview(page);

    const modal = modalRoot(page);
    // DIEGO (Inativo) presente no preview — valida que ex-funcionário com treinamento ainda conta
    await expect(modal.getByText(/DIEGO LIMA DE FREITAS \(Inativo\)/i)).toBeVisible();
    // Summary para Setor Frota: 14.5h totais • 7 funcionários • 2.1h média
    await expect(modal.getByText(/14\.5h totais/i)).toBeVisible();
    await expect(modal.getByText(/7 funcionários/i)).toBeVisible();
  });

  test("Cenário B — MultiSelect Funcionário mostra (Inativo)", async ({ page }) => {
    await openExportModal(page);
    await waitForPreview(page);
    await openMultiSelect(page, "Funcionário");
    await page.getByPlaceholder(/buscar funcionário/i).fill("DIEGO");
    // Command item with the inactive suffix
    await expect(page.getByRole("option", { name: /DIEGO LIMA DE FREITAS \(Inativo\)/i })).toBeVisible();
  });

  test("Cenário C — Período exibe critérios e resumo", async ({ page }) => {
    await openExportModal(page);
    await selectReportType(page, "Detalhado");

    const modal = modalRoot(page);
    // Helper text sobre data de término do programa
    await expect(modal.getByText(/data de término do programa/i)).toBeVisible();

    // Set date from 01/01/2026 and to 31/01/2026 via Calendar widget
    await modal.getByRole("button", { name: /data inicial/i }).click();
    const caption = page.getByRole("presentation").locator("text=/^\\w+ 20\\d{2}$/").first();
    await caption.waitFor({ timeout: 5000 }).catch(() => {});
    await page.locator('button[name="day"]:has-text("1")').first().click();

    await modal.getByRole("button", { name: /data final/i }).click();
    await page.locator('button[name="day"]:has-text("31")').first().click();

    await waitForPreview(page);

    // Critérios aplicados é visível e lista a nova regra
    await expect(modal.getByText("Critérios aplicados neste cálculo", { exact: true })).toBeVisible();
    await expect(modal.getByText(/Base de cálculo: participações em programas com status "Concluído"/i)).toBeVisible();
    await expect(modal.getByText(/Período \(término do programa\)/i)).toBeVisible();
  });

  test("Cenário D — Por Treinamento mostra linhas reais (não 5 fixas)", async ({ page }) => {
    await openExportModal(page);
    await selectReportType(page, "Por Treinamento");
    await waitForPreview(page);

    const modal = modalRoot(page);
    // Rótulo de preview no formato "mostrando X de Y linhas"
    await expect(modal.getByText(/mostrando \d+ de \d+ linha/i)).toBeVisible();
    // Pelo menos um item esperado
    await expect(modal.getByText(/TREINAMENTO MATINAL: PROCEDIMENTOS DE VIAGEM/i)).toBeVisible();
  });

  test("Cenário E — Filtro de Filial inclui (Inativa)", async ({ page }) => {
    await openExportModal(page);
    await waitForPreview(page);
    await openMultiSelect(page, "Filial");
    await expect(page.getByRole("option", { name: /\(Inativa\)/i })).toBeVisible();
  });
});
