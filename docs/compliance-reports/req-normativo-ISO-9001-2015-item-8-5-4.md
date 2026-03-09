# Resumo Executivo — Análise ISO 9001:2015 Item 8.5.4

**Data da análise:** 2026-03-09
**Sistema:** Daton ESG Insight
**Requisito normativo:** ISO 9001:2015, item 8.5.4 — Preservação
**Tipo de análise:** Conformidade de Sistema (Tipo B — codebase e banco de dados)

---

## Nota Global de Confiança: 3.7/5

### Notas por Módulo

| # | Módulo | Nota | Classificação |
|---|--------|------|---------------|
| 01 | Versionamento de Documentos — GED (`gedDocuments.ts`) | **4.5/5** | Maduro |
| 02 | Gestão de Resíduos — Cadeia de Custódia (`waste.ts`, `wasteDisposal.ts`) | **4.3/5** | Maduro |
| 03 | Gestão Documental — Master List e Cópias Controladas (`gedDocuments.ts`) | **4.2/5** | Maduro |
| 04 | Controle de Submissões de Fornecedores — Validade e Expiração (`supplierManagementService.ts`) | **3.8/5** | Funcional |
| 05 | Preservação de Dados de Indicadores ESG (`indicatorManagement.ts`, `esgPerformance.ts`) | **2.8/5** | Parcial |
| 06 | Preservação de Relatórios Gerados por IA (`gri-report-ai-configurator`) | **2.5/5** | Parcial |
| | **Média aritmética** | **3.7/5** | |

### Distribuição por Classificação

| Classificação | Quantidade | Módulos |
|---------------|------------|---------|
| Maduro (4+) | 3 | GED/Versionamento, Resíduos, Master List |
| Funcional (3–3.9) | 1 | Submissões de Fornecedores |
| Parcial (2–2.9) | 2 | Indicadores ESG, Relatórios IA |
| Mínimo/Ausente (0–1.9) | 0 | — |

---

## Top 5 Pontos Fortes

1. **Versionamento imutável de documentos** — O serviço `documentVersionsService` (`gedDocuments.ts`) exige `changes_summary` não nulo para criar qualquer nova versão (`if (!changesSummary) throw new Error(...)`), impedindo criação silenciosa de versões sem rastreabilidade. A imutabilidade histórica é garantida pelo campo `is_current: boolean` — versões anteriores são preservadas sem sobrescrita.

2. **Cadeia de custódia de resíduos desde a geração até a destinação** — O `waste_status_enum` (`'Coletado' -> 'Em Trânsito' -> 'Destinação Finalizada'`) combinado com `mtr_number`, `transporter_name`, `transporter_cnpj`, `destination_name`, `destination_cnpj` e `final_treatment_type` em `waste_logs` implementa cadeia de custódia completa, preservando a integridade e rastreabilidade das saídas de resíduo do início ao fim do seu ciclo de vida.

3. **Master List com datas de validade e revisão** — O modelo `MasterListItem` (`gedDocuments.ts`) inclui `effective_date`, `review_date`, `version`, `distribution_list` e `is_active`, garantindo que documentos preservados não sejam usados além de sua validade e que a distribuição controlada seja registrada.

4. **Cópias controladas com localização e destinatário** — O modelo `ControlledCopy` (`gedDocuments.ts`) persiste `copy_number`, `assigned_to_user_id`, `assigned_department`, `location`, `status`, `distributed_date` e `last_updated`, permitindo saber exatamente onde cada cópia controlada de um documento está e sua situação atual.

5. **Controle de expiração de documentos de fornecedores** — O campo `expiry_date` em `DocumentSubmission` (`supplierManagementService.ts`), combinado com `next_evaluation_date` e `evaluation_status`, garante que documentos de fornecedores não sejam preservados indefinidamente sem controle de validade. O módulo de alertas (`supplier-auto-alerts/index.ts`) complementa com notificações proativas de vencimento.

---

## Top 5 Lacunas Críticas

### 1. Ausência de política explícita de retenção e descarte para dados de indicadores ESG (Severidade: MAJOR)

**Sub-requisito afetado:** 8.5.4 — preservar as saídas durante a produção e a prestação do serviço para assegurar a conformidade com os requisitos.
**Situação:** Os dados de coleta de indicadores ESG (`dataCollection.ts`, `indicatorManagement.ts`) são armazenados no banco, mas não existe no codebase evidência de: (a) política de retenção mínima dos dados históricos, (b) mecanismo de backup diferencial ou restore point para esses dados, nem (c) proteção contra exclusão acidental (ex: soft delete). A ausência de histórico de mudanças em valores de indicadores (auditado em 8.5.2, item 5 das lacunas) agrava esta situação aqui.
**Recomendação:** Implementar soft delete (`deleted_at timestamp`) nas tabelas de indicadores e medições, definir período mínimo de retenção (ex: 5 anos para dados GRI) e documentar a política de backup no GED da organização.

### 2. Relatórios gerados por IA não possuem mecanismo formal de imutabilidade após aprovação (Severidade: MAJOR)

**Sub-requisito afetado:** 8.5.4 — preservar as saídas para assegurar a conformidade com os requisitos.
**Situação:** Os relatórios GRI gerados pelas funções `gri-report-ai-configurator` e `gri-content-generator` são saídas críticas do serviço prestado ao cliente. Não existe no codebase evidência de que, após aprovação do relatório (`report_status = 'Aprovado'`), o conteúdo seja congelado (imutável). Um usuário com permissão de edição pode modificar seções após aprovação sem que isso seja registrado como nova versão.
**Recomendação:** Implementar lock de edição para relatórios aprovados (status `'Aprovado'` deve ser só-leitura para conteúdo, exceto via fluxo de nova revisão com aprovação explícita), e armazenar snapshot do conteúdo aprovado em tabela separada para preservação.

### 3. Preservação de arquivos físicos em storage sem controle de integridade (Severidade: MINOR)

**Sub-requisito afetado:** 8.5.4 — identificação, manuseio, controle de contaminação, embalagem, armazenamento, transmissão ou transporte e proteção.
**Situação:** O upload de arquivos em `documentExtraction.ts` gera um `storage_path` no Supabase Storage, mas não existe campo `content_hash` obrigatório no momento do upload do arquivo original. O hash é opcional em `DocumentVersion.content_hash?: string`. Isso significa que a integridade do arquivo armazenado não é verificada proativamente — uma corrupção silenciosa no storage não seria detectada.
**Recomendação:** Calcular e persistir `content_hash` (SHA-256) de forma obrigatória no upload e implementar verificação periódica de integridade dos arquivos armazenados.

### 4. Falta de controle de validade para saídas de dados de coleta ESG (Severidade: MINOR)

**Sub-requisito afetado:** 8.5.4 — preservação adequada das saídas para assegurar a conformidade com os requisitos ao longo do tempo.
**Situação:** Os dados coletados pelo módulo `dataCollection.ts` não possuem `expiry_date` ou `valid_until` — a validade dos dados de coleta (ex: uma medição de energia coletada em uma data específica) não é formalmente encerrada quando uma nova medição substitui a anterior. Isso pode gerar ambiguidade sobre qual valor representa a "saída válida" para um determinado período.
**Recomendação:** Implementar campo `valid_from` e `valid_until` em registros de medição, garantindo que o sistema saiba qual é a saída válida para cada período sem ambiguidade.

### 5. Ausência de processo de verificação periódica da preservação (Severidade: OBSERVAÇÃO)

**Sub-requisito afetado:** 8.5.4 — assegurar a conformidade com os requisitos durante a preservação.
**Situação:** Não há evidência no codebase de um processo automatizado ou agendado que verifique periodicamente se as saídas preservadas (documentos, dados ESG, relatórios aprovados) continuam íntegros, acessíveis e dentro de prazo de validade. Existem alertas pontuais (licenças, documentos de fornecedores) mas não uma rotina de "health check" de preservação abrangente.
**Recomendação:** Implementar uma função agendada (Supabase Cron ou equivalente) que execute verificação periódica de integridade e validade das saídas críticas, registrando o resultado em tabela de auditoria.

---

## Cobertura por Sub-requisito 8.5.4

| Sub-requisito | Evidência no Codebase | Status |
|---------------|----------------------|--------|
| Identificação das saídas preservadas | `mtr_number` (resíduos), `document_code` (GED), `copy_number` (cópias controladas), `complaint_number` (reclamações) | COBERTO |
| Manuseio e controle de contaminação | Segregação lógica por `company_id` + RLS (375 tabelas); isolamento de tenant impede "contaminação" cruzada de dados | COBERTO |
| Embalagem / formatação das saídas | Upload sanitizado (`sanitizedName = file.name.replace(...)`), validação de tamanho (20MB), MIME type verificado em `documentExtraction.ts` | COBERTO |
| Armazenamento com controle de acesso | Supabase Storage + RLS; `DocumentPermission` com `permission_level` e `expires_at` em `gedDocuments.ts` | COBERTO |
| Proteção das saídas contra perda/deterioração | Soft delete não evidenciado em tabelas de indicadores; `content_hash` opcional; sem backup verificável via codebase | PARCIAL |
| Transmissão / entrega das saídas ao cliente | `ControlledCopy` com destinatário e data de distribuição; relatórios exportáveis via `griExport.ts` | COBERTO |
| Preservação durante toda a realização do produto/serviço | Versionamento de documentos (imutável); `waste_status_enum` (cadeia completa); mas relatórios IA sem lock pós-aprovação | PARCIAL |

---

## Plano de Ação Priorizado

### Quick Wins (1–2 semanas)

| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
| 1 | Tornar `content_hash` obrigatório no upload de arquivos e no `DocumentVersion.content_hash` | `documentExtraction.ts`, `gedDocuments.ts`, migração SQL | Garante verificação de integridade de arquivos preservados |
| 2 | Adicionar `deleted_at timestamp` (soft delete) nas tabelas `indicator_measurements` e `data_collection_results` | Migração SQL | Protege dados históricos de indicadores contra exclusão acidental |

### Melhorias de Médio Prazo (1–2 meses)

| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
| 3 | Implementar lock de edição em relatórios GRI aprovados (status `'Aprovado'` → somente leitura) e snapshot do conteúdo aprovado em tabela separada | `gri-report-ai-configurator`, `griReports.ts`, DB | Preservação imutável das saídas de relatório após aprovação |
| 4 | Adicionar campos `valid_from` / `valid_until` em registros de medição e coleta de dados ESG | `indicatorManagement.ts`, `dataCollection.ts`, migração SQL | Clareza sobre qual saída representa o dado válido para cada período |

### Investimentos Estruturais (2–4 meses)

| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
| 5 | Implementar função agendada de health check de preservação: verificar integridade de arquivos (hash), validade de documentos e completude de dados ESG | Supabase Cron, função Edge dedicada | Processo sistematizado de verificação de preservação (alinha ao 9.1 — monitoramento) |
| 6 | Documentar e publicar no GED da organização uma "Política de Preservação de Saídas" com prazo mínimo de retenção para cada categoria de dado (5 anos GRI, 10 anos licenças, etc.) | GED, `document_master_list` | Formaliza as decisões de preservação como informação documentada retida |

---

## Conclusão

Nota global de **3.7/5.0 (Sistema Funcional com pontos Maduros)**.

O Daton ESG Insight apresenta uma base sólida de preservação nos seus módulos mais maduros: o GED com versionamento imutável e cópias controladas, e o módulo de resíduos com cadeia de custódia completa desde a geração até a destinação final. Esses dois módulos demonstram, de forma consistente, que a organização entende e implementa o conceito de preservação das saídas.

As lacunas mais críticas estão na preservação de dados de indicadores ESG (ausência de soft delete e política de retenção formal) e na ausência de imutabilidade pós-aprovação para relatórios gerados por IA. Para um sistema cujo produto central são relatórios ESG e dados de conformidade, essas lacunas têm impacto direto na confiabilidade das saídas entregues ao cliente.

A resolução das ações 1, 2 e 3 (Quick Wins + ação de lock de relatórios) elevaria o score para a faixa Maduro (4.1+), com cobertura plena dos sub-requisitos centrais do 8.5.4.
