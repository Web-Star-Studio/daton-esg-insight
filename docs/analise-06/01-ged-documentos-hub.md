# Análise ISO 9001:2015 — Item 7.5: GED / Documentos Hub

**Data da análise:** 2026-03-04
**Módulo:** GED — Gestão Eletrônica de Documentos / Hub de Documentos
**Arquivo(s) principal(is):** `src/pages/DocumentosHub.tsx`, `src/pages/Documentos.tsx`, `src/services/documents.ts`, `src/services/gedDocuments.ts`, `src/components/DocumentUploadModal.tsx`
**Nota de confiança:** 3.5/5

---

## 1. Descrição do Módulo

O Hub de Documentos é o módulo central de gestão eletrônica de documentos (GED) do Daton ESG Insight. Funciona como repositório digital unificado, equivalente funcional ao QualityWeb referenciado no PSG-DOC. Permite upload, organização por pastas, classificação por tags, processamento AI, e integra-se com os módulos de aprovação, versionamento, lista mestra e permissões.

O módulo é composto por: página principal (`DocumentosHub.tsx`), modal de upload (`DocumentUploadModal.tsx`), serviço de CRUD (`documents.ts`), serviço GED avançado (`gedDocuments.ts`) e tabela Supabase `documents` com 30+ campos incluindo campos de controle ISO.

## 2. Análise por Sub-requisito ISO 7.5

### 2.1 Item 7.5.1 — Generalidades

**Requisito:** O SGQ deve incluir informação documentada requerida pela norma e determinada como necessária.

**Situação no sistema:**
- [x] Repositório central para toda informação documentada do SGQ
- [x] Classificação por tipo de documento (Manual, Procedimento, IT, Formulário, etc.)
- [x] Integração com módulos de qualidade, governança e compliance
- [ ] Não há validação que garanta que todos os documentos requeridos pela norma existam

**Evidências no código:**
- `src/services/documents.ts` — CRUD completo com paginação, filtros por tipo/tag
- `src/integrations/supabase/types.ts:6401-6530` — Tabela `documents` com campos: `file_name`, `file_type`, `document_type`, `tags`, `related_model`, `related_id`
- `src/components/document-control/SGQIsoDocumentsTab.tsx:75-85` — Categorias: Manual, Procedimento, Instrução de Trabalho, Formulário, Política, Plano, Relatório, Certificado, Outros

**Lacunas:**
- Faltam categorias explícitas para MSG (Manual do SGI) e FPLAN (Fichas de Planejamento) do PSG-DOC
- Não há checklist automático de documentos obrigatórios pela ISO 9001

### 2.2 Item 7.5.2 — Criando e Atualizando

**Requisito:** Identificação/descrição, formato/meio, análise crítica e aprovação.

**Situação no sistema:**
- [x] Identificação: `file_name`, `code` (na lista mestra), `document_type`, `tags`
- [x] Formato: Suporte a PDF, Excel, CSV com validação de tipo MIME
- [x] Upload com drag-and-drop e progresso
- [x] Campo `requires_approval` que ativa fluxo de aprovação
- [x] AI categoriza automaticamente documentos (`ai_extracted_category`)
- [ ] Não há campo explícito para "autor/elaborador" no documento (apenas `uploader_user_id`)
- [ ] Falta campo "data de elaboração" separado de "data de upload"

**Evidências no código:**
- `src/components/DocumentUploadModal.tsx` — Upload com classificação, tags, progresso
- `src/integrations/supabase/types.ts` — Campos: `uploader_user_id`, `ai_processing_status`, `ai_confidence_score`, `ai_extracted_category`, `approval_status`, `requires_approval`
- `src/components/document-control/SGQIsoDocumentsTab.tsx:87-101` — Normalização de categorias com fallback para AI

**Lacunas:**
- Sem distinção entre "elaborador" e "aprovador" no upload (PSG-DOC requer ambos no cabeçalho)
- Sem campo dedicado para "número de referência" (o `code` existe apenas na lista mestra, não no documento em si)

### 2.3 Item 7.5.3 — Controle de Informação Documentada

#### 2.3.1 Disponibilidade, Adequação e Proteção

**Situação no sistema:**
- [x] Documentos disponíveis via interface web com busca e filtros
- [x] Organização por pastas hierárquicas (`document_folders` com `parent_folder_id`)
- [x] Proteção via RLS do Supabase (company_id scoping)
- [x] Campo `controlled_copy` para marcar cópias controladas
- [ ] Sem proteção contra impressão/download não autorizado

**Evidências:**
- `src/services/documents.ts` — `fetchDocuments()` com filtros, `downloadDocument()`, `getFolders()`
- Tabela `document_folders`: `company_id`, `name`, `parent_folder_id`
- RLS: Documentos filtrados por `company_id` via `get_user_company_id()`

#### 2.3.2 Distribuição, Acesso, Armazenamento, Alterações, Retenção, Disposição

**Situação no sistema:**
- [x] **Distribuição**: Integração com lista mestra (`distribution_list` no `document_master_list`)
- [x] **Acesso**: Permissões granulares (leitura/escrita/aprovação/admin) via `document_permissions`
- [x] **Armazenamento**: Supabase Storage bucket `documents`
- [x] **Preservação**: `content_hash` para verificação de integridade
- [x] **Controle de alterações**: `document_versions` com histórico completo
- [x] **Retenção**: Campo `retention_period` na tabela `documents`
- [ ] **Disposição**: Sem workflow automático para destruição/descarte ao fim da retenção
- [ ] **Documentos externos**: Identificação parcial (campo `document_type` inclui "externo" mas sem fluxo dedicado)

**Evidências:**
- `src/services/gedDocuments.ts:56-70` — Interface `MasterListItem` com `distribution_list`
- `src/integrations/supabase/types.ts` — Campos: `retention_period`, `review_frequency`, `effective_date`, `next_review_date`
- Storage bucket: `documents` referenciado em `src/services/documents.ts`

## 3. Mapeamento PSG-DOC

| # | Requisito PSG-DOC | Status | Evidência | Observações |
|---|-------------------|--------|-----------|-------------|
| P1 | Software de controle (QualityWeb) | ✅ Implementado | DocumentosHub + gedDocuments.ts | Equivalente funcional completo |
| P2 | 5 níveis de documentação | ⚠️ Parcial | SGQIsoDocumentsTab categorias | Faltam MSG e FPLAN explícitos |
| P3 | Sistema de codificação | ⚠️ Parcial | `code` na master list | Sem enforcement do padrão PSG-XX |
| P4 | Assinatura eletrônica | ⚠️ Parcial | `approver_user_id` + timestamp | Não é assinatura qualificada |
| P5 | Rastreabilidade de revisão | ✅ Implementado | document_versions | version_number + changes_summary |
| P6 | Arquivamento de obsoletos | ⚠️ Parcial | Status "obsoleto" existe | Sem archiving automático |
| P7 | Grupos de acesso | ⚠️ Parcial | document_permissions | Por usuário, não por grupo/função |
| P8 | Backup e proteção | ⚠️ Parcial | Supabase managed | Sem verificação na UI |
| P9 | Distribuição via software | ✅ Implementado | distribution_list + UI | Via interface web |
| P10 | Protocolo implementação | ❌ Ausente | — | Sem RG-DOC.01 equivalente |
| P11 | Lista Mestra | ✅ Implementado | DocumentMasterListModal | Com alertas de revisão |
| P12 | Ciclo 12 meses | ✅ Implementado | review_frequency + next_review_date | Alertas automáticos |
| P13 | Cópias controladas | ✅ Implementado | document_controlled_copies | copy_number + status |
| P14 | Controle externos (SOGI) | ⚠️ Parcial | document_type "externo" | Sem integração SOGI |
| P15 | Retenção e disposição | ⚠️ Parcial | retention_period campo | Sem automação de disposição |

## 4. Evidências Detalhadas

### 4.1 Tabelas de Banco de Dados
| Tabela | Campos-chave | Função |
|--------|-------------|--------|
| `documents` | file_name, file_type, document_type, approval_status, retention_period, review_frequency, controlled_copy, master_list_included | Repositório central |
| `document_folders` | name, parent_folder_id, company_id | Organização hierárquica |
| `document_versions` | version_number, content_hash, changes_summary, is_current | Versionamento |
| `document_master_list` | code, title, version, effective_date, review_date, distribution_list | Lista Mestra |
| `document_approvals` | status (rascunho/em_aprovacao/aprovado/rejeitado/obsoleto), approver_user_id | Aprovação |
| `document_permissions` | permission_level, expires_at, user_id, role | Controle de acesso |
| `document_controlled_copies` | copy_number, assigned_to_user_id, location, status | Cópias controladas |

### 4.2 Serviços
- `src/services/documents.ts` — CRUD, upload, download, pastas
- `src/services/gedDocuments.ts` — Versões, aprovações, lista mestra, permissões, cópias, legais, auditoria

### 4.3 Componentes UI
- `src/pages/DocumentosHub.tsx` — Hub principal com abas
- `src/components/DocumentUploadModal.tsx` — Upload com categorização
- `src/components/DocumentMasterListModal.tsx` — Lista Mestra
- `src/components/DocumentVersionHistory.tsx` — Histórico de versões
- `src/components/DocumentPermissionsModal.tsx` — Permissões
- `src/components/ApprovalWorkflowModal.tsx` — Fluxo de aprovação

## 5. Lacunas Consolidadas e Recomendações

| # | Lacuna | Severidade | Recomendação |
|---|--------|------------|--------------|
| 1 | Faltam categorias MSG e FPLAN | Média | Adicionar ao array `documentCategories` em SGQIsoDocumentsTab |
| 2 | Sem enforcement de codificação PSG-XX | Média | Adicionar validação regex no campo `code` da lista mestra |
| 3 | Sem campo "elaborador" distinto de "uploader" | Média | Adicionar campo `author_user_id` na tabela documents |
| 4 | Sem protocolo de implementação (RG-DOC.01) | Alta | Criar workflow de confirmação de leitura/implementação |
| 5 | Sem workflow de disposição automática | Média | Implementar cron job que identifica documentos além da retenção |
| 6 | Backup sem verificação na UI | Baixa | Adicionar status de backup na tela de administração |

## 6. Nota de Confiança: 3.5/5

| Critério | Peso | Nota | Observação |
|----------|------|------|------------|
| Cobertura funcional 7.5 | 30% | 4/5 | Cobre upload, classificação, versionamento, aprovação, lista mestra |
| Aderência PSG-DOC | 25% | 3/5 | 10/15 requisitos implementados, 4 parciais, 1 ausente |
| Maturidade do código | 15% | 3.5/5 | Tipagem TS, tratamento de erros, mas `any` em alguns serviços |
| Rastreabilidade | 15% | 3.5/5 | Audit trail existe, content_hash, mas retenção curta |
| UX/Usabilidade | 15% | 4/5 | Interface intuitiva, busca, filtros, drag-drop upload |
| **Média ponderada** | **100%** | **3.5/5** | |

## 7. Guia de Verificação E2E

### Pré-condições
- Acesso ao sistema com perfil de Coordenador SGI ou Admin
- Pelo menos 3 documentos de teste (PDF, Excel, CSV)

### Cenários de Teste

1. **Upload e Classificação**
   - Navegar para `/documentos`
   - Fazer upload de um PDF como "Procedimento"
   - Verificar que o documento aparece na lista com a categoria correta
   - Verificar que AI tenta classificar automaticamente

2. **Inclusão na Lista Mestra**
   - Abrir documento recém-enviado
   - Clicar em "Adicionar à Lista Mestra"
   - Preencher código (ex: PSG-TEST), versão, data efetiva, departamento responsável
   - Verificar que aparece no modal da Lista Mestra com status "Ativo"

3. **Ciclo de Aprovação**
   - Upload de documento com `requires_approval = true`
   - Verificar que status inicia como "rascunho"
   - Submeter para aprovação → status "em_aprovação"
   - Aprovar → status "aprovado"

4. **Controle de Acesso**
   - Conceder permissão "leitura" a outro usuário para um documento
   - Verificar que o usuário consegue visualizar mas não editar
   - Revogar permissão → verificar que acesso é removido

### Checklist de Verificação
- [ ] Upload funciona para PDF, Excel, CSV
- [ ] Categorias de documento são exibidas corretamente
- [ ] Lista Mestra mostra documentos ativos com código e versão
- [ ] Fluxo de aprovação transita entre todos os status
- [ ] Permissões podem ser concedidas e revogadas
- [ ] Histórico de versões mostra todas as revisões
- [ ] Campo retention_period é visível e editável
- [ ] Busca por nome, tag e categoria funciona
