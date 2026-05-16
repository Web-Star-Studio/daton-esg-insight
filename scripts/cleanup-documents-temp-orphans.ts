#!/usr/bin/env bun
/**
 * F-020 Fase 1 — Cleanup dos 3.423 órfãos em `documents/temp/*`
 *
 * Estado em prod (verificado 2026-05-16):
 *   - 3.423 arquivos no path `temp/temp-analysis-<timestamp>-<random>.pdf`
 *   - 158 MB total
 *   - Criados Sep 12-16, 2025, antes do bug do analyzer que deixou órfão
 *   - Zero referências em 24 tabelas que armazenam file_path/file_url
 *   - App refatorado (licenses.ts) pra prefixar uploads com
 *     `${company_id}/_temp/` daqui pra frente — esse cleanup é one-shot
 *
 * Não dá pra rodar via SQL: trigger `storage.protect_delete()` bloqueia
 * DELETE direto em storage.objects. Tem que usar a Storage API com
 * service_role.
 *
 * Uso:
 *   SUPABASE_URL=https://<proj>.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   bun scripts/cleanup-documents-temp-orphans.ts [--dry-run]
 *
 * Pega o service_role key em https://supabase.com/dashboard/project/<id>/settings/api
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN = process.argv.includes("--dry-run");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BUCKET = "documents";
const PREFIX = "temp";
const BATCH = 100;

async function main() {
  // Lista todos arquivos no folder temp/
  const { data: files, error } = await supabase.storage
    .from(BUCKET)
    .list(PREFIX, { limit: 10_000 });
  if (error) {
    console.error("Erro listando temp/:", error);
    process.exit(1);
  }
  const paths = (files ?? []).map((f) => `${PREFIX}/${f.name}`);
  const total = paths.length;
  const totalBytes = (files ?? []).reduce(
    (sum, f) => sum + (f.metadata?.size ?? 0),
    0,
  );
  console.warn(
    `Found ${total} files in ${BUCKET}/${PREFIX} (${(totalBytes / 1024 / 1024).toFixed(1)} MB)`,
  );

  if (DRY_RUN) {
    console.warn("--dry-run: nothing deleted. Sample first 5 paths:");
    for (const p of paths.slice(0, 5)) console.warn("  " + p);
    return;
  }

  if (total === 0) {
    console.warn("Nothing to delete.");
    return;
  }

  let deleted = 0;
  for (let i = 0; i < paths.length; i += BATCH) {
    const batch = paths.slice(i, i + BATCH);
    const { error: rmError } = await supabase.storage
      .from(BUCKET)
      .remove(batch);
    if (rmError) {
      console.error(`Batch ${i}-${i + batch.length} failed:`, rmError);
      break;
    }
    deleted += batch.length;
    console.warn(`Deleted ${deleted}/${total}`);
  }
  console.warn(`Done. Deleted ${deleted} files.`);
}

main();
