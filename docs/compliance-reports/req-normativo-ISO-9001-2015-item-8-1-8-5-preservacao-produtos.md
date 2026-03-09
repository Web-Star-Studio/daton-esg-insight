# Resumo Executivo — Análise ISO 9001:2015 Itens 8.1 e 8.5 (Preservação de Produtos Acabados)

**Item normativo:** ISO 9001:2015 — 8.1 (Planejamento e Controle Operacional) e 8.5.4 (Preservação) — foco em critérios de preservação de produtos acabados e gestão de riscos aplicáveis
**Tipo de análise:** Tipo B — Conformidade do Sistema (análise de codebase sem documento de validação externo)
**Data:** 2026-03-09
**Analista:** Compliance Auditor — Daton ESG Insight
**Score de Confiança:** 3.1 / 5 — Funcional
**Referência cruzada:** Relatório `req-normativo-ISO-9001-2015-item-8-5-4.md` (preservação de propriedade do cliente — auditado anteriormente, score 3.7/5)

---

## Nota Global

**3.1 / 5 — Conformidade Funcional com Lacunas Significativas**

Para o Daton ESG Insight (plataforma SaaS de gestão ESG), os "produtos acabados" correspondem primariamente a:

1. **Relatórios gerados e publicados** (GRI, GHG, Integrados) — saídas de alto valor que representam a entrega principal do serviço.
2. **Documentos aprovados e vigentes** (GED) — outputs documentais com ciclo de vida controlado.
3. **Indicadores ESG consolidados** — dados calculados e validados que formam a base dos relatórios.
4. **Dados exportados** — saídas em formato consumível pelo cliente (CSV, PDF, Excel).

A preservação desses "produtos acabados" abrange: integridade (não alteração indevida), disponibilidade (acesso garantido ao longo do tempo), identificação (rastreabilidade a quem produziu, quando, com quais dados), e proteção contra perda ou degradação.

O sistema apresenta **pontos fortes robustos na preservação de documentos via GED** (versionamento imutável, content_hash, audit trail) e nos dados de resíduos (MTR com integridade). Contudo, há lacunas críticas na **ausência de lock pós-publicação de relatórios GRI/GHG**, no **soft-delete ausente em tabelas de indicadores ESG**, e na **ausência de política formal de retenção e recuperação** que considerem riscos aplicáveis (perda de dados, corrupção, acesso indevido).

---

## Tabela de Módulos

| Módulo / Produto | Cobertura Normativa | Score | Observação |
|---|---|---|---|
| GED — document_versions (imutável) | 8.5.4.a/b/c | 4.5/5 | content_hash, is_current, changes_summary obrigatório — referência de qualidade |
| GED — document_audit_trail | 8.1, 8.5.4.c | 4.5/5 | Rastreabilidade completa de todas as ações sobre documentos |
| Relatórios GRI (griReports.ts) | 8.5.4.a/b | 2.5/5 | Status rico mas sem lock pós-Publicado; deleteGRIReport() sem restrição |
| Relatórios Integrados (integratedReports.ts) | 8.5.4.a/b | 2.5/5 | approved_by_user_id presente; sem lock pós-aprovação |
| Indicadores ESG (indicatorManagement.ts) | 8.5.4.a | 2.0/5 | Sem soft-delete; deleção permanente de medições históricas |
| Dados de Resíduos (waste.ts) | 8.5.4.a/b/c | 3.5/5 | MTR único; storage_type e status tipados; documentos vinculados |
| Ativos ambientais (assets.ts) | 8.5.4 | 3.0/5 | Proteção contra deleção com filhos; sem soft-delete para folhas |
| Propriedade do cliente (assetOwnership.ts) | 8.5.3, 8.5.4 | 3.5/5 | usage_restrictions, return_conditions, insurance — auditado em 8.5.3 |
| Exportação de dados (dataExport.ts) | 8.5.4 | 2.0/5 | Sem log de exportações; sem hash de integridade do arquivo exportado |
| Política de retenção (gedDocuments.ts) | 8.1 | 3.0/5 | retention_period como campo; sem enforcement automático |
| Backup / recuperação | 8.1 | Não verificável | Não há evidência no codebase de política de backup formal |

---

## Top 5 Pontos Fortes

1. **Versionamento imutável no GED:** `documentVersionsService.createVersion()` em `src/services/gedDocuments.ts` força `changes_summary` não nulo (linha 198: `throw new Error("Resumo das alterações é obrigatório...")`), registra `content_hash` opcional mas presente, e mantém `is_current = true` apenas na versão vigente — padrão de preservação de documentos acabados que atende plenamente 8.5.4.

2. **Audit trail completo de documentos:** `auditTrailService.logAction()` em `src/services/gedDocuments.ts` grava ação, `user_id`, `user_ip_address`, `old_values`, `new_values`, `timestamp` e `details` na tabela `document_audit_trail` — rastreabilidade integral das alterações em produtos documentais acabados.

3. **Soft-delete funcional no GED:** `masterListService.removeFromMasterList()` atualiza `is_active = false` em vez de deletar; `approvalWorkflowsService.deleteWorkflow()` idem — padrão de preservação de registros com possibilidade de recuperação.

4. **Preservação de propriedade do cliente (auditado em 8.5.3):** `assetOwnership.ts` registra `usage_restrictions`, `return_conditions`, `insurance_policy_number`, `contract_file_path` — controles de preservação de ativos de propriedade do cliente confirmados no relatório `req-normativo-ISO-9001-2015-item-8-5-3.md` (score 3.2/5).

5. **Dados de resíduos com rastreabilidade de custódia:** `waste.ts` — `WasteLogDetail` inclui `mtr_number` (único por MTR), `storage_type`, `driver_name`, `vehicle_plate`, `cdf_number`, `payment_status` e documentos vinculados via `documents` — cadeia de custódia dos resíduos preservada como produto acabado de monitoramento ambiental.

---

## Top 5 Lacunas Críticas

1. **Ausência de lock pós-publicação de relatórios GRI** (Severidade: **Crítica** — 8.5.4.a/b): `updateGRIReport()` em `src/services/griReports.ts` linhas 200-210 permite atualização irrestrita do relatório em qualquer status, incluindo `'Publicado'`. `deleteGRIReport()` linhas 213-219 permite deleção permanente de relatórios publicados sem verificação de status. Um relatório GRI publicado é um produto acabado de altíssimo valor regulatório — sua alteração pós-publicação viola o princípio de preservação e integridade de produto acabado. A mesma lacuna se aplica a `updateIntegratedReport()` em `src/services/integratedReports.ts`.

2. **Soft-delete ausente em indicadores ESG** (Severidade: **Maior** — 8.5.4.a): Tabelas de indicadores e medições (`quality_indicators`, `indicator_measurements`) suportam deleção direta via Supabase RLS sem soft-delete. A ausência de `deleted_at` ou `is_active` significa que medições históricas de indicadores ESG — saídas consolidadas que alimentam relatórios de conformidade — podem ser permanentemente perdidas sem recuperação.

3. **Sem política formal de retenção com enforcement automático** (Severidade: **Maior** — 8.1): O campo `retention_period` existe em `gedDocumentsService.updateDocumentGEDFields()` (linha 666) como string livre, mas não há mecanismo que: (a) alerte quando o prazo de retenção é atingido; (b) impeça a deleção de registros dentro do período de guarda; (c) aplique arquivamento automático após o período. Não há evidência de política de retenção de dados por categoria de produto acabado em `docs/`.

4. **Ausência de hash de integridade em exportações** (Severidade: **Maior** — 8.5.4.b): Arquivos exportados pelo sistema (relatórios PDF, exports CSV/Excel via `src/services/dataExport.ts`) não recebem hash de integridade ao serem gerados. O cliente não tem mecanismo para verificar se o arquivo recebido corresponde exatamente ao produto acabado gerado pelo sistema. Não há log de exportações no banco para rastrear quem exportou, quando, e qual versão do produto foi exportada.

5. **Backup e recuperação não verificáveis no codebase** (Severidade: **Maior** — 8.1 — risco de preservação): Não há evidência no codebase de: política de backup do banco Supabase, scripts de restauração, testes de recuperação, RPO/RTO definidos para os dados de produtos acabados (relatórios publicados, indicadores consolidados). A avaliação de riscos aplicáveis à preservação (conforme solicitado na cláusula normativa) não está documentada em `docs/`.

---

## Cobertura por Sub-requisito

### 8.5.4 — Preservação

| Sub-requisito | Texto normativo | Status | Evidência |
|---|---|---|---|
| 8.5.4.a — Identificação | Parcial | MTR único em resíduos; nc_number em NCs; GED com código; relatórios GRI sem identificação imutável pós-publicação |
| 8.5.4.b — Manuseio | Parcial | content_hash e is_current em document_versions; sem lock pós-publicação em GRI/Integrados |
| 8.5.4.c — Controle de contaminação | Parcial | RLS em 100% das tabelas; sem log de exportações; sem hash de saídas exportadas |
| 8.5.4.d — Embalagem (n/a para SaaS) | N/A | Não aplicável — produto digital |
| 8.5.4.e — Armazenagem | Parcial | Supabase Storage para documentos; sem política de retenção com enforcement; backup não verificável |
| 8.5.4.f — Transmissão/transporte | Parcial | HTTPS implícito (Supabase); sem hash de integridade em exportações |

### 8.1 — Planejamento de controle operacional (risco de preservação)

| Aspecto | Status | Evidência / Gap |
|---|---|---|
| Análise de riscos para preservação | Não atendido | Sem documento formal de análise de riscos de preservação em `docs/` |
| Critérios de aceitação para preservação | Parcial | RLS e versionamento cobrem parte; sem critério formal de "produto preservado" |
| Informação documentada de preservação | Não atendido | Sem política de retenção com enforcement; sem política de backup documentada |
| Monitoramento de riscos de preservação | Não verificável | `alertMonitoring.ts` presente; sem alerta específico de risco de preservação de produto |

---

## Referência Cruzada com 8.5.3

O relatório anterior `req-normativo-ISO-9001-2015-item-8-5-3.md` (score 3.2/5) auditou preservação da **propriedade do cliente**. Os achados relevantes para a preservação de produtos acabados são:

- **Achado replicado:** Ausência de notificação ao titular de propriedade em caso de incidente — lacuna que afeta tanto 8.5.3 quanto 8.5.4 (preservação de produtos acabados que são ativos do cliente).
- **Sinergia de ação:** A implementação de lock pós-aprovação (ação proposta neste relatório para relatórios GRI) resolve simultaneamente parte das lacunas de 8.5.3 para documentos contratuais de propriedade do cliente.
- **Padrão de referência validado:** `assetOwnership.ts` com `return_conditions` e `usage_restrictions` é o modelo de maturidade para preservação — deve ser replicado para o ciclo de vida de relatórios publicados.

---

## Plano de Ação Priorizado

### Faixa 1 — Imediato (0 a 30 dias)

| # | Ação | Impacto | Esforço |
|---|---|---|---|
| A1 | Implementar lock pós-publicação em `updateGRIReport()`: adicionar verificação `if (existingReport.status === 'Publicado') throw new Error(...)` antes do update; replicar para `deleteGRIReport()` e `updateIntegratedReport()` | Crítico — 8.5.4.a/b | Baixo (2-3h) |
| A2 | Implementar soft-delete em `gri_reports` e `integrated_reports`: migration adicionando `archived_at` + `is_archived`; substituir `deleteGRIReport()` por `archiveGRIReport()` | Crítico — 8.5.4.a | Baixo (1 dia) |

### Faixa 2 — Curto Prazo (30 a 90 dias)

| # | Ação | Impacto | Esforço |
|---|---|---|---|
| B1 | Implementar soft-delete em indicadores ESG: migration adicionando `deleted_at` em `quality_indicators` e `indicator_measurements`; adaptar queries para filtrar `deleted_at IS NULL` | Maior — 8.5.4.a | Médio (3-5 dias) |
| B2 | Adicionar hash de integridade em exportações: ao gerar arquivo para download, calcular SHA-256, registrar em tabela `export_logs` (user_id, timestamp, file_hash, record_type, filters_applied) | Maior — 8.5.4.b/c | Médio (5-7 dias) |
| B3 | Criar política de retenção com enforcement: tabela `retention_policies` com campos `record_type`, `min_retention_days`, `auto_archive_after_days`; job agendado via Supabase Edge Functions para alertar expiração | Maior — 8.1 | Médio-alto (1-2 semanas) |

### Faixa 3 — Médio Prazo (90 a 180 dias)

| # | Ação | Impacto | Esforço |
|---|---|---|---|
| C1 | Documentar política formal de preservação em `docs/processes/preservacao-produtos.md`: categorias de produtos acabados, riscos aplicáveis (perda, corrupção, acesso indevido, desastre), controles e responsáveis | Maior — 8.1 | Médio (3-5 dias) |
| C2 | Verificar e documentar política de backup Supabase: confirmar RPO/RTO, testar restauração, registrar evidência em `docs/processes/backup-recovery.md` | Maior — 8.1 | Médio (1 semana) |
| C3 | Implementar alerta de integridade de produto acabado: trigger no banco que detecta alteração em `gri_reports.status` de `Publicado` para qualquer outro valor e gera notificação de auditoria | Moderado — 8.5.4 | Alto |

---

## Guia de Validação E2E

Para verificar conformidade com 8.5.4 (preservação de produtos acabados):

1. **Lock pós-publicação de GRI:** Criar relatório GRI, avançar status até `Publicado`, tentar chamar `updateGRIReport(id, { title: 'Alterado' })` e verificar se ocorre erro (atualmente: não ocorre — gap confirmado).
2. **Soft-delete de indicadores:** Criar indicador ESG com medições, deletá-lo via UI, consultar diretamente no banco e verificar se os dados ainda existem com flag (atualmente: hard delete — gap confirmado).
3. **Hash de integridade de exportação:** Exportar relatório CSV, fazer download duas vezes e comparar arquivos (atualmente: sem mecanismo de verificação — gap confirmado).
4. **Versionamento de documentos GED:** Criar documento, criar nova versão com `changes_summary`, verificar que versão anterior permanece com `is_current = false` e que `document_audit_trail` registra a operação (atualmente: funciona corretamente — ponto forte confirmado).
5. **Política de retenção:** Consultar banco para verificar se existe tabela ou configuração de retenção por tipo de dado (atualmente: apenas campo livre — gap confirmado).

---

## Conclusão

O Daton ESG Insight demonstra **maturidade na preservação de documentos controlados via GED** (score 4.5/5 para esse módulo específico), com versionamento imutável, audit trail e soft-delete implementados como padrão de referência. Entretanto, os mesmos controles **não foram aplicados aos relatórios de maior valor entregável** (GRI, GHG, Integrados), que podem ser editados ou deletados permanentemente mesmo após publicação.

A lacuna mais crítica — ausência de lock pós-publicação — é corrigível em horas (ação A1), transformando imediatamente o nível de preservação dos principais produtos acabados do sistema. A implementação completa das ações da Faixa 1 e Faixa 2 elevaria o score de 3.1/5 para aproximadamente 4.0/5.

A avaliação de riscos aplicáveis à preservação (exigência explícita da cláusula normativa) permanece não documentada e representa a lacuna estrutural de maior impacto a ser resolvida na Faixa 3.

**Não-conformidades por severidade:**

| Severidade | Quantidade |
|---|---|
| Crítica | 1 (ausência de lock pós-publicação de relatórios GRI/Integrados) |
| Maior | 4 (soft-delete ausente em indicadores, sem enforcement de retenção, sem hash de exportações, backup não verificável) |
| Menor | 1 (política de preservação não documentada) |
| Observação | 1 (content_hash opcional — deveria ser obrigatório em criação de versão) |
