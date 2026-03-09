# Resumo Executivo — Análise ISO 9001:2015 Item 8.5.2

**Data da análise:** 2026-03-09
**Sistema:** Daton ESG Insight
**Requisito normativo:** ISO 9001:2015, item 8.5.2 — Identificação e rastreabilidade
**Tipo de análise:** Conformidade de Sistema (Tipo B — codebase e banco de dados)

---

## Nota Global de Confiança: 3.8/5

### Notas por Módulo

| # | Módulo | Nota | Classificação |
|---|--------|------|---------------|
| 01 | Gestão de Não-Conformidades (`nonConformityService.ts`, `NaoConformidades.tsx`) | **4.5/5** | Maduro |
| 02 | Gestão de Resíduos (`waste.ts`, migração `20250910034544`) | **4.2/5** | Maduro |
| 03 | Gestão de Licenças (`licenses`, migração `20250910033457`) | **4.1/5** | Maduro |
| 04 | Gestão Documental — GED (`gedDocuments.ts`, `documentCenter.ts`) | **3.8/5** | Funcional |
| 05 | Módulo de Entregas de Fornecedores (`supplierDeliveriesService.ts`) | **3.5/5** | Funcional |
| 06 | Relatórios GRI / ESG (`griReports.ts`, `integratedReports.ts`) | **3.0/5** | Parcial |
| | **Média aritmética** | **3.8/5** | |

### Distribuição por Classificação

| Classificação | Quantidade | Módulos |
|---------------|------------|---------|
| Maduro (4+) | 3 | NCs, Resíduos, Licenças |
| Funcional (3–3.9) | 2 | GED, Entregas de Fornecedores |
| Parcial (2–2.9) | 0 | — |
| Mínimo/Ausente (0–1.9) | 1 | Relatórios GRI/ESG (identificação das saídas como produto final) |

---

## Top 5 Pontos Fortes

1. **Numeração sequencial auditável de NCs** — O campo `nc_number` (padrão `NC-AAAA-NNNN`, gerado automaticamente) garante identificação única e inequívoca de cada saída de processo de tratamento de inconformidade. O campo `status` (com valores tipados: `Aberta`, `Em Análise`, `Concluída`) satisfaz plenamente a exigência de identificação da situação da saída (8.5.2.a).

2. **Rastreabilidade por ator e tempo nos documentos** — O modelo `DocumentVersion` (`gedDocuments.ts`) mantém `version_number`, `created_by_user_id`, `created_at`, `is_current` e `changes_summary`, provendo cadeia de custódia completa para cada versão de documento gerada pelo sistema.

3. **Enum tipado de situação de resíduos** — O tipo `waste_status_enum` (migração `20250910034544`) define os estados `'Coletado'`, `'Em Trânsito'`, `'Destinação Finalizada'` para `waste_logs`, garantindo identificação formal da situação das saídas de resíduo ao longo de todo o ciclo de destinação.

4. **Rastreabilidade por MTR** — O campo `mtr_number` em `WasteLogListItem` (tabela `waste_logs`) vincula cada lote de resíduo ao Manifesto de Transporte de Resíduos, assegurando rastreabilidade legal e normativa da saída desde a geração até a destinação final.

5. **Status de licenças com enum controlado** — O enum `license_status_enum` (`'Ativa'`, `'Em Renovação'`, `'Vencida'`, `'Suspensa'`) na tabela `licenses` garante identificação formal da situação de cada documento regulatório que representa uma saída de conformidade legal.

---

## Top 5 Lacunas Críticas

### 1. Ausência de identificação formal de situação das saídas de relatórios ESG/GRI (Severidade: MAJOR)

**Sub-requisito afetado:** 8.5.2 — identificação da situação das saídas.
**Situação:** O serviço `griReports.ts` e `integratedReports.ts` não evidenciam um campo de status explicitamente tipado para o relatório como "produto final entregue ao cliente/parte interessada". O `report_status_enum` existe no banco (referenciado em `backend-database-er.md`), mas os serviços de consulta não expõem nem exibem esse status de forma padronizada na interface de consulta pública.
**Recomendação:** Garantir que a interface de relatórios mostre explicitamente o status de cada relatório gerado (Rascunho / Em Revisão / Aprovado / Publicado) e que esse ciclo seja rastreável com data e responsável.

### 2. Falta de número de identificação único para entregas de fornecedores (Severidade: MINOR)

**Sub-requisito afetado:** 8.5.2 — identificação única da saída quando a rastreabilidade é requisito.
**Situação:** O campo `reference_number` em `SupplierDelivery` (`supplierDeliveriesService.ts`) é `string | null` — ou seja, **opcional**. Quando ausente, não há identificador único garantido para a entrega, dificultando rastreabilidade caso o cliente solicite histórico.
**Recomendação:** Tornar `reference_number` obrigatório ou implementar geração automática de identificador (ex.: `ENT-AAAA-NNNN`) análoga ao `nc_number`.

### 3. Identificação de situação de documentos não vinculada ao ciclo de vida completo (Severidade: MINOR)

**Sub-requisito afetado:** 8.5.2 — situação das saídas ao longo da realização do produto/serviço.
**Situação:** O modelo `DocumentApproval` em `gedDocuments.ts` define `status: 'rascunho' | 'em_aprovacao' | 'aprovado' | 'rejeitado' | 'obsoleto'`, mas esse status existe em tabela separada (`document_approvals`). A entidade principal `Document` (em `documents.ts`) não possui campo `status` nativo — o status é inferido via join, o que fragiliza queries diretas de auditoria.
**Recomendação:** Promover o campo `status` para a tabela `documents` como coluna indexada, eliminando a necessidade de join para identificação da situação atual do documento.

### 4. Ausência de rastreabilidade de lote/série para saídas de serviço de consultoria ESG (Severidade: OBSERVAÇÃO)

**Sub-requisito afetado:** 8.5.2 — rastreabilidade quando aplicável.
**Situação:** Para os serviços prestados pela plataforma (ex: diagnósticos de conformidade, planos de ação, relatórios GRI gerados por IA), não existe um identificador de "lote de serviço prestado" que vincule o conjunto de saídas a uma versão específica do motor de IA utilizado ou ao conjunto de dados de entrada.
**Recomendação:** Registrar em `gri_reports` ou entidade equivalente o `model_version` do processamento de IA, a data de geração e os IDs dos dados de entrada utilizados.

### 5. Informação documentada de rastreabilidade não é retida explicitamente em todos os módulos (Severidade: OBSERVAÇÃO)

**Sub-requisito afetado:** 8.5.2 — reter informações documentadas para controle de rastreabilidade.
**Situação:** Módulos como `dataCollection.ts`, `indicatorManagement.ts` e `esgPerformance.ts` não evidenciam retenção explícita de histórico de valores — apenas o valor atual é armazenado sem cadeia auditável de alterações.
**Recomendação:** Implementar tabela de histórico de medições ou trigger de audit log em tabelas de indicadores e coleta de dados ESG.

---

## Cobertura por Sub-requisito 8.5.2

| Sub-requisito | Evidência no Codebase | Status |
|---------------|----------------------|--------|
| Identificar as saídas quando necessário para assegurar a conformidade | `nc_number` (NC), `mtr_number` (resíduos), `complaint_number` (reclamações), `document_code` (GED), `license` (licenças) | COBERTO |
| Identificar a situação das saídas em relação aos requisitos de monitoramento e medição | `nc.status` (tipado), `waste_status_enum` (enum DB), `license_status_enum` (enum DB), `document_approval.status` (tipado) | COBERTO |
| Controlar a identificação única das saídas quando a rastreabilidade é requisito | NCs e reclamações possuem geração automática de número único; entregas de fornecedores têm `reference_number` opcional | PARCIAL |
| Reter informação documentada para possibilitar rastreabilidade | Histórico de versões de documentos (`document_versions`), log de aprovação de extração (`extraction_approval_log`), audit trail de documentos (`document_audit_trail`) | COBERTO |

---

## Plano de Ação Priorizado

### Quick Wins (1–2 semanas)

| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
| 1 | Tornar `reference_number` obrigatório em `supplier_deliveries` ou adicionar geração automática `ENT-AAAA-NNNN` | `supplierDeliveriesService.ts`, migração SQL | Fecha lacuna de identificação única de entregas (8.5.2 — rastreabilidade) |
| 2 | Adicionar coluna `status` indexada na tabela `documents` refletindo o status da aprovação mais recente | Migração SQL + `documents.ts` | Simplifica queries de auditoria de situação de documentos |

### Melhorias de Médio Prazo (1–2 meses)

| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
| 3 | Expor e exibir `report_status` na interface de relatórios GRI/ESG, com data de aprovação e responsável | `griReports.ts`, componentes de relatório | Demonstra identificação de situação das saídas de relatório |
| 4 | Registrar `model_version` e IDs de dados de entrada nos metadados de relatórios gerados por IA | `gri-report-ai-configurator`, `griReports.ts` | Rastreabilidade de saídas de serviço com componente de IA |

### Investimentos Estruturais (2–4 meses)

| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
| 5 | Implementar trigger de audit log (`audit_log` universal) para tabelas de indicadores e coleta de dados ESG | Supabase migrations, `indicatorManagement.ts` | Rastreabilidade completa de valores de métricas ao longo do tempo |

---

## Conclusão

Nota global de **3.8/5.0 (Sistema Funcional com tendência a Maduro)**.

O Daton ESG Insight demonstra controles sólidos de identificação e rastreabilidade nos seus módulos de maior risco operacional: não conformidades, resíduos e licenças. A combinação de numeração automática, enums tipados e RLS garante identificação inequívoca das principais saídas do sistema.

As lacunas identificadas concentram-se em: (a) entregas de fornecedores com `reference_number` opcional, (b) status de documentos inferido por join em vez de coluna direta, e (c) ausência de rastreabilidade de versão de IA em relatórios gerados automaticamente. Nenhuma dessas lacunas compromete a auditabilidade central do sistema, mas representam oportunidades de melhoria para atingir nível Maduro (4.0+) neste requisito.
