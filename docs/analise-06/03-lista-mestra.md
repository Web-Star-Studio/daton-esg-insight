# Análise ISO 9001:2015 — Item 7.5: Lista Mestra

**Data da análise:** 2026-03-04
**Módulo:** Lista Mestra de Documentos
**Arquivo(s) principal(is):** `src/components/DocumentMasterListModal.tsx`, `src/services/gedDocuments.ts` (masterListService)
**Nota de confiança:** 4.0/5

---

## 1. Descrição do Módulo

A Lista Mestra é o componente de rastreamento e controle central de revisões de documentos do SGQ, conforme exigido pelo PSG-DOC. Permite registrar documentos com código, título, versão, data efetiva, data de revisão, departamento responsável e lista de distribuição. Oferece alertas automáticos para revisões vencidas e próximas, além de exportação para PDF e Excel.

O módulo é composto por: modal React (`DocumentMasterListModal.tsx`), serviço backend (`masterListService` em `gedDocuments.ts`), e tabela Supabase `document_master_list`.

## 2. Análise por Sub-requisito ISO 7.5

### 2.1 Item 7.5.1 — Generalidades

**Situação no sistema:**
- [x] Lista centralizada de todos os documentos controlados do SGQ
- [x] Vinculação com tabela `documents` via `document_id`
- [x] Campo `is_active` permite controlar documentos ativos vs inativos
- [x] Geração de relatório consolidado (`generateMasterListReport`)

**Evidências:**
- `src/services/gedDocuments.ts:309-392` — `masterListService` com `getMasterList()`, `addToMasterList()`, `updateMasterListItem()`, `removeFromMasterList()`, `generateMasterListReport()`
- `src/components/DocumentMasterListModal.tsx:40-43` — Query React: `queryKey: ['master-list']`

### 2.2 Item 7.5.2 — Criando e Atualizando

**Situação no sistema:**
- [x] **Identificação**: Código (ex: PSG-DOC), título, versão
- [x] **Data efetiva**: Campo `effective_date`
- [x] **Data de revisão**: Campo `review_date`
- [x] **Departamento responsável**: Campo `responsible_department`
- [x] **Validação**: Código e título obrigatórios (validação no frontend)
- [ ] Sem validação de formato do código (não enforça padrão PSG-XX)
- [ ] Sem campo para "elaborador" e "aprovador" na lista mestra

**Evidências:**
- `src/components/DocumentMasterListModal.tsx:29-37` — Estado inicial com todos os campos
- `src/components/DocumentMasterListModal.tsx:87-89` — Validação: `if (!newMasterListItem.code.trim() || !newMasterListItem.title.trim())`
- `src/services/gedDocuments.ts:56-70` — Interface `MasterListItem`

### 2.3 Item 7.5.3 — Controle

#### 2.3.1 Disponibilidade e Proteção
- [x] Lista acessível via modal em qualquer documento
- [x] Exportação PDF e Excel para distribuição offline
- [x] Dados protegidos por `company_id` scoping

#### 2.3.2 Distribuição, Acesso, Alterações, Retenção
- [x] **Distribuição**: Campo `distribution_list` (JSON array de destinatários)
- [x] **Controle de alterações**: Campos `version`, `effective_date`, `review_date` rastreiam revisões
- [x] **Alertas automáticos**: Status derivado (Revisão Vencida, Revisão Próxima — 30 dias, Ativo, Inativo)
- [ ] **Retenção**: Sem campo de retenção na lista mestra (existe na tabela `documents`)
- [ ] **Histórico**: Soft delete (`is_active = false`), mas sem log de alterações da própria lista mestra

## 3. Mapeamento PSG-DOC

| # | Requisito PSG-DOC | Status | Evidência |
|---|-------------------|--------|-----------|
| P3 | Codificação PSG-XX | ⚠️ Parcial | Campo `code` livre, sem validação de formato |
| P5 | Rastreabilidade revisão | ✅ Implementado | version + effective_date + review_date |
| P9 | Distribuição | ✅ Implementado | distribution_list JSON |
| P11 | Lista Mestra | ✅ Implementado | Módulo completo com CRUD e relatórios |
| P12 | Ciclo 12 meses | ✅ Implementado | review_date + alertas automáticos |
| P13 | Cópias controladas | ⚠️ Parcial | Integra com `documents.controlled_copy` mas não diretamente |

## 4. Evidências Detalhadas

### 4.1 Tabela `document_master_list`
| Campo | Tipo | Função |
|-------|------|--------|
| `code` | string | Código do documento (ex: PSG-DOC) |
| `title` | string | Título do documento |
| `version` | string | Versão atual (ex: "1.0") |
| `effective_date` | date | Data de entrada em vigor |
| `review_date` | date | Data da próxima revisão |
| `responsible_department` | string | Departamento responsável |
| `distribution_list` | json | Lista de distribuição |
| `is_active` | boolean | Ativo/Inativo |
| `document_id` | uuid FK | Vínculo com tabela documents |

### 4.2 Exportação
- `src/components/DocumentMasterListModal.tsx:99+` — `generatePDFReport()` usando jsPDF
- Exportação Excel via `xlsx` library
- Relatório inclui: código, título, versão, data efetiva, departamento, status

### 4.3 Alertas de Revisão
Lógica de status derivado (no componente):
- **Revisão Vencida** (vermelho): `review_date < hoje`
- **Revisão Próxima** (amarelo): `review_date < hoje + 30 dias`
- **Ativo** (verde): `is_active = true && revisão no prazo`
- **Inativo** (cinza): `is_active = false`

## 5. Lacunas e Recomendações

| # | Lacuna | Severidade | Recomendação |
|---|--------|------------|--------------|
| 1 | Sem validação de formato do código | Baixa | Adicionar regex opcional (PSG-XX, IT-XX.YY, RG-XX.ZZ) |
| 2 | Sem campo elaborador/aprovador | Média | Adicionar campos `author_id`, `approver_id` na tabela |
| 3 | Sem histórico de alterações da lista | Média | Registrar mudanças na `document_audit_trail` |
| 4 | company_id hardcoded como 'current-company' | Alta | Corrigir para usar `get_user_company_id()` real |
| 5 | Sem link para protocolo de implementação | Média | Associar RG-DOC.01 equivalente a cada item |

## 6. Nota de Confiança: 4.0/5

| Critério | Peso | Nota | Observação |
|----------|------|------|------------|
| Cobertura funcional 7.5 | 30% | 4.5/5 | Código, versão, revisão, distribuição, alertas |
| Aderência PSG-DOC | 25% | 4/5 | Lista Mestra completa, falta enforcement de codificação |
| Maturidade do código | 15% | 3.5/5 | React Query, mutations, mas company_id TODO |
| Rastreabilidade | 15% | 3.5/5 | Exportação PDF/Excel, soft delete, sem audit trail próprio |
| UX/Usabilidade | 15% | 4.5/5 | Modal intuitivo, busca, badges de status, exportação |
| **Média ponderada** | **100%** | **4.0/5** | |

## 7. Guia de Verificação E2E

### Cenários de Teste

1. **Adicionar Documento à Lista Mestra**
   - Abrir modal da Lista Mestra em um documento
   - Preencher: código "PSG-TEST-01", título, versão "1.0", data efetiva, departamento
   - Salvar → verificar que aparece na lista com status "Ativo"

2. **Alerta de Revisão Vencida**
   - Adicionar item com `review_date` no passado
   - Verificar que badge "Revisão Vencida" aparece em vermelho

3. **Exportação**
   - Com pelo menos 3 itens na lista, exportar PDF
   - Verificar que PDF contém código, título, versão, departamento
   - Repetir com Excel

4. **Remoção**
   - Remover item da lista mestra → verificar que `is_active` fica `false`
   - Verificar que o documento original continua existindo

### Checklist
- [ ] CRUD completo funciona (adicionar, editar, remover)
- [ ] Validação exige código e título
- [ ] Alertas de revisão funcionam (Vencida, Próxima, Ativo)
- [ ] Exportação PDF gera arquivo válido
- [ ] Exportação Excel gera arquivo válido
- [ ] Busca filtra por código, título e departamento
- [ ] distribution_list é salvo e exibido corretamente
