

# Plano: PRD Backoffice - Modulo de Nao Conformidades (Visao do Gestor)

## Resumo

Gerar um PDF profissional focado no backoffice de gestao de nao conformidades, sob a perspectiva do usuario "Gestor da Qualidade". Baseado na analise completa do servico principal, 6 componentes de etapas, dashboard avancado, pagina de tarefas e utilitarios de status.

## Estrutura do PRD (18 Secoes)

1. **Visao Geral do Modulo** - Escopo: gestao completa do ciclo de vida de NCs com 6 etapas sequenciais (Qualyteam workflow). 4 abas: Dashboard, Analytics, Lista, Minhas Tarefas.
2. **Persona: Gestor da Qualidade** - Responsabilidades, fluxos operacionais, tomada de decisao.
3. **Arquitetura Funcional** - 8 dominios: Registro, Acoes Imediatas, Analise de Causa, Planejamento 5W2H, Implementacao, Eficacia, Tarefas, Timeline.
4. **Registro de NC (Etapa 1)** - Campos: titulo, descricao, categoria, severidade (4 niveis), fonte (7 tipos), data deteccao, dano, unidade organizacional, setor (14 opcoes fixas), responsavel, referencias ISO assistidas por IA. Numeracao automatica NC-YYYYMMDD-XXXX. Validacoes (titulo min 5 chars, descricao min 10).
5. **Acao Imediata (Etapa 2)** - Multiplas acoes por NC, status (Pendente/Em Andamento/Concluida/Cancelada), responsavel (employee ou profile com fallback), prazo, evidencia, anexos, auditoria (created_by).
6. **Analise de Causa (Etapa 3)** - 4 metodos: root_cause, ishikawa, 5_whys, other. 8 categorias de causa (6M + Sistema + Gestao): Mao de Obra, Maquina, Material, Metodo, Meio Ambiente, Medicao, Sistema/Tecnologia, Gestao/Planejamento. Diagrama de Ishikawa interativo. Analise 5 Porques. NCs similares vinculadas.
7. **Planejamento 5W2H (Etapa 4)** - Plano de acao estruturado: What (acao), Why (razao), How (metodo), Where (local), Who (responsavel), When (prazo), How Much (custo). Status (Planejada/Em Execucao/Concluida/Cancelada). Ordenacao por order_index.
8. **Implementacao (Etapa 5)** - Execucao dos planos de acao. Upload de evidencias para Supabase Storage (bucket nc-evidence). Acompanhamento de conclusao por plano individual.
9. **Avaliacao de Eficacia (Etapa 6)** - Resultado Efetivo/Nao Efetivo. Dois modos: Avaliar ou Adiar. Se nao eficaz: reabrir NC para nova analise. Flags: requires_risk_update, requires_sgq_change (integracao com SGQ). Adiamento com data, motivo e responsavel. Revisoes versionadas (revision_number). Geracao de NC filha (generated_revision_nc_id).
10. **Encerramento de NC** - Requer todas as 6 etapas completas. Status muda para "closed", registra completion_date. NCs podem ter parent_nc_id (hierarquia de revisoes).
11. **Gestao de Tarefas** - 6 tipos (registration, immediate_action, cause_analysis, planning, implementation, effectiveness). 5 status (Pendente/Em Andamento/Concluida/Atrasada/Cancelada). 4 prioridades (Baixa/Normal/Alta/Urgente). Pagina dedicada /nc-tarefas com filtros por tipo, status e busca. Vinculo com NC e responsavel.
12. **Timeline e Auditoria** - Tabela non_conformity_timeline com tipos: created, status_changed, approved, updated. Registro de old_values/new_values, usuario, anexos. Modal dedicado com visualizacao cronologica.
13. **Normalizacao de Status** - Mapeamento bidirecional PT/EN (ncStatusUtils): open=Aberta, in_progress=Em Tratamento, closed=Encerrada, pending=Pendente, cancelled=Cancelada, approved=Aprovada. Cores para badges e graficos (HEX). Funcoes auxiliares: isNCClosed, isNCInProgress, isNCOpen.
14. **Dashboard Avancado** - 4 KPIs: NCs Abertas, NCs Encerradas, Tarefas Atrasadas (% do total), Taxa de Resolucao (%). Graficos: distribuicao por etapa (donut), distribuicao por severidade (donut), tendencia mensal (linha), SLA por tipo de tarefa (barras). RPC get_nc_dashboard_stats.
15. **Integracao com ISO** - Seletor assistido por IA (ISOAISearchModal + Gemini). Vinculo de norma + clausulas no registro. Armazenado em attachments.iso_references.
16. **Integracao com Outros Modulos** - Auditorias (audit_findings geram NCs), Indicadores de Qualidade, Gestao de Riscos (flag requires_risk_update), SGQ (flag requires_sgq_change), ESG Score (penalizacao por NCs abertas/criticas).
17. **Multi-tenancy e Seguranca** - Isolamento por company_id, RLS. Storage isolado (nc-evidence). Resolucao de responsavel via employees + profiles (fallback).
18. **Glossario** - NC, 5W2H, Ishikawa, 6M, SLA, SGQ, RPC.

## Implementacao

- Script Python com reportlab
- Foco em use cases e fluxos do Gestor (sem detalhes de implementacao)
- Tabelas de regras de negocio e fluxos de status formatados
- Saida: `/mnt/documents/PRD_Modulo_NaoConformidades_Backoffice.pdf`
- QA visual obrigatorio apos geracao

