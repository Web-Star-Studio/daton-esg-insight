# Resumo Executivo — Análise ISO 9001:2015 Item 7.5

**Data da análise:** 2026-03-04
**Sistema:** Daton ESG Insight
**Requisito normativo:** ISO 9001:2015, item 7.5 — Informação Documentada
**Documento de validação:** PSG-DOC Rev.17 (Gabardo — Controle de Documentos e Registros)

---

## Nota Global de Confiança: 3.1/5

### Notas por Módulo

| # | Módulo | Nota | Classificação |
|---|--------|------|---------------|
| 01 | GED / Documentos Hub | **3.5/5** | Funcional |
| 02 | Controle de Documentos SGQ/ISO | **3.0/5** | Funcional |
| 03 | Lista Mestra | **4.0/5** | Maduro |
| 04 | Controle de Versões | **3.5/5** | Funcional |
| 05 | Fluxos de Aprovação | **3.5/5** | Funcional |
| 06 | Permissões e Controle de Acesso | **3.5/5** | Funcional |
| 07 | Trilha de Auditoria | **3.0/5** | Funcional |
| 08 | Extração AI de Documentos | **2.5/5** | Parcial |
| 09 | Gestão de Fornecedores (Docs) | **2.5/5** | Parcial |
| 10 | Documentos Regulatórios/Legais | **3.0/5** | Funcional |
| 11 | Qualidade (SGQ) | **3.0/5** | Funcional |
| 12 | Administração/Sistema | **2.0/5** | Parcial |
| 13 | Cópias Controladas | **3.5/5** | Funcional |
| | **Média aritmética** | **3.1/5** | |

### Distribuição por Classificação

| Classificação | Quantidade | Módulos |
|---------------|------------|---------|
| Maduro (4+) | 1 | Lista Mestra |
| Funcional (3-3.9) | 8 | GED, Controle Docs, Versões, Aprovação, Permissões, Auditoria, Regulatórios, Qualidade, Cópias |
| Parcial (2-2.9) | 3 | Extração AI, Fornecedores, Administração |
| Mínimo/Ausente (0-1.9) | 0 | — |

---

## Top 5 Pontos Fortes

1. **Lista Mestra completa** (4.0/5) — Código, versão, data efetiva, revisão, distribuição, alertas automáticos, exportação PDF/Excel. Módulo mais maduro do sistema.

2. **Fluxo de aprovação multi-etapa** — Suporta aprovação sequencial e paralela, quórum configurável, 5 status (rascunho → em_aprovação → aprovado/rejeitado → obsoleto), com log de ações.

3. **Controle de versões com integridade** — Hash de conteúdo (`content_hash`), resumo de alterações, número sequencial, identificação do responsável. Rastreabilidade forte.

4. **Permissões granulares** — 4 níveis (leitura/escrita/aprovação/admin), expiração temporal, per-documento e per-pasta, complementadas por RLS do Supabase.

5. **Estrutura de dados abrangente** — Tabelas Supabase cobrem todo o ciclo de vida documental: `documents`, `document_versions`, `document_approvals`, `document_master_list`, `document_permissions`, `document_controlled_copies`, `document_audit_trail`.

---

## Top 5 Lacunas Críticas

### 1. Backup e Proteção sem Visibilidade (Severidade: ALTA)
**Impacto:** PSG-DOC P8, ISO 7.5.3.1
**Situação:** Backup 100% delegado ao Supabase sem monitoramento, status, ou verificação na UI. PSG-DOC exige responsabilidades definidas com monitoramento e registro de anomalias.
**Recomendação:** Implementar dashboard de health check do Supabase + procedimento documentado de backup/restore (equivalente IT-DOC.BACKUP).

### 2. Retenção sem Automação de Disposição (Severidade: ALTA)
**Impacto:** PSG-DOC P15, ISO 7.5.3.2(d)
**Situação:** Campo `retention_period` existe na tabela `documents` mas sem workflow automático de disposição. Trilha de auditoria com retenção de apenas 90 dias (insuficiente para ISO).
**Recomendação:** Implementar cron job para identificar documentos além da retenção + workflow de disposição (arquivar/destruir). Aumentar retenção de auditoria para mínimo 3 anos.

### 3. Protocolo de Implementação Ausente (Severidade: ALTA)
**Impacto:** PSG-DOC P10, ISO 7.5.3.2(a)
**Situação:** Não existe equivalente ao RG-DOC.01 (Protocolo de Implementação). Documentos são distribuídos mas sem confirmação de leitura/treinamento pelo destinatário.
**Recomendação:** Criar fluxo de "confirmação de leitura" que registra que o destinatário leu e compreendeu o documento. Integrar com treinamentos existentes.

### 4. Assinatura Eletrônica não Qualificada (Severidade: ALTA)
**Impacto:** PSG-DOC P4, ISO 7.5.2(c)
**Situação:** Aprovação usa `approver_user_id` + timestamp. PSG-DOC referencia "assinatura eletrônica" via QualityWeb. Não há assinatura digital qualificada nem confirmação por senha.
**Recomendação:** Implementar ao menos confirmação por senha no ato de aprovação, ou integrar com serviço de assinatura digital.

### 5. Codificação PSG-DOC não Enforçada (Severidade: MÉDIA)
**Impacto:** PSG-DOC P3, ISO 7.5.2(a)
**Situação:** Campo `code` na Lista Mestra é texto livre. Não há validação de formato (PSG-XX, IT-XX.YY, RG-XX.ZZ). Categorias no SGQIsoDocumentsTab faltam MSG e FPLAN.
**Recomendação:** Adicionar validação de formato no campo código + adicionar categorias MSG e FPLAN.

---

## Cobertura por Sub-requisito ISO 7.5

| Sub-requisito | Cobertura | Nível |
|---------------|-----------|-------|
| 7.5.1 Generalidades | Repositório central, categorização, templates ISO | Funcional |
| 7.5.2a Identificação | Título, código (lista mestra), tipo, tags | Funcional |
| 7.5.2b Formato | PDF/Excel/CSV, upload com validação | Funcional |
| 7.5.2c Análise crítica/aprovação | Multi-step workflows, 5 status | Funcional |
| 7.5.3.1 Disponibilidade | Interface web, busca, filtros | Maduro |
| 7.5.3.1 Proteção | RLS, permissões, autenticação | Funcional |
| 7.5.3.2a Distribuição/acesso | Permissões, cópias controladas | Funcional |
| 7.5.3.2b Armazenamento | Supabase Storage, hash integridade | Funcional |
| 7.5.3.2c Controle alterações | Versionamento, audit trail | Funcional |
| 7.5.3.2d Retenção/disposição | Campo existe, sem automação | Parcial |
| 7.5.3.2e Docs externos | Fornecedores e legais, sem SOGI | Parcial |

---

## Cobertura PSG-DOC Rev.17

| # | Requisito | Status | Nota |
|---|-----------|--------|------|
| P1 | Software de controle (QualityWeb) | ✅ | GED é equivalente funcional |
| P2 | 5 níveis documentação | ⚠️ | 9 categorias, faltam MSG e FPLAN |
| P3 | Codificação PSG-XX | ⚠️ | Campo livre, sem validação |
| P4 | Assinatura eletrônica | ⚠️ | user_id + timestamp, não qualificada |
| P5 | Rastreabilidade revisão | ✅ | version_number + changes_summary |
| P6 | Arquivamento obsoletos | ⚠️ | Status existe, sem automação |
| P7 | Grupos de acesso | ⚠️ | Permissões por user/role, sem grupos |
| P8 | Backup e proteção | ❌ | Delegado sem visibilidade |
| P9 | Distribuição | ✅ | Via interface + cópias controladas |
| P10 | Protocolo implementação | ❌ | Ausente |
| P11 | Lista Mestra | ✅ | Módulo completo |
| P12 | Ciclo 12 meses | ✅ | review_date + alertas |
| P13 | Cópias controladas | ✅ | Tabela com rastreamento |
| P14 | Docs externos (SOGI) | ⚠️ | Sem SOGI, controle próprio |
| P15 | Retenção/disposição | ⚠️ | Campo sem automação |

**Resumo:** 5/15 implementados (✅), 8/15 parciais (⚠️), 2/15 ausentes (❌)

---

## Plano de Ação Priorizado

### Quick Wins (1-2 semanas)
| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
| 1 | Adicionar categorias MSG e FPLAN ao `documentCategories` | 02 | P2 |
| 2 | Corrigir `created_by_user_id` hardcoded em versões | 04 | Integridade |
| 3 | Corrigir `company_id` hardcoded na Lista Mestra | 03 | Segurança |
| 4 | Tornar `changes_summary` obrigatório | 04 | P5 |
| 5 | Adicionar validação regex para campo `code` | 03 | P3 |

### Melhorias Estruturais (2-4 semanas)
| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
| 6 | Implementar confirmação de leitura (protocolo implementação) | 01, 05, 13 | P10 |
| 7 | Aumentar retenção de auditoria para 3+ anos | 07 | P15 |
| 8 | Implementar toggle automático `is_current` em versões | 04 | P6 |
| 9 | Adicionar alertas de revisão/vencimento para docs regulatórios | 10 | P12 |
| 10 | Implementar lock durante aprovação | 05 | Integridade |

### Mudanças Arquiteturais (1-2 meses)
| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
| 11 | Dashboard de backup/health do Supabase | 12 | P8 |
| 12 | Workflow automático de disposição por retenção | 01, 07 | P15 |
| 13 | Confirmação por senha na aprovação (assinatura) | 05 | P4 |
| 14 | Grupos de acesso nomeados (Admin, Auditores, etc.) | 06 | P7 |
| 15 | Integração SOGI ou equivalente funcional | 09, 10 | P14 |

---

## Conclusão

O sistema Daton ESG Insight apresenta uma **base sólida** para controle de informação documentada conforme ISO 9001:2015 item 7.5, com nota global de **3.1/5 (Funcional)**. A arquitetura de dados é abrangente — as tabelas Supabase cobrem versões, aprovações, lista mestra, permissões, cópias controladas e trilha de auditoria.

As **principais forças** estão na Lista Mestra (4.0/5) e nos mecanismos de controle de versões, aprovação e permissões (3.5/5 cada). A classificação de documentos e o repositório central atendem à maioria dos requisitos funcionais.

As **lacunas mais críticas** são: ausência de visibilidade de backup (P8), falta de automação de disposição (P15), protocolo de implementação inexistente (P10), e assinatura eletrônica não qualificada (P4). Estas lacunas representam riscos em uma auditoria ISO 9001.

Dos 15 requisitos PSG-DOC mapeados, **5 estão plenamente implementados**, **8 parcialmente**, e **2 ausentes**. O plano de ação priorizado com 15 itens pode elevar a nota para 4.0+ em 1-2 meses.

---

## Status de Implementação — 2026-03-05

### Ações Entregues

| # | Ação | Status | Evidência |
|---|------|--------|-----------|
| 1 | Adicionar categorias MSG e FPLAN | ✅ Implementado | `SGQIsoDocumentsTab` atualizado com novas categorias |
| 2 | Remover `created_by_user_id` hardcoded em versões | ✅ Implementado | `documentVersionsService.createVersion` usa usuário autenticado |
| 3 | Remover `company_id` hardcoded na Lista Mestra | ✅ Implementado | `DocumentMasterListModal` resolve `company_id` via perfil |
| 4 | Tornar `changes_summary` obrigatório | ✅ Implementado | validação no serviço + constraint/trigger na migration |
| 5 | Validação regex para `code` | ✅ Implementado | validação frontend + validação serviço + constraint DB |
| 6 | Confirmação de leitura (protocolo de implementação) | ✅ Implementado | botão de confirmação + trilha `READ_CONFIRMATION` |
| 7 | Retenção da trilha para 3+ anos | ✅ Implementado | função `cleanup_document_audit_trail(retention_years >= 3)` |
| 8 | Toggle automático `is_current` em versões | ✅ Implementado | trigger `normalize_document_version_insert` |
| 9 | Alertas de revisão/vencimento regulatório | ✅ Implementado | rotina `syncRegulatoryReviewAlerts` + botão/processamento automático |
| 10 | Lock durante aprovação | ✅ Implementado | trigger `prevent_document_changes_while_in_approval` |
| 11 | Visibilidade operacional de backup/health | ✅ Implementado | aba `Compliance 7.5` com health check e status |
| 12 | Workflow de disposição por retenção | ✅ Implementado | fila calculada + ações `arquivar/destruir` com auditoria atômica |
| 13 | Confirmação por senha na aprovação | ✅ Implementado | assinatura por senha no modal de aprovação (cliente isolado) |
| 14 | Grupos nomeados de acesso | ✅ Implementado | grupos padrão em permissões (`Administradores SGQ`, `Auditores`, etc.) |
| 15 | Equivalente funcional SOGI | ✅ Implementado | campos de rastreio de fonte externa em documentos regulatórios |

### Guia E2E de Validação

1. **Categorias SGQ/ISO**
   - Acesse `/controle-documentos` > aba **SGQ/ISO**.
   - Confirme presença de `MSG` e `FPLAN` no filtro e no upload.

2. **Lista Mestra + código normativo**
   - Abra **Lista Mestra** e tente cadastrar código inválido (`DOC-001`): deve bloquear.
   - Cadastre código válido (`FPLAN-001`): deve aceitar.
   - Verifique que `company_id` é da empresa autenticada.

3. **Versionamento e resumo de mudanças**
   - Crie nova versão sem `changes_summary`: deve falhar.
   - Crie com resumo: deve gravar e marcar somente uma versão como atual.

4. **Assinatura na aprovação**
   - Em documento `em_aprovacao`, tente aprovar sem senha: bloqueado.
   - Informe senha válida: aprovação/rejeição deve concluir.

5. **Lock de edição durante aprovação**
   - Com documento em `em_aprovacao`, tente alterar metadados críticos.
   - Banco deve rejeitar com erro de bloqueio.

6. **Protocolo de leitura**
   - Na aba SGQ/ISO, clique **Confirmar leitura** em um documento.
   - Badge deve mudar para **Leitura Confirmada** e trilha deve registrar `READ_CONFIRMATION`.

7. **Retenção e disposição**
   - Na aba **Compliance 7.5**, valide lista de documentos vencidos por retenção.
   - Execute `Arquivar`/`Destruir` e confirme registro na trilha.

8. **Saúde/backup**
   - Na aba **Compliance 7.5**, execute **health check**.
   - Verifique status dos checks e alerta/notificação quando houver falha.

9. **Alertas regulatórios**
   - Na aba regulatória, clique **Processar alertas**.
   - Verifique criação de notificações para responsáveis de documentos `A Vencer`/`Vencido`.

10. **Fonte externa (equivalente SOGI)**
   - Em novo/edição de documento regulatório, preencha `Fonte Externa`, `Referência` e `URL`.
   - Salve e valide exibição na tabela.
