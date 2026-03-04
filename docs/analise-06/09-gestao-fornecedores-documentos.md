# Análise ISO 9001:2015 — Item 7.5: Gestão de Fornecedores (Documentos)

**Data da análise:** 2026-03-04
**Módulo:** Gestão de Documentos de Fornecedores
**Arquivo(s) principal(is):** `src/pages/SupplierDocumentEvaluationPage.tsx`, `src/pages/DocumentTypeAssociationPage.tsx`, `src/pages/RequiredDocuments.tsx`
**Nota de confiança:** 2.5/5

---

## 1. Descrição do Módulo

O módulo de Gestão de Documentos de Fornecedores gerencia documentos de origem externa exigidos de fornecedores, incluindo: definição de tipos de documentos obrigatórios, submissão de documentos pelo portal do fornecedor, e avaliação documental. Este módulo é diretamente relevante para o item 7.5.3.2(e) — "informação documentada de origem externa deve ser identificada, como apropriado, e controlada".

Equivale no PSG-DOC ao "Controle de Documentos Externos e Legislação" (seção sobre documentação de fornecedores externos controlada via planilha Excel/OneDrive).

## 2. Análise por Sub-requisito ISO 7.5

### 2.1 Item 7.5.1 — Generalidades

**Situação no sistema:**
- [x] Tipos de documentos obrigatórios definidos por tipo de fornecedor
- [x] Submissão de documentos via portal do fornecedor
- [ ] Sem lista explícita de documentos requeridos conforme ISO 9001

### 2.2 Item 7.5.2 — Criando e Atualizando

**Situação no sistema:**
- [x] Fornecedores fazem upload de seus documentos
- [x] Associação de tipo de documento ao fornecedor
- [ ] Sem template de documento exigido
- [ ] Sem verificação automática de validade/vencimento

### 2.3 Item 7.5.3 — Controle

#### 2.3.1 Disponibilidade e Proteção
- [x] Documentos armazenados no Supabase Storage
- [x] Portal do fornecedor com autenticação própria (`SupplierLogin.tsx`)

#### 2.3.2 Documentos Externos (7.5.3.2e)
- [x] **Identificação**: Documentos associados a fornecedores e tipos específicos
- [x] **Avaliação**: Página dedicada de avaliação documental
- [ ] **Validade**: Sem controle automático de vencimento de documentos do fornecedor
- [ ] **Integração SOGI**: Sem integração com sistema SOGI referenciado no PSG-DOC
- [ ] **Verificação trimestral**: PSG-DOC exige verificação trimestral de documentos externos

**Evidências:**
- Tabela `supplier_document_type_requirements` — Define documentos obrigatórios por tipo
- Tabela `supplier_document_submissions` — Submissões dos fornecedores
- Tabela `supplier_document_evaluations` — Resultados de avaliação
- Portal: `src/pages/supplier-portal/` — 7 páginas para interface do fornecedor

## 3. Mapeamento PSG-DOC

| # | Requisito PSG-DOC | Status | Evidência |
|---|-------------------|--------|-----------|
| P14 | Controle docs externos (SOGI) | ⚠️ Parcial | Controle via tabelas próprias, sem SOGI |
| P15 | Retenção definida | ❌ Ausente | Sem campo de retenção para docs de fornecedores |
| P8 | Backup | ✅ Implementado | Supabase Storage |

**Sobre SOGI:** O PSG-DOC menciona que "O controle dos documentos externos e legislação é feito no sistema SOGI". O Daton não integra com SOGI, implementando controle próprio. A funcionalidade é parcialmente equivalente mas não idêntica.

**Sobre verificação trimestral:** O PSG-DOC exige que "o emitente deste controle é responsável pelo contato com os emitentes dos documentos externos, no mínimo trimestralmente". Não há mecanismo de alerta trimestral no sistema.

## 4. Evidências Detalhadas

### 4.1 Tabelas
| Tabela | Função |
|--------|--------|
| `supplier_document_type_requirements` | Requisitos documentais por tipo de fornecedor |
| `supplier_document_submissions` | Documentos submetidos |
| `supplier_document_evaluations` | Avaliações documentais |

### 4.2 Portal do Fornecedor
- `SupplierLogin.tsx` — Autenticação
- `SupplierDashboard.tsx` — Dashboard
- `SupplierTrainings.tsx` — Materiais de treinamento
- `SupplierReadings.tsx` — Leituras obrigatórias
- `SupplierSurveys.tsx` — Pesquisas

### 4.3 Páginas Administrativas
- `DocumentTypeAssociationPage.tsx` — Associar tipos de documento a fornecedores
- `SupplierDocumentEvaluationPage.tsx` — Avaliar documentos submetidos
- `RequiredDocuments.tsx` — Gerenciar documentos requeridos

## 5. Lacunas e Recomendações

| # | Lacuna | Severidade | Recomendação |
|---|--------|------------|--------------|
| 1 | Sem integração SOGI | Média | Avaliar integração ou implementar funcionalidade equivalente |
| 2 | Sem controle de validade/vencimento | Alta | Adicionar campos `expiration_date` e alertas |
| 3 | Sem verificação trimestral automática | Alta | Implementar cron/alerta para revisão trimestral |
| 4 | Sem retenção definida | Média | Adicionar campo `retention_period` aos docs de fornecedores |
| 5 | Sem histórico de avaliações | Média | Manter histórico quando documento é reavaliado |

## 6. Nota de Confiança: 2.5/5

| Critério | Peso | Nota | Observação |
|----------|------|------|------------|
| Cobertura funcional 7.5 | 30% | 3/5 | Requisitos, submissão, avaliação presentes |
| Aderência PSG-DOC | 25% | 2/5 | Sem SOGI, sem verificação trimestral |
| Maturidade do código | 15% | 2.5/5 | Estrutura existe mas funcionalidades incompletas |
| Rastreabilidade | 15% | 2/5 | Sem histórico de avaliações, sem log de alterações |
| UX/Usabilidade | 15% | 3.5/5 | Portal do fornecedor com interface dedicada |
| **Média ponderada** | **100%** | **2.5/5** | |

## 7. Guia de Verificação E2E

### Cenários de Teste

1. **Definir Documentos Obrigatórios**
   - Em `/fornecedores/associacao-documentos` → associar tipo de documento a tipo de fornecedor
   - Verificar que aparece na lista de requisitos

2. **Submissão pelo Fornecedor**
   - Login no portal do fornecedor (`/fornecedor/`)
   - Upload de documento obrigatório
   - Verificar que submissão é registrada

3. **Avaliação Documental**
   - Em `/fornecedores/avaliacao-documental/:id`
   - Avaliar documento submetido → aprovar/reprovar
   - Verificar registro da avaliação

### Checklist
- [ ] Tipos de documentos obrigatórios podem ser definidos
- [ ] Fornecedor consegue fazer login no portal
- [ ] Upload de documento funciona no portal
- [ ] Avaliação documental registra resultado
- [ ] Documentos são armazenados no Supabase Storage
