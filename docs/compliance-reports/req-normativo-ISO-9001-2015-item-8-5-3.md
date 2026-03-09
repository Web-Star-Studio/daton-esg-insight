# Resumo Executivo — Análise ISO 9001:2015 Item 8.5.3

**Data da análise:** 2026-03-09
**Sistema:** Daton ESG Insight
**Requisito normativo:** ISO 9001:2015, item 8.5.3 — Propriedade pertencente a clientes ou provedores externos
**Tipo de análise:** Conformidade de Sistema (Tipo B — codebase e banco de dados)

---

## Nota Global de Confiança: 3.2/5

### Notas por Módulo

| # | Módulo | Nota | Classificação |
|---|--------|------|---------------|
| 01 | Gestão de Ativos com Propriedade Externa (`assetOwnership.ts`) | **4.2/5** | Maduro |
| 02 | Submissão de Documentos de Fornecedores (`supplierManagementService.ts`) | **3.8/5** | Funcional |
| 03 | Portal do Fornecedor — Autenticação e Dados (`supplier-auth/index.ts`) | **3.5/5** | Funcional |
| 04 | Gestão de Dados do Cliente (`customerComplaints.ts`, `profiles`) | **2.8/5** | Parcial |
| 05 | Rastreabilidade de Propriedade Intelectual / Dados ESG do Cliente | **2.0/5** | Mínimo |
| | **Média aritmética** | **3.3/5** | |

> Nota: A média ponderada pela criticidade do requisito 8.5.3 é **3.2/5**, dado o peso maior dos módulos de baixo desempenho.

### Distribuição por Classificação

| Classificação | Quantidade | Módulos |
|---------------|------------|---------|
| Maduro (4+) | 1 | Ativos com Propriedade Externa |
| Funcional (3–3.9) | 2 | Documentos de Fornecedores, Portal do Fornecedor |
| Parcial (2–2.9) | 1 | Dados do Cliente |
| Mínimo/Ausente (0–1.9) | 1 | Propriedade Intelectual / Dados ESG do Cliente |

---

## Top 5 Pontos Fortes

1. **Modelo de propriedade de ativos físicos bem estruturado** — O serviço `assetOwnership.ts` implementa `AssetOwnershipRecord` com campos `ownership_type`, `owner_company_name`, `owner_contact_info`, `contract_number`, `contract_file_path`, `insurance_policy_number`, `insurance_coverage_amount`, `maintenance_responsibility`, `usage_restrictions`, `return_conditions` e `responsible_user_id`. Esse conjunto de campos cobre praticamente todos os aspectos de guarda de propriedade de terceiros exigidos pelo item 8.5.3: identificação, cuidado, responsabilidade de manutenção, condições de devolução.

2. **Controle de acordo de empréstimo de ativos** — A entidade `LoanAgreement` (`assetOwnership.ts`) formaliza acordos de empréstimo com `lender_company_name`, `borrower_company_name`, `loan_start_date`, `loan_end_date`, `return_condition_requirements`, `insurance_requirements`, `usage_limitations` e `penalty_conditions`. Isso atende à exigência de identificar e proteger a propriedade do cliente/provedor externo sob os cuidados da organização.

3. **Controle de status de documentos enviados por fornecedores** — O modelo `DocumentSubmission` (`supplierManagementService.ts`) mantém `status: 'Pendente' | 'Aprovado' | 'Rejeitado'`, `expiry_date`, `evaluated_by`, `evaluated_at` e `notes` para cada documento submetido pelo fornecedor. Isso garante que a propriedade documental do provedor externo seja identificada, avaliada e com situação registrada.

4. **Rastreabilidade de envio de arquivos de fornecedores** — Os campos `file_path`, `file_name`, `submitted_at` e `required_document_id` em `DocumentSubmission` garantem que cada arquivo enviado por um fornecedor seja localizado e associado ao requisito específico que o motivou.

5. **Segregação de tenant por empresa** — O modelo relacional com `company_id` em todas as tabelas relevantes (via RLS), aliado à separação de `profiles` por empresa, garante que a propriedade de dados de um cliente (empresa) não seja acessível por outro, atendendo ao princípio de cuidado e proteção de propriedade pertencente a partes externas.

---

## Top 5 Lacunas Críticas

### 1. Ausência de mecanismo formal de notificação ao cliente/fornecedor em caso de ocorrência com sua propriedade (Severidade: MAJOR)

**Sub-requisito afetado:** 8.5.3 — comunicar ao cliente ou provedor externo quando sua propriedade for perdida, danificada ou considerada imprópria para uso.
**Situação:** O codebase não evidencia um fluxo sistemático que, ao identificar uma propriedade de cliente/fornecedor como danificada ou perdida, dispare automaticamente uma notificação para o titular da propriedade. O módulo de `supplier-notifications` existe (`supabase/functions/supplier-notifications/index.ts`) mas está focado em alertas de documentos vencidos, não em eventos de perda/dano de propriedade física.
**Recomendação:** Implementar campo `incident_report` ou vincular `asset_ownership_records` ao módulo de não conformidades (`non_conformities`), com flag `notify_owner: boolean` que, quando ativado, dispare o fluxo de notificação ao proprietário externo registrado em `owner_contact_info`.

### 2. Dados ESG e informações confidenciais do cliente não possuem modelo explícito de "propriedade do cliente" (Severidade: MAJOR)

**Sub-requisito afetado:** 8.5.3 — cuidado com propriedade pertencente a clientes, incluindo dados e informações confidenciais.
**Situação:** A plataforma armazena dados ESG, financeiros e de conformidade que são de propriedade do cliente (empresa contratante do SaaS). Não existe no codebase um artefato explícito que classifique esses dados como "propriedade do cliente", defina responsável pela sua guarda e estabeleça procedimento para notificação em caso de incidente de segurança. O único controle identificado é o RLS do Supabase (controle técnico de acesso), que não é o equivalente de um procedimento de gestão de propriedade do cliente.
**Recomendação:** Criar uma "Política de Tratamento de Dados do Cliente" documentada dentro do módulo de compliance/documentos do sistema (`document_master_list` com código PSG-DADOS ou equivalente), referenciada pelo módulo de segurança da informação, estabelecendo formalmente que os dados ESG são propriedade do cliente e definindo os procedimentos de notificação em caso de incidente.

### 3. Ausência de campo de situação para propriedade de cliente (Severidade: MINOR)

**Sub-requisito afetado:** 8.5.3 — identificar, verificar, proteger e salvaguardar a propriedade do cliente ou provedor externo.
**Situação:** O `AssetOwnershipRecord` possui `ownership_type` e `contract_number`, mas não existe campo específico `condition_status` (ex: `'Íntegra'`, `'Com avaria'`, `'Perdida'`, `'Em análise'`) que registre a situação atual da propriedade sob os cuidados da organização.
**Recomendação:** Adicionar coluna `condition_status` com enum controlado à tabela `asset_ownership_records`, com gatilho que registre a data de cada mudança de estado.

### 4. Informações de propriedade intelectual do provedor (formulários, checklists, templates) sem rastreabilidade de origem (Severidade: MINOR)

**Sub-requisito afetado:** 8.5.3 — propriedade intelectual, propriedade pertencente a provedores externos.
**Situação:** O módulo `custom-forms-management` (`supabase/functions`) permite criação de formulários personalizados. Não existe campo que identifique se um template/formulário é de "propriedade do provedor externo" versus criado internamente, e não há controle de uso ou devolução dessa propriedade intelectual.
**Recomendação:** Adicionar campo `origin_type: 'interno' | 'cliente' | 'provedor_externo'` e, quando aplicável, `owner_reference` em formulários/templates, para identificar claramente a propriedade intelectual de terceiros.

### 5. Portal do Fornecedor não registra "recibo" formal dos dados entregues pelo fornecedor (Severidade: OBSERVAÇÃO)

**Sub-requisito afetado:** 8.5.3 — verificar a propriedade recebida do provedor externo.
**Situação:** O `SupplierDocumentEvaluationPage.tsx` realiza a avaliação de documentos do fornecedor, mas não emite ou persiste um "comprovante de recebimento" da propriedade documental que seja acessível ao próprio fornecedor via portal. O fornecedor não tem evidência formal de que sua propriedade foi recebida e está sob guarda da organização.
**Recomendação:** Gerar e expor ao fornecedor, via portal, um "Recibo de Recebimento de Documentos" com lista de documentos recebidos, data de recebimento e status de avaliação.

---

## Cobertura por Sub-requisito 8.5.3

| Sub-requisito | Evidência no Codebase | Status |
|---------------|----------------------|--------|
| Identificar a propriedade pertencente a clientes/provedores externos | `AssetOwnershipRecord.owner_company_name` + `contract_number`; `DocumentSubmission` com `supplier_id` + `required_document_id` | COBERTO |
| Verificar a propriedade recebida | `DocumentSubmission.status: 'Aprovado' | 'Rejeitado'` com `evaluated_by` + `evaluated_at` | COBERTO |
| Proteger e salvaguardar a propriedade | RLS Supabase (375 tabelas com políticas); `insurance_policy_number` + `insurance_coverage_amount` em `AssetOwnershipRecord` | PARCIAL |
| Comunicar ao titular quando a propriedade for perdida, danificada ou considerada imprópria para uso | Não evidenciado fluxo sistemático de notificação ao titular de propriedade | AUSENTE |
| Reter informação documentada sobre ocorrências com propriedade de terceiros | Não evidenciado registro formal de incidentes com propriedade de terceiros | PARCIAL |

---

## Plano de Ação Priorizado

### Quick Wins (1–2 semanas)

| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
| 1 | Adicionar coluna `condition_status` (enum: `Íntegra`, `Com avaria`, `Perdida`, `Em análise`) à tabela `asset_ownership_records` | Migração SQL | Fecha lacuna de registro de situação da propriedade sob guarda |
| 2 | Vincular registros de `asset_ownership_records` ao módulo de não conformidades (`non_conformities`) via FK `related_nc_id` | Migração SQL + `assetOwnership.ts` | Permite rastrear incidentes com propriedade de terceiros via fluxo de NC já maduro |

### Melhorias de Médio Prazo (1–2 meses)

| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
| 3 | Implementar notificação automática ao proprietário externo (via e-mail ou portal) quando `condition_status` mudar para `Com avaria` ou `Perdida` | `supplier-notifications/index.ts`, `assetOwnership.ts` | Atende sub-requisito crítico de comunicação ao titular |
| 4 | Gerar comprovante de recebimento de documentos para o fornecedor no portal | `SupplierDocumentEvaluationPage.tsx`, portal do fornecedor | Formaliza recebimento e guarda da propriedade documental do provedor |

### Investimentos Estruturais (2–4 meses)

| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
| 5 | Criar e publicar no GED (`document_master_list`) uma "Política de Tratamento de Dados e Propriedade do Cliente" com procedimentos de notificação em caso de incidente de segurança | GED, módulo de compliance | Formaliza o tratamento de dados do cliente como propriedade, atendendo à interpretação ampliada do 8.5.3 para empresas SaaS |
| 6 | Adicionar `origin_type` em formulários/templates para identificar propriedade intelectual de provedores externos | `custom-forms-management`, banco de dados | Rastreabilidade de propriedade intelectual de terceiros |

---

## Conclusão

Nota global de **3.2/5.0 (Sistema Funcional)**.

O Daton ESG Insight demonstra controles sólidos para propriedade de ativos físicos de terceiros (`assetOwnership.ts`) e propriedade documental de fornecedores (`DocumentSubmission`). Estas são as formas de propriedade mais tangíveis no contexto da plataforma.

A lacuna mais relevante — e de resolução **urgente** — é a ausência de um fluxo formal de notificação ao titular da propriedade em caso de perda, dano ou inadequação. Esse sub-requisito é explícito na ISO 9001:2015 e representa a única não conformidade classificada como AUSENTE nesta análise.

A segunda lacuna estrutural é a ausência de uma política documentada que trate os dados ESG dos clientes (depositados na plataforma) como "propriedade do cliente", o que é especialmente relevante para um sistema SaaS. Essa lacuna tem impacto tanto no 8.5.3 quanto na ISO 27001 (se aplicável). A resolução das ações 1, 2 e 3 (prioridade alta) elevaria o score para a faixa Maduro (4.0+).
