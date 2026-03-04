# Análise ISO 9001:2015 — Item 7.5: Documentos Regulatórios/Legais

**Data da análise:** 2026-03-04
**Módulo:** Documentos Regulatórios e Legais
**Arquivo(s) principal(is):** `src/services/gedDocuments.ts` (LegalDocument interface), `src/pages/LegislationsHub.tsx`, `src/pages/LegislationDetail.tsx`, `src/pages/Licenciamento.tsx`
**Nota de confiança:** 3.0/5

---

## 1. Descrição do Módulo

O módulo de Documentos Regulatórios/Legais gerencia legislações, licenças e normas aplicáveis à organização. Implementa uma tabela `legal_documents` com campos para tipo de legislação, número de lei, autoridade emissora, data de publicação/vigência/expiração, status de conformidade e frequência de revisão. Cobre o requisito 7.5.3.2(e) sobre controle de informação documentada de origem externa.

Equivale parcialmente ao controle de documentos externos via SOGI mencionado no PSG-DOC.

## 2. Análise por Sub-requisito ISO 7.5

### 2.1 Item 7.5.1 — Generalidades

**Situação no sistema:**
- [x] Catálogo de legislações e normas aplicáveis
- [x] Vinculação com documentos do sistema (`document_id` FK)
- [x] Status de conformidade rastreado

### 2.2 Item 7.5.2 — Criando e Atualizando

**Situação no sistema:**
- [x] Campos de identificação: `legislation_type`, `law_number`, `issuing_authority`, `subject`
- [x] Datas: `publication_date`, `effective_date`, `expiration_date`
- [x] Frequência de revisão: enum `mensal/trimestral/semestral/anual/bienal`
- [x] Responsável: `responsible_user_id`
- [ ] Sem campo para "resumo das alterações" quando legislação é atualizada

**Evidências:**
- `src/services/gedDocuments.ts:98-116` — Interface `LegalDocument`:
  ```typescript
  interface LegalDocument {
    legislation_type: string;
    law_number?: string;
    publication_date?: string;
    effective_date?: string;
    expiration_date?: string;
    issuing_authority?: string;
    subject: string;
    compliance_status: string;
    review_frequency: 'mensal' | 'trimestral' | 'semestral' | 'anual' | 'bienal';
    next_review_date?: string;
    responsible_user_id?: string;
  }
  ```

### 2.3 Item 7.5.3 — Controle

#### 2.3.1 Disponibilidade e Proteção
- [x] Documentos legais centralizados em tabela dedicada
- [x] Filtros por tipo, status, autoridade emissora

#### 2.3.2 Documentos Externos (7.5.3.2e)
- [x] **Identificação**: Tipo, número, autoridade emissora
- [x] **Controle**: Status de conformidade, frequência de revisão
- [x] **Revisão programada**: `next_review_date` com frequências definidas
- [ ] **Sem integração SOGI**: PSG-DOC usa SOGI para legislação
- [ ] **Sem alerta automático** de vencimento/revisão na interface

## 3. Mapeamento PSG-DOC

| # | Requisito PSG-DOC | Status | Evidência |
|---|-------------------|--------|-----------|
| P14 | Controle docs externos (SOGI) | ⚠️ Parcial | Tabela própria com campos equivalentes, sem SOGI |
| P12 | Ciclo de revisão | ✅ Implementado | review_frequency com 5 opções + next_review_date |
| P15 | Retenção | ⚠️ Parcial | expiration_date existe mas sem disposição automática |

## 4. Evidências Detalhadas

### 4.1 Tabela `legal_documents`
| Campo | Tipo | Função |
|-------|------|--------|
| `legislation_type` | string | Tipo (Lei, Decreto, Resolução, Norma, etc.) |
| `law_number` | string | Número oficial |
| `issuing_authority` | string | Autoridade emissora |
| `subject` | text | Assunto/ementa |
| `publication_date` | date | Data de publicação |
| `effective_date` | date | Data de vigência |
| `expiration_date` | date | Data de expiração |
| `compliance_status` | string | Status de conformidade |
| `review_frequency` | enum | mensal/trimestral/semestral/anual/bienal |
| `next_review_date` | date | Próxima revisão programada |
| `responsible_user_id` | uuid | Responsável pelo acompanhamento |
| `document_id` | uuid FK | Documento associado no GED |

### 4.2 Páginas
- `LegislationsHub.tsx` — Hub de legislações com busca e filtros
- `LegislationDetail.tsx` — Detalhe de legislação individual
- `LegislationForm.tsx` — Cadastro/edição
- `LegislationReports.tsx` — Relatórios de conformidade
- `LegislationComplianceProfiles.tsx` — Perfis de compliance
- `Licenciamento.tsx` — Licenças ambientais e operacionais

## 5. Lacunas e Recomendações

| # | Lacuna | Severidade | Recomendação |
|---|--------|------------|--------------|
| 1 | Sem integração SOGI | Média | Avaliar API do SOGI ou manter funcionalidade equivalente |
| 2 | Sem alertas automáticos de revisão/vencimento | Alta | Implementar notificações para `next_review_date` e `expiration_date` |
| 3 | Sem log de alterações em legislação | Média | Registrar mudanças na trilha de auditoria |
| 4 | Sem campo "resumo de alterações" | Baixa | Adicionar campo para registrar o que mudou em revisões |

## 6. Nota de Confiança: 3.0/5

| Critério | Peso | Nota | Observação |
|----------|------|------|------------|
| Cobertura funcional 7.5 | 30% | 3.5/5 | Catalogação, revisão programada, compliance status |
| Aderência PSG-DOC | 25% | 2.5/5 | Sem SOGI, sem alertas automáticos |
| Maturidade do código | 15% | 3/5 | Tipagem TS, enums para frequência |
| Rastreabilidade | 15% | 2.5/5 | Sem log de alterações específico |
| UX/Usabilidade | 15% | 3.5/5 | Hub com busca, filtros, relatórios |
| **Média ponderada** | **100%** | **3.0/5** | |

## 7. Guia de Verificação E2E

### Cenários de Teste

1. **Cadastro de Legislação**
   - Navegar para hub de legislações → cadastrar nova
   - Preencher: tipo, número, autoridade, subject, datas, frequência de revisão
   - Salvar → verificar na lista

2. **Revisão Programada**
   - Legislação com `next_review_date` próximo
   - Verificar se alerta é exibido (esperado: não implementado)

3. **Status de Conformidade**
   - Alterar compliance_status → verificar que reflete na listagem
   - Gerar relatório de conformidade

### Checklist
- [ ] CRUD de legislações funciona
- [ ] Frequência de revisão é exibida corretamente
- [ ] next_review_date é calculado baseado em review_frequency
- [ ] Relatórios de conformidade são gerados
- [ ] Vinculação com documento do GED funciona
