# Resumo Executivo — Análise ISO 9001:2015 Item 8.4.1 (Homologação de Produtos e Serviços de Fornecedores)

**Norma:** ISO 9001:2015 — Item 8.4.1 (Controle de processos, produtos e serviços providos externamente — Avaliação/Homologação de Produtos e Serviços)
**Escopo da análise:** Procedimento de avaliação/homologação de produtos e serviços fornecidos externamente — especificação, rastreabilidade por item, avaliação de conformidade no recebimento e ciclo de vida do produto/serviço homologado
**Tipo de análise:** Tipo B — Conformidade do sistema/codebase (sem documento de validação externo)
**Data:** 2026-03-09

---

## Score de Confiança

**2.7 / 5 — Parcial com lacunas relevantes**

O sistema possui cadastro de produtos e serviços por fornecedor (`SupplierProductsServicesPage.tsx`) e integração com avaliações de entrega (`supplierDeliveriesService.ts`), mas não existe um ciclo formal de **homologação de produto/serviço** — ou seja, um processo que registra se um item específico foi avaliado, aprovado para uso e mantém o histórico de aprovações por item. A avaliação existente é voltada ao fornecedor (homologação de empresa), não ao produto/serviço em si.

---

## Notas por Módulo

| Módulo | Arquivo Principal | Nota | Observação |
|--------|------------------|------|------------|
| Cadastro de Produtos/Serviços por Fornecedor | `src/pages/SupplierProductsServicesPage.tsx` | 3.0 | CRUD de itens por fornecedor com tipo (produto/serviço), categoria e unidade — sem status de homologação |
| Inspeção de Recebimento / Entregas | `src/services/supplierDeliveriesService.ts` | 2.8 | Registra entregas com referência opcional; sem inspeção estruturada por item |
| Avaliação de Critérios (AVA2) | `src/services/supplierCriteriaService.ts` | 2.5 | Avalia o fornecedor, não o produto; critérios genéricos não vinculados a itens |
| Falhas de Fornecimento | `src/services/supplierFailuresService.ts` | 3.5 | Permite registrar falha com tipo `quality` — mas sem vínculo a `supplier_product_service_id` |
| Homologação de Produto (processo formal) | — | 0.0 | Inexistente — sem tabela `product_approvals`, `item_qualification_status` ou equivalente |
| Especificação de requisitos por item | — | 0.0 | Sem campo de especificação técnica, norma de referência ou requisito mínimo por produto/serviço |
| Documento Formal de Procedimento | `docs/` | 0.0 | Ausente — sem procedimento documentado de homologação de produtos/serviços |

---

## Top 5 Pontos Fortes

1. **Cadastro estruturado de produtos e serviços por fornecedor** (`SupplierProductsServicesPage.tsx`, `supplierManagementService.ts` — `getSupplierProductsServices()`): tabela `supplier_products_services` permite registrar itens com `item_type` (produto/serviço), `name`, `description`, `category`, `unit_of_measure` e flag `is_active`. Isso fornece o inventário de itens fornecidos que serve de base para um futuro processo de homologação por item.

2. **Registro de entregas com vínculo a fornecedor e possibilidade de avaliação** (`supplierDeliveriesService.ts` — `linkEvaluation()`): as entregas registradas em `supplier_deliveries` podem ser vinculadas a avaliações AVA2 via `delivery_id` em `supplier_criteria_evaluations`. Isso cria uma cadeia de rastreabilidade entrega→avaliação, mesmo que parcial.

3. **Registro de falhas com classificação por tipo** (`supplierFailuresService.ts` linha 7): `failure_type` inclui a categoria `'quality'`, permitindo registrar falhas de qualidade do produto/serviço recebido com severidade (low/medium/high/critical). Embora sem vínculo direto ao item, registra o evento de não-conformidade no fornecimento.

4. **Soft-delete via `is_active`** (`SupplierProductsServicesPage.tsx` linha 219): produtos/serviços podem ser desativados sem exclusão física, preservando histórico de itens já fornecidos.

5. **Multi-tenant com RLS** (inferido pelo padrão do codebase — `company_id` em todas as tabelas do módulo): isolamento de dados por empresa garante que homologações de produtos de uma empresa não vazar para outra — base de segurança para escala SaaS.

---

## Top 5 Lacunas Críticas

1. **Ausência de status de homologação por produto/serviço** (Severidade: **Critical**): a tabela `supplier_products_services` contém apenas `is_active` (ativo/inativo operacional). Não existe campo `approval_status` ('Homologado', 'Em Análise', 'Reprovado', 'Suspenso'), nem `approved_by`, `approved_at` ou `approval_expiry`. Sem isso, é impossível distinguir um item cadastrado de um item formalmente homologado — qualquer produto pode ser usado no sistema sem ter passado por avaliação de conformidade. Impacta diretamente 8.4.1.b e 8.4.1.c.

2. **Sem especificação de requisitos técnicos mínimos por produto/serviço** (Severidade: **Major**): o modal de cadastro (`SupplierProductsServicesPage.tsx` linhas 262–314) coleta apenas nome, tipo, categoria, unidade e descrição livre. Não há campos para normas técnicas de referência, especificações mínimas exigidas, limites de aceitação ou requisitos ambientais/de segurança. A ISO 9001:2015, 8.4.1 exige que a organização determine os controles a aplicar sobre produtos/serviços externamente providos — o que pressupõe especificação dos requisitos desses produtos.

3. **Avaliação de entrega sem inspeção estruturada por item** (Severidade: **Major**): `supplierDeliveriesService.ts` registra entregas com campo `reference_number` opcional e sem tabela de itens inspecionados. Não há registro de quantidade conferida vs. recebida, resultado de inspeção por item da nota fiscal ou laudo de conformidade. A homologação de produto pressupõe avaliação de conformidade no recebimento — ausente no sistema. Impacta 8.4.1 e 8.6.

4. **Falhas de fornecimento sem vínculo ao produto/serviço específico** (Severidade: **Major**): `SupplierFailure` (`supplierFailuresService.ts` linha 3) não contém `product_service_id`. Uma falha de qualidade é registrada contra o fornecedor, não contra o item que gerou a falha. Isso impede análise de reincidência por produto e decisão fundamentada de desomologação de um item específico. Impacta 8.4.1.b (critérios de re-avaliação) e 10.2 (ações corretivas).

5. **Sem processo formal de aprovação de novos itens antes de uso operacional** (Severidade: **Major**): o fluxo atual permite que qualquer usuário cadastre um produto/serviço e imediatamente o utilize em entregas/contratos, sem etapa de aprovação técnica. Um processo de homologação de produto exige, no mínimo: solicitação → análise técnica → aprovação → registro do aprovador → vigência da homologação. Nenhuma dessas etapas está modelada no sistema.

---

## Cobertura por Sub-requisito (ISO 9001:2015, 8.4.1 — foco em produtos/serviços)

| Sub-requisito | Texto normativo (resumido) | Status | Evidência / Lacuna |
|---------------|---------------------------|--------|--------------------|
| 8.4.1 geral | Determinar e aplicar controles sobre produtos/serviços externos | Nao atende | Cadastro existe; processo de homologação por item ausente |
| 8.4.1.a | Garantir que produtos/serviços externos não afetam entrega de conformes | Parcial | Falhas registradas; sem vinculação a item específico |
| 8.4.1.b | Critérios de avaliação, seleção, monitoramento e re-avaliação de fornecimentos | Nao atende | Critérios existentes avaliam fornecedor (empresa), não produto/serviço |
| 8.4.1.c | Manter informação documentada sobre avaliações e resultados | Nao atende | Sem tabela de homologações por item; sem histórico de aprovações |
| 8.4.3 (relacionado) | Comunicar aos fornecedores os requisitos dos produtos/serviços | Nao atende | Sem campo de especificação técnica comunicável ao fornecedor |

---

## Plano de Ação Priorizado

### Faixa 1 — Curto Prazo (0–30 dias)

- **PA-01:** Adicionar campos `approval_status ENUM('pendente','em_analise','homologado','reprovado','suspenso')`, `approved_by UUID`, `approved_at TIMESTAMPTZ` e `approval_notes TEXT` à tabela `supplier_products_services`. Exibir badge de status na listagem de `SupplierProductsServicesPage.tsx`. Impacta: 8.4.1.b, 8.4.1.c.

- **PA-02:** Adicionar campo `supplier_product_service_id UUID` (FK opcional) na tabela `supplier_supply_failures` — permitindo registrar a falha de qualidade contra o item específico. Atualizar `SupplierFailuresPage.tsx` para exibir e filtrar por produto/serviço. Impacta: 8.4.1.b, 10.2.

### Faixa 2 — Médio Prazo (30–90 dias)

- **PA-03:** Criar tabela `supplier_product_qualifications` com colunas: `product_service_id`, `qualification_status`, `qualified_by`, `qualified_at`, `expiry_date`, `technical_spec`, `reference_norm`, `notes` — registrando o ciclo completo de homologação por item. Criar tela de gestão acessível a partir do detalhe do produto em `SupplierProductsServicesPage.tsx`. Impacta: 8.4.1.b, 8.4.1.c.

- **PA-04:** Adicionar seção de especificação técnica no formulário de cadastro de produto/serviço: campos `technical_requirements` (textarea), `reference_standards` (texto livre ou multiselect com normas), `min_acceptance_criteria`. Esses dados devem ser visíveis no portal do fornecedor para comunicação dos requisitos. Impacta: 8.4.3.

### Faixa 3 — Longo Prazo (90+ dias)

- **PA-05:** Implementar inspeção de recebimento estruturada por item de entrega — tabela `delivery_inspection_items` vinculada a `supplier_deliveries`, com campos `product_service_id`, `quantity_received`, `quantity_approved`, `inspection_result`, `inspector_id`, `notes`. Integrar resultado ao histórico de homologação do produto. Impacta: 8.4.1, 8.6.

- **PA-06:** Criar documento `docs/procedimentos/PSQ-PROD-001-homologacao-produtos-servicos.md` descrevendo: critérios de homologação inicial, fluxo de aprovação, periodicidade de re-avaliação, critérios de suspensão e reabilitação de itens. Impacta: conformidade geral com 8.4.1.

---

## Guia de Validação E2E

Para validar manualmente o estado atual:

1. Acessar `/fornecedores/cadastro` → selecionar um fornecedor → navegar para "Produtos e Serviços".
2. Cadastrar novo produto com nome, tipo "produto", categoria e unidade — verificar que nenhum campo de status de homologação existe (lacuna PA-01 confirmada).
3. Tentar registrar uma falha de qualidade em `/fornecedores/falhas` — verificar ausência de campo "produto/serviço afetado" (lacuna PA-02 confirmada).
4. Acessar `/fornecedores/avaliacoes` → AVA2 de um fornecedor — verificar que critérios avaliam o fornecedor, não itens específicos.
5. Acessar `/fornecedores/entregas` — cadastrar entrega e verificar ausência de inspeção de itens (lacuna PA-05 confirmada).

---

## Conclusão

O módulo de produtos e serviços de fornecedores do Daton ESG Insight está na fase de **infraestrutura cadastral básica**: permite listar o que cada fornecedor oferece, mas não realiza homologação de produtos/serviços no sentido normativo da ISO 9001:2015, 8.4.1. A norma exige que a organização determine os controles a aplicar sobre cada produto ou serviço provido externamente, avalie sua conformidade e mantenha evidências documentadas dessas avaliações.

O gap entre o estado atual e a conformidade é mais amplo aqui do que no módulo de homologação de fornecedores (Item 41): enquanto aquele tem dois eixos de avaliação funcionais, este carece do processo central — aprovação de item, especificação técnica e inspeção de recebimento. As ações PA-01 e PA-02 (curto prazo) estabelecem a fundação mínima; PA-03 e PA-04 completam o ciclo formal; PA-05 e PA-06 atingem conformidade plena.
