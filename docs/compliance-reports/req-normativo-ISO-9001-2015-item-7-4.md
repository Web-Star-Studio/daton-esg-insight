# Resumo Executivo — Análise ISO 9001:2015 Item 7.4

**Data da análise:** 2026-03-04
**Sistema:** Daton ESG Insight
**Requisito normativo:** ISO 9001:2015, item 7.4 — Comunicação
**Documento de validação:** FPLAN 008 Rev.4 (Plano de Comunicação — SGI)

---

## Nota Global de Confiança: 3.2/5

### Notas por Módulo

| # | Módulo | Nota | Classificação |
|---|--------|------|---------------|
| 01 | Stakeholder Communication Hub | **4.0/5** | Maduro |
| 02 | Gestão de Stakeholders | **4.5/5** | Maduro |
| 03 | Templates de Comunicação | **2.5/5** | Parcial |
| 04 | Matriz de Engajamento | **4.0/5** | Maduro |
| 05 | Analytics de Stakeholders | **3.5/5** | Funcional |
| 06 | GRI 2-29 / Transparência | **4.0/5** | Maduro |
| 07 | GRI 2-29 / Engajamento | **3.5/5** | Funcional |
| 08 | AI Handlers (Comunicação) | **3.5/5** | Funcional |
| 09 | Banco de Dados / Schema | **4.0/5** | Maduro |
| 10 | Cobertura FPLAN 008 | **2.0/5** | Parcial |
| 11 | Entrega Real (E-mail/SMS) | **1.0/5** | Mínimo |
| 12 | Dashboard de Conformidade ISO 7.4 | **1.5/5** | Mínimo |
| | **Média aritmética** | **3.2/5** | |

### Distribuição por Classificação

| Classificação | Quantidade | Módulos |
|---------------|------------|---------|
| Maduro (4+) | 5 | Communication Hub, Gestão Stakeholders, Matriz Engajamento, GRI Transparência, Schema DB |
| Funcional (3-3.9) | 3 | Analytics, GRI Engajamento, AI Handlers |
| Parcial (2-2.9) | 2 | Templates, Cobertura FPLAN 008 |
| Mínimo/Ausente (0-1.9) | 2 | Entrega Real, Dashboard Conformidade |

---

## Top 5 Pontos Fortes

1. **Gestão de Stakeholders completa** (4.5/5) — Cadastro com 8 categorias (investors, employees, customers, community, suppliers, regulators, ngos, media), níveis de influência e interesse (high/medium/low), frequência de engajamento (monthly/quarterly/biannual/annual), canal preferido, CRUD completo via `src/services/stakeholders.ts`. Cobre diretamente ISO 7.4 c) "com quem comunicar".

2. **Communication Hub multicanal** (4.0/5) — 5 tipos de canal (email, meeting, phone, survey, document), 6 estados de status (draft, sent, delivered, read, replied, scheduled), bidirecional (inbound/outbound), priorização (low/medium/high), anexos, tags e vinculação a stakeholder. Implementado em `src/components/StakeholderCommunicationHub.tsx` (990 linhas).

3. **Matriz de Engajamento Poder/Interesse** (4.0/5) — Visualização matricial que classifica stakeholders em 4 quadrantes (Gerenciar de Perto, Manter Satisfeito, Manter Informado, Monitorar). Analytics com tendências de engajamento, riscos e ações futuras via `StakeholderEngagementMatrix.tsx` e `StakeholderAnalyticsDashboard.tsx`.

4. **Schema de banco de dados robusto** (4.0/5) — Tabelas `stakeholders`, `stakeholder_communications`, `materiality_assessments`, `stakeholder_surveys`, `survey_responses` com Row-Level Security (RLS), multi-tenancy via `company_id`, índices em campos de consulta frequente, e trilha de auditoria (`created_by_user_id`, timestamps).

5. **Alinhamento GRI 2-29 e AA1000SES** (4.0/5) — Módulo `CommunicationTransparencyDataModule.tsx` (830 linhas) com 4 dimensões (Estratégia Formal, Comunicação Interna, Declarações Públicas, Disponibilidade Pública), scoring de princípios AA1000SES (Inclusividade, Responsividade, Materialidade, Impacto), e checklist documental com referências GRI/AA1000.

---

## Top 5 Lacunas Críticas

### 1. Cobertura FPLAN 008 Insuficiente (Severidade: ALTA)
**Impacto:** FPLAN 008 Rev.4, ISO 7.4
**Situação:** O FPLAN 008 define ~35 workflows de comunicação cobrindo processos operacionais específicos (segurança viária, aspectos ambientais, monitoramento ambiental, emergências, almoxarifado, manutenção, calibração). O sistema Daton é genérico — não possui módulos dedicados para estes processos operacionais específicos. A comunicação é gerida a nível de stakeholder, não a nível de processo SGI.
**Recomendação:** Criar mapeamento explícito entre processos FPLAN 008 e registros de comunicação. Adicionar campo `processo_sgi` à tabela `stakeholder_communications` para rastreabilidade por processo. Alternativamente, importar os workflows do FPLAN 008 como templates categorizados.

### 2. Ausência de Entrega Real de Comunicações (Severidade: ALTA)
**Impacto:** ISO 7.4 d) "como comunicar", FPLAN 008 coluna "Como Comunicar"
**Situação:** O Communication Hub registra comunicações mas não as envia. Não há integração com serviço de e-mail (SendGrid, SES), SMS, ou sistema de reuniões. O campo `status: 'sent'` é setado manualmente sem confirmação de entrega real. FPLAN 008 especifica canais como "E-mail", "Reunião", "Quadro de avisos", "DDS" que requerem execução efetiva.
**Recomendação:** Integrar com serviço de e-mail transacional (Resend/SendGrid) para envio real. Implementar webhooks de status (entregue/lido/bounced). Para reuniões, integrar com Google Calendar/Outlook.

### 3. Templates Hardcoded e Não-Extensíveis (Severidade: MÉDIA)
**Impacto:** ISO 7.4 a) "o que comunicar", FPLAN 008 coluna "O Que Comunicar"
**Situação:** Apenas 2 templates estão disponíveis (Relatório Trimestral e Convite para Reunião), ambos hardcoded no componente React (linhas 158-176 de `StakeholderCommunicationHub.tsx`). Não há tabela de banco de dados para templates. O FPLAN 008 define ~35 tipos distintos de comunicação que precisariam de templates próprios.
**Recomendação:** Criar tabela `communication_templates` no Supabase com CRUD pela UI. Pré-popular com templates baseados nos processos do FPLAN 008.

### 4. Sem Dashboard de Conformidade ISO 7.4 (Severidade: MÉDIA)
**Impacto:** ISO 7.4, FPLAN 008 "Frequência"
**Situação:** Não existe dashboard que consolide o status de conformidade com ISO 7.4 ou que monitore a aderência ao plano de comunicação FPLAN 008. Não há alertas para comunicações atrasadas conforme frequência definida no FPLAN (mensal, trimestral, semestral, anual, quando necessário).
**Recomendação:** Criar dashboard de compliance que cruze frequência esperada (FPLAN 008) vs. comunicações realizadas. Implementar alertas automáticos para comunicações em atraso.

### 5. Frequência de Comunicação sem Enforcement (Severidade: MÉDIA)
**Impacto:** ISO 7.4 b) "quando comunicar", FPLAN 008 coluna "Frequência"
**Situação:** O campo `engagement_frequency` existe no cadastro de stakeholders (monthly/quarterly/biannual/annual), mas não há mecanismo automático que verifique se a frequência está sendo cumprida. O FPLAN 008 define frequências específicas por processo (ex: "Trimestral" para auditorias, "Quando houver" para emergências, "Mensal" para DDS).
**Recomendação:** Implementar cron job ou check periódico que compare `engagement_frequency` com a data da última comunicação por stakeholder. Gerar alertas quando a frequência não for atendida.

---

## Cobertura por Sub-requisito ISO 7.4

| Sub-requisito | Cobertura | Nível |
|---------------|-----------|-------|
| 7.4 a) O que comunicar | Templates com subject/content, campo de assunto livre, módulo GRI com checklist documental | Funcional |
| 7.4 b) Quando comunicar | `engagement_frequency` por stakeholder, `scheduled_date` por comunicação, sem enforcement automático | Funcional |
| 7.4 c) Com quem comunicar | 8 categorias de stakeholders, filtro por influência/interesse, seleção direta no hub | Maduro |
| 7.4 d) Como comunicar | 5 canais (email, meeting, phone, survey, document), `preferred_communication` por stakeholder, sem envio real | Parcial |
| 7.4 e) Quem comunica | `created_by_user_id` registrado, exibição do responsável, sem designação prévia por processo | Funcional |

---

## Cobertura FPLAN 008 Rev.4

| # | Processo | Tipo | Status | Nota |
|---|----------|------|--------|------|
| 01 | Contexto da Organização — Política e objetivos do SGI | Interna | ⚠️ | Stakeholders registráveis, sem processo SGI dedicado |
| 02 | Dados Institucionais — Histórico e serviços | Interna | ❌ | Sem módulo de dados institucionais |
| 03 | Metas, Planos e Objetivos — Metas das equipes | Interna | ⚠️ | OKRs e iniciativas estratégicas existem, sem vínculo com comunicação |
| 04 | Fatores de Desempenho — Segurança Viária | Interna | ❌ | Sem módulo de segurança viária |
| 05 | Aspectos e Impactos Ambientais | Interna | ⚠️ | Módulo ambiental existe (GRI), sem fluxo de comunicação formal |
| 06 | Requisitos Legais e Outros | Interna | ⚠️ | Documentos regulatórios existem, sem comunicação automática |
| 07 | Monitoramento Ambiental — Resultados | Interna | ⚠️ | Dados ambientais existem, sem rotina de comunicação |
| 08 | Atendimento a Emergências — Procedimento interno | Interna | ❌ | Sem módulo de emergências |
| 09 | Atendimento a Emergências — Procedimento externo | Externa | ❌ | Sem módulo de emergências externas |
| 10 | Atendimento a Emergências — Acidente familiar | Externa | ❌ | Sem módulo específico |
| 11 | Riscos e Oportunidades — Informação atualizada | Interna | ⚠️ | Matriz de riscos existe, sem fluxo de comunicação formal |
| 12 | Planejamento de Mudanças — Alterações operacionais | Interna | ❌ | Sem módulo de gestão de mudanças |
| 13 | Não-Conformidades e Ações Corretivas | Interna | ⚠️ | NC Dashboard existe, sem comunicação automática vinculada |
| 14 | Auditorias — Planejamento e resultados | Interna | ⚠️ | Módulo de auditoria existe, sem comunicação automática |
| 15 | Satisfação do Cliente — Pesquisas | Externa | ⚠️ | Surveys de stakeholders existem, sem processo de satisfação dedicado |
| 16 | Compras — Desempenho fornecedores | Interna | ⚠️ | Gestão de fornecedores existe, sem comunicação de desempenho |
| 17 | Comercial — Tabela de preços e serviços | Externa | ❌ | Sem módulo comercial |
| 18 | Comunicação com Cliente — Informações | Externa | ⚠️ | Communication Hub genérico disponível |
| 19 | Comunicação com Cliente — Reclamações | Externa | ⚠️ | Communication Hub suporta inbound, sem workflow de reclamação |
| 20 | Comunicação com Cliente — Feedback | Externa | ⚠️ | Surveys disponíveis |
| 21 | Almoxarifado — Conformidade de recebimento | Interna | ❌ | Sem módulo de almoxarifado |
| 22 | Controle de Documentos — Alterações | Interna | ✅ | GED com versionamento e notificações |
| 23 | Manutenção — Necessidades | Interna | ❌ | Sem módulo de manutenção |
| 24 | Monitoramento e Calibração — Status | Interna | ❌ | Sem módulo de calibração |
| 25 | Mudanças no SGI — Impacto no sistema | Interna | ❌ | Sem módulo de gestão de mudanças SGI |
| 26 | Comunicação SGI — Canais gerais | Interna/Externa | ✅ | Communication Hub com 5 canais |
| 27 | Instituto Água e Terra — Órgão ambiental PR | Externa | ❌ | Sem integração com órgãos ambientais |

**Resumo:** 2/27 implementados (✅), 13/27 parciais (⚠️), 12/27 ausentes (❌)

---

## Plano de Ação Priorizado

### Quick Wins (1-2 semanas)
| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
| 1 | Adicionar campo `processo_sgi` à tabela `stakeholder_communications` | 09 | FPLAN 008 rastreabilidade |
| 2 | Criar tabela `communication_templates` no Supabase | 03, 09 | ISO 7.4 a) |
| 3 | Migrar templates hardcoded para banco de dados com CRUD | 03 | Extensibilidade |
| 4 | Adicionar templates pré-definidos baseados nos processos FPLAN 008 | 03, 10 | Cobertura FPLAN |
| 5 | Adicionar campo `responsible_role` à tabela `stakeholder_communications` | 09 | ISO 7.4 e) |

### Melhorias Estruturais (2-4 semanas)
| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
| 6 | Implementar alerta de frequência: comparar `engagement_frequency` vs. última comunicação | 05, 12 | ISO 7.4 b) |
| 7 | Criar dashboard de conformidade ISO 7.4 com visão de cobertura por processo | 12 | Compliance |
| 8 | Implementar workflow de comunicação por processo SGI (mapeamento FPLAN 008) | 01, 10 | FPLAN 008 |
| 9 | Adicionar designação prévia de responsável por tipo de comunicação | 01, 02 | ISO 7.4 e) |
| 10 | Vincular módulos existentes (NC, Auditorias, Riscos) com registros de comunicação | 01, 10 | FPLAN 008 processos 11-14 |

### Mudanças Arquiteturais (1-2 meses)
| # | Ação | Módulos | Impacto |
|---|------|---------|---------|
| 11 | Integrar serviço de e-mail transacional (Resend/SendGrid) | 11 | ISO 7.4 d) entrega real |
| 12 | Integrar com Google Calendar/Outlook para convites de reunião | 11 | ISO 7.4 d) reuniões |
| 13 | Implementar confirmação de leitura para comunicações enviadas | 01, 11 | Rastreabilidade |
| 14 | Criar módulos operacionais ausentes (emergências, manutenção, calibração) | 10 | FPLAN 008 processos 8-10, 23-24 |
| 15 | Implementar DDS digital (Diálogo Diário de Segurança) como tipo de comunicação | 01, 10 | FPLAN 008 segurança |

---

## Guia de Validação E2E

1. **Navegar para** Gestão de Stakeholders (`/gestao-stakeholders`)
2. **Verificar** cadastro de stakeholders com categorias, níveis de influência/interesse e canal preferido
3. **Acessar** aba "Hub de Comunicação" e criar nova comunicação para um stakeholder
4. **Testar** aplicação de template (Relatório Trimestral ou Convite para Reunião)
5. **Verificar** que comunicação foi salva com status, prioridade e tipo corretos
6. **Acessar** aba "Matriz de Engajamento" e verificar posicionamento dos stakeholders
7. **Acessar** aba "Analytics" e verificar métricas de engajamento
8. **Navegar para** GRI Wizard → Etapa 4 → Módulo "Comunicação e Transparência"
9. **Verificar** que perguntas cobrem estratégia formal, comunicação interna, declarações públicas e disponibilidade
10. **Verificar** scoring AA1000SES (Inclusividade, Responsividade, Materialidade, Impacto)

---

## Conclusão

O sistema Daton ESG Insight apresenta uma **base sólida** para gestão de comunicação conforme ISO 9001:2015 item 7.4, com nota global de **3.2/5 (Funcional)**. A arquitetura de stakeholder management e o Communication Hub são maduros — cobrem os 5 sub-requisitos ISO 7.4 (o que, quando, com quem, como, quem) e integram-se com frameworks de reporte GRI 2-29 e AA1000SES.

As **principais forças** estão na Gestão de Stakeholders (4.5/5), no Communication Hub multicanal (4.0/5), na Matriz de Engajamento (4.0/5) e no schema de banco de dados (4.0/5). O sistema excede os requisitos básicos de ISO 7.4 c) "com quem comunicar" com 8 categorias e análise poder/interesse.

As **lacunas mais críticas** são: cobertura insuficiente dos ~35 processos operacionais do FPLAN 008 (2.0/5), ausência de entrega real de comunicações (1.0/5), templates hardcoded sem extensibilidade (2.5/5), e falta de dashboard de conformidade (1.5/5). O sistema é fundamentalmente orientado a stakeholders ESG, enquanto o FPLAN 008 cobre processos operacionais de transporte/logística que não possuem módulos dedicados.

Dos 27 processos FPLAN 008 mapeados, **2 estão plenamente implementados**, **13 parcialmente**, e **12 ausentes**. O plano de ação com 15 itens priorizados pode elevar a nota para 4.0+ em 1-2 meses, com foco inicial na criação de templates por processo e no mapeamento processo-comunicação.
