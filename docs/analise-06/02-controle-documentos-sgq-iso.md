# Análise ISO 9001:2015 — Item 7.5: Controle de Documentos SGQ/ISO

**Data da análise:** 2026-03-04
**Módulo:** Controle de Documentos SGQ/ISO
**Arquivo(s) principal(is):** `src/pages/ControleDocumentos.tsx`, `src/components/document-control/SGQIsoDocumentsTab.tsx`, `src/components/document-control/RegulatoryDocumentsTab.tsx`
**Nota de confiança:** 3.0/5

---

## 1. Descrição do Módulo

O módulo de Controle de Documentos é a interface dedicada à gestão de documentos do Sistema de Gestão da Qualidade (SGQ), alinhada às normas ISO. Apresenta documentos classificados por tipo (Manual, Procedimento, IT, etc.), com filtros por categoria, busca textual, e integração com upload, download e aprovação. É o equivalente funcional do controle feito via QualityWeb no PSG-DOC.

Composto por: página principal (`ControleDocumentos.tsx`) com abas para documentos SGQ/ISO (`SGQIsoDocumentsTab.tsx`) e documentos regulatórios (`RegulatoryDocumentsTab.tsx`).

## 2. Análise por Sub-requisito ISO 7.5

### 2.1 Item 7.5.1 — Generalidades

**Situação no sistema:**
- [x] Documentos do SGQ são centralizados e classificados por tipo
- [x] Categorias cobrem maioria dos níveis do PSG-DOC (Manual, Procedimento, IT, Formulário)
- [ ] Não há categoria explícita para MSG (Manual do SGI) — "Manual" genérico existe
- [ ] Não há categoria FPLAN (Fichas de Planejamento)
- [ ] Não há checklist de documentos obrigatórios por cláusula ISO

**Evidências:**
- `src/components/document-control/SGQIsoDocumentsTab.tsx:75-85`:
  ```typescript
  const documentCategories = [
    'Manual', 'Procedimento', 'Instrução de Trabalho', 'Formulário',
    'Política', 'Plano', 'Relatório', 'Certificado', 'Outros'
  ];
  ```
- Interface `Document` (linhas 37-57): campos `document_type`, `controlled_copy`, `requires_approval`, `approval_status`, `master_list_included`, `code`, `responsible_department`

### 2.2 Item 7.5.2 — Criando e Atualizando

**Situação no sistema:**
- [x] Upload de documentos com seleção de tipo e tags
- [x] Campo `controlled_copy` boolean para marcar cópias controladas
- [x] Normalização automática de categorias com fallback AI (`normalizeDocumentCategory`)
- [ ] Sem campos de cabeçalho PSG-DOC (elaboração, aprovação, código, revisão, data)
- [ ] Sem template de estrutura mínima (Objetivo, Aplicação, Definições, etc.)

**Evidências:**
- `SGQIsoDocumentsTab.tsx:87-101` — Função `normalizeDocumentCategory` que busca categoria no `document_type` ou no `ai_extracted_category`
- Upload via `uploadDocument()` de `src/services/documents.ts`

### 2.3 Item 7.5.3 — Controle

#### 2.3.1 Disponibilidade e Proteção
- [x] Listagem com tabela paginada e busca
- [x] Filtro por categoria de documento
- [x] Download disponível por documento
- [x] RLS garante isolamento por empresa

#### 2.3.2 Distribuição, Acesso, Alterações, Retenção
- [x] Campo `master_list_included` vincula à Lista Mestra
- [x] Campo `approval_status` controla ciclo de vida
- [ ] Sem visualização de distribuição diretamente nesta tela
- [ ] Sem indicador de revisão vencida nesta interface (existe na Lista Mestra)

## 3. Mapeamento PSG-DOC

| # | Requisito PSG-DOC | Status | Evidência |
|---|-------------------|--------|-----------|
| P1 | Software de controle | ✅ Implementado | SGQIsoDocumentsTab como interface principal |
| P2 | 5 níveis documentação | ⚠️ Parcial | 9 categorias, mas sem MSG e FPLAN |
| P3 | Codificação PSG-XX | ⚠️ Parcial | Campo `code` existe mas sem validação |
| P4 | Assinatura eletrônica | ❌ Ausente | Nenhum campo de assinatura nesta tela |
| P5 | Rastreabilidade revisão | ⚠️ Parcial | Delega para módulo de versões |
| P9 | Distribuição | ⚠️ Parcial | Download disponível, sem distribuição ativa |
| P12 | Ciclo 12 meses | ❌ Ausente | Sem indicador de revisão nesta tela |

## 4. Evidências Detalhadas

### 4.1 Tabela Principal
- `documents` — Filtrada por `company_id` via RLS, campos de controle: `document_type`, `controlled_copy`, `requires_approval`, `approval_status`, `master_list_included`, `code`, `responsible_department`

### 4.2 Componentes
- `SGQIsoDocumentsTab.tsx` — Listagem, filtro, upload, download de documentos SGQ
- `RegulatoryDocumentsTab.tsx` — Documentos regulatórios separados

### 4.3 Query Supabase
```typescript
supabase.from('documents')
  .select('id, file_name, file_path, file_size, related_model, document_type, ai_extracted_category, ...')
  .eq('company_id', companyId)
```

## 5. Lacunas e Recomendações

| # | Lacuna | Severidade | Recomendação |
|---|--------|------------|--------------|
| 1 | Faltam categorias MSG e FPLAN | Média | Adicionar ao array `documentCategories` |
| 2 | Sem campos de cabeçalho PSG-DOC na tela | Alta | Adicionar elaborador, aprovador, revisão, data no formulário de upload |
| 3 | Sem template de estrutura mínima | Média | Implementar templates com seções obrigatórias (Objetivo, Aplicação, etc.) |
| 4 | Sem indicador de revisão vencida | Média | Adicionar badge "Revisão Vencida" baseado em `next_review_date` |
| 5 | Normalização de categoria usa fallback "Outros" | Baixa | Melhorar matching AI ou forçar seleção manual |

## 6. Nota de Confiança: 3.0/5

| Critério | Peso | Nota | Observação |
|----------|------|------|------------|
| Cobertura funcional 7.5 | 30% | 3/5 | Listagem e upload ok, faltam campos de controle |
| Aderência PSG-DOC | 25% | 2.5/5 | Categorias parciais, sem cabeçalho, sem template |
| Maturidade do código | 15% | 3.5/5 | Componente bem estruturado, tipagem TS |
| Rastreabilidade | 15% | 3/5 | Delega para outros módulos (versões, aprovações) |
| UX/Usabilidade | 15% | 3.5/5 | Tabela com busca e filtros, download direto |
| **Média ponderada** | **100%** | **3.0/5** | |

## 7. Guia de Verificação E2E

### Cenários de Teste

1. **Listagem por Categoria**
   - Navegar para `/controle-documentos`
   - Verificar que documentos são listados com categorias corretas
   - Filtrar por "Procedimento" → apenas procedimentos exibidos

2. **Upload SGQ**
   - Fazer upload de documento como "Instrução de Trabalho"
   - Verificar que aparece na lista com categoria "Instrução de Trabalho"
   - Verificar se AI sugere categoria quando tipo é genérico

3. **Campos de Controle**
   - Verificar que campos `controlled_copy`, `approval_status`, `code` são visíveis
   - Verificar badge de status de aprovação

### Checklist
- [ ] Todas as 9 categorias são exibidas no filtro
- [ ] Upload funciona com seleção de categoria
- [ ] Download funciona para documentos listados
- [ ] Campo de busca filtra por nome
- [ ] Documentos de outra empresa não são visíveis (testar com 2 contas)
