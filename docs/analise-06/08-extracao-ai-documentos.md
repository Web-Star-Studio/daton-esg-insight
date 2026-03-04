# Análise ISO 9001:2015 — Item 7.5: Extração AI de Documentos

**Data da análise:** 2026-03-04
**Módulo:** Extração AI de Documentos
**Arquivo(s) principal(is):** `src/pages/ExtracoesDocumentos.tsx`, `src/services/documentExtraction.ts`, `src/services/documentAI.ts`
**Nota de confiança:** 2.5/5

---

## 1. Descrição do Módulo

O módulo de Extração AI automatiza a captura de dados de documentos físicos/PDF usando inteligência artificial. Implementa um pipeline completo: upload → parsing → extração → staging → validação humana → curadoria. Embora não seja um requisito direto do item 7.5, contribui para a eficácia do controle de informação documentada ao permitir a digitalização e classificação automática de documentos.

O pipeline utiliza tabelas Supabase: `files`, `document_extraction_jobs`, `extractions`, `extraction_items_staging`, `extraction_items_curated`, `extracted_data_preview`, `extraction_approval_log`, `extraction_feedback`.

## 2. Análise por Sub-requisito ISO 7.5

### 2.1 Item 7.5.1 — Generalidades

**Situação no sistema:**
- [x] Suporta a criação de informação documentada a partir de documentos físicos/escaneados
- [x] Classificação automática de documentos por AI
- [ ] Dados extraídos por AI não são automaticamente registrados como informação documentada do SGQ

### 2.2 Item 7.5.2 — Criando e Atualizando

**Situação no sistema:**
- [x] **Identificação**: `original_name`, `mime`, `storage_path` registrados
- [x] **Score de confiança**: `confidence_score` e `ai_confidence_score`
- [x] **Status pipeline**: uploaded → parsed → extracted → failed
- [x] **Validação humana**: `extraction_items_staging` com status pending/approved/rejected/edited
- [x] **Curadoria**: `extraction_items_curated` com `approved_by` e `lineage` (JSON)
- [ ] Sem vinculação automática entre dados extraídos e documentos do SGQ

**Evidências:**
- Tabela `files`: `original_name`, `storage_path`, `mime`, `size_bytes`, `status`
- Tabela `document_extraction_jobs`: `processing_type`, `status`, `ai_model_used`, `confidence_score`, `retry_count`
- Tabela `extraction_items_staging`: `field_name`, `extracted_value`, `confidence`, `status`
- Tabela `extraction_items_curated`: `value`, `approved_by`, `lineage`

### 2.3 Item 7.5.3 — Controle

#### 2.3.1 Disponibilidade e Proteção
- [x] Preview antes de integração (`extracted_data_preview`)
- [x] Validação status rastreado (`validation_status`, `validation_notes`)
- [x] Retry com limite (`retry_count`, `max_retries`)

#### 2.3.2 Rastreabilidade
- [x] `extraction_approval_log`: ações approved/rejected/batch_approved/edited
- [x] `extraction_feedback`: `accuracy_score`, `feedback_type`, `issues`, `time_to_review_seconds`
- [x] Timing: `processing_start_time`, `processing_end_time`
- [ ] Sem vínculo com `document_audit_trail`

## 3. Mapeamento PSG-DOC

| # | Requisito PSG-DOC | Status | Evidência |
|---|-------------------|--------|-----------|
| P1 | Software de controle | ⚠️ Parcial | Pipeline AI complementa o controle mas não é o controle em si |
| P4 | Assinatura eletrônica | ⚠️ Parcial | `approved_by` em curated items |
| P5 | Rastreabilidade | ✅ Implementado | Pipeline completo com staging → curadoria → feedback |

**Nota:** Este módulo é uma ferramenta de suporte à criação de informação documentada, não um requisito direto do 7.5. A nota reflete a relevância indireta.

## 4. Evidências Detalhadas

### 4.1 Pipeline (5 tabelas)
1. `files` — Upload inicial (original_name, mime, size_bytes, status)
2. `document_extraction_jobs` — Orquestração (status, ai_model_used, confidence_score, retry)
3. `extraction_items_staging` — Dados pré-aprovação (field_name, extracted_value, confidence)
4. `extraction_items_curated` — Dados aprovados (value, approved_by, lineage)
5. `extracted_data_preview` — Preview com `suggested_mappings` para tabela destino

### 4.2 Quality Assurance
- `extraction_feedback`: score de acurácia, tipo de feedback, issues, tempo de revisão
- `document_patterns`: padrões aprendidos para melhorar extração futura

## 5. Lacunas e Recomendações

| # | Lacuna | Severidade | Recomendação |
|---|--------|------------|--------------|
| 1 | Dados extraídos não vinculam ao SGQ automaticamente | Média | Criar fluxo de "promover extração para documento SGQ" |
| 2 | Sem vínculo com document_audit_trail | Baixa | Registrar extrações na trilha de auditoria documental |
| 3 | Confidence threshold não configurável | Baixa | Permitir admin configurar threshold de aceitação |

## 6. Nota de Confiança: 2.5/5

| Critério | Peso | Nota | Observação |
|----------|------|------|------------|
| Cobertura funcional 7.5 | 30% | 2/5 | Relevância indireta ao 7.5 |
| Aderência PSG-DOC | 25% | 2/5 | Não mapeado diretamente no PSG-DOC |
| Maturidade do código | 15% | 4/5 | Pipeline robusto com retry, staging, curadoria |
| Rastreabilidade | 15% | 4/5 | Lineage, approval log, feedback loop |
| UX/Usabilidade | 15% | 3/5 | Preview e validação disponíveis |
| **Média ponderada** | **100%** | **2.5/5** | |

## 7. Guia de Verificação E2E

### Cenários de Teste

1. **Upload e Extração**
   - Upload de PDF com dados estruturados
   - Verificar que job de extração é criado com status "processing"
   - Aguardar conclusão → verificar extraction_items_staging

2. **Validação Humana**
   - Revisar items em staging → aprovar/rejeitar/editar
   - Verificar que items aprovados vão para extraction_items_curated

3. **Feedback**
   - Após curadoria, fornecer feedback (accuracy_score, issues)
   - Verificar que extraction_feedback é registrado

### Checklist
- [ ] Upload de arquivo dispara job de extração
- [ ] Status do job transita corretamente
- [ ] Items extraídos aparecem em staging com confidence
- [ ] Aprovação move para curated com lineage
- [ ] Feedback é registrado
- [ ] Retry funciona para jobs com falha
