

# Plano: PRD Backoffice - Modulo de Acoes Corretivas (Visao do Gestor)

## Resumo

Gerar um PDF profissional focado no backoffice de gestao de acoes corretivas e planos de acao 5W2H, sob a perspectiva do usuario "Gestor da Qualidade". Baseado na analise da pagina AcoesCorretivas.tsx, PlanoAcao5W2H.tsx, ActionPlanDetailsModal.tsx e actionPlans.ts.

## Estrutura do PRD (14 Secoes)

1. **Visao Geral do Modulo** - Escopo: gestao de planos de acao corretiva, preventiva e de melhoria com metodologia 5W2H. Duas interfaces: Acoes Corretivas (lista simplificada) e Planos de Acao 5W2H (gestao completa com itens). Vinculo com NCs e SGQ.
2. **Persona: Gestor da Qualidade** - Responsabilidades: criar planos, atribuir acoes, monitorar progresso, controlar prazos e custos.
3. **Arquitetura Funcional** - 2 tabelas principais: action_plans (plano) e action_plan_items (itens 5W2H). Relacionamento 1:N. Vinculo com profiles (responsaveis) e employees.
4. **Planos de Acao** - Campos: title (obrigatorio), description, objective, plan_type (Corretiva/Preventiva/Melhoria/Projeto), status (Planejado/Em Andamento/Concluido/Cancelado). Isolamento por company_id + created_by_user_id. CRUD completo.
5. **Itens 5W2H** - Estrutura: What (what_action - obrigatorio), Why (why_reason), Where (where_location), When (when_deadline - obrigatorio), Who (who_responsible_user_id → employees), How (how_method), How Much (how_much_cost em R$). Status individual: Pendente/Em Andamento/Concluido. progress_percentage (0-100).
6. **Logica de Progresso Automatico** - Calculo: media aritmetica de progress_percentage de todos os itens. Auto-status do plano: 0% = Planejado, >0% = Em Andamento, 100% = Concluido. Recalculo disparado ao atualizar progresso de qualquer item.
7. **Deteccao de Atraso** - Regra: when_deadline < data atual E status != Concluido → item em atraso. Highlight visual (borda vermelha, badge "Em Atraso"). KPI: total de acoes em atraso no dashboard de estatisticas.
8. **Dashboard de Estatisticas** - 5 KPIs: Total de Planos, Planos Ativos, Total de Acoes (com concluidas), Acoes em Atraso, Progresso Medio (%). Calculados via getActionPlanStats().
9. **Modal de Detalhes do Plano** - 3 abas: Visao Geral (progresso, status, tipo, datas), Acoes 5W2H (lista de itens com CRUD inline, progresso editavel, responsavel, custo formatado em BRL), Analise (distribuicao por status com barras, custo total, itens em atraso, timeline de prazos).
10. **Gestao de Responsaveis** - Vinculo com tabela employees (status Ativo). Resolucao de nome via profiles (full_name). Fallback para "Usuario nao encontrado".
11. **Tipos de Plano e Origens** - 4 tipos: Corretiva (originada de NC ou auditoria), Preventiva (originada de analise de risco), Melhoria (melhoria continua), Projeto (iniciativa estrategica). Vinculo com NCs via nc_action_plans (tabela separada para acoes dentro do fluxo de NC).
12. **Integracao com Outros Modulos** - NCs (nc_action_plans na etapa 4/5), SWOT (linked_action_plan_item_id), Auditorias (findings geram acoes), Dashboard de Qualidade (UnifiedQualityDashboard com link direto).
13. **Multi-tenancy e Seguranca** - company_id obrigatorio, created_by_user_id registrado na criacao. RLS implicito. Validacao de sessao via getUserAndCompany().
14. **Glossario** - 5W2H, PDCA, CAPA, Plano de Acao, Acao Corretiva, Acao Preventiva.

## Implementacao

- Script Python com reportlab
- Foco em use cases e fluxos do Gestor
- Tabelas de regras de negocio, status e calculo de progresso
- Saida: `/mnt/documents/PRD_Modulo_AcoesCorretivas_Backoffice.pdf`
- QA visual obrigatorio apos geracao

