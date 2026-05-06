# Refocar a aba "Uso & Custos" — remover duplicações com Gabardo View

## Diagnóstico

Hoje, com o filtro padrão setado em Gabardo, **a aba "Uso & Custos" repete quase tudo que já existe em "Gabardo View"**:

| Métrica / Visão | Gabardo View | Uso & Custos | Veredito |
|---|---|---|---|
| KPI Pageviews / Usuários únicos / Eventos | ✅ | ✅ | Duplicado |
| KPI Chamadas IA / Tokens / Custo IA | ✅ (Custo) | ✅ (3 cards) | Duplicado |
| Top usuários por engajamento (com tempo, dias ativos) | ✅ + drawer | ✅ (versão mais pobre) | Duplicado — Gabardo é melhor |
| Páginas mais usadas | ✅ + drawer + tempo médio | ✅ + último acesso | Duplicado — Gabardo é melhor |
| Custo IA por função/feature/modelo (tabela) | ✅ | ✅ | Duplicado |
| Série diária (views/eventos/custo) | ✅ (`GabardoChartsRow`) | ✅ (LineChart overview) | Duplicado |
| Classificação Power/Regular/Casual/Churning/Ghost + adoção por módulo | ✅ (`GabardoUsageInsightsPanel`) | ❌ | Único Gabardo |
| Ghost users (cadastrados, nunca acessaram) | ✅ | ❌ | Único Gabardo |

O que **só "Uso & Custos" oferece** e vale manter:

1. **Seletor multi-empresa** (útil só para auditar contas de teste — usar pouco, mas necessário)
2. **Custo por modelo** (chart) — visão de engenharia / decisão de gateway
3. **Custo por edge function** (chart) + **latência média** — perf/finops
4. **Custo por empresa** (quando "Todas") — comparativo cross-tenant
5. **Heatmap dia × hora** — sazonalidade real de uso
6. **Rotas mortas** (auditoria de código — candidatas a remoção)
7. **Erros de IA** (timeouts, 429, 402)

## Plano

Reposicionar **"Uso & Custos"** como aba **técnica / engenharia / finops da plataforma inteira**, não mais como duplicata da visão Gabardo.

### Mudanças em `src/components/platform/UsageAnalyticsTab.tsx`

1. **Mudar copy do header** para:
   > "Visão técnica de custo IA, performance de edge functions e auditoria de rotas. Para uso por usuário/feature da Gabardo, ver aba 'Gabardo View'."

2. **Mudar default do filtro** de empresa: passar de "Gabardo" para **"Todas as organizações"** (a aba agora é multi-tenant por natureza). Remover o `localStorage GABARDO_DEFAULT_KEY` ou manter só como override manual.

3. **Reduzir KPIs de 6 para 3**, focando em custo/perf:
   - Custo IA total (USD)
   - Tokens IA totais
   - Erros de IA (com badge destrutivo se > 0)
   
   Remover: Visualizações, Usuários únicos, Eventos (já em Gabardo View).

4. **Remover sub-tabs duplicadas**:
   - ❌ Remover **"Visão geral"** (LineChart diário) — `GabardoChartsRow` já cobre
   - ❌ Remover **"Páginas"** — `TopRoutesTable` já cobre com mais contexto
   - ❌ Remover **"Eventos"** — já tem em Gabardo View KPI + `GabardoChartsRow`
   - ❌ Remover **"Usuários"** (sub-tab `usuarios-uso`) — `TopUsersTable` + `GabardoUsageInsightsPanel` já cobrem com classificação
   - ✅ Manter **"IA & Custos"** (custo por modelo, por function, por empresa, latência, erros) — promover a default
   - ✅ Manter **"Heatmap"** — não existe em Gabardo View
   - ✅ Manter **"Rotas mortas"** — auditoria de código, não-uso

5. **Renomear a aba** no `PlatformAdminDashboard.tsx` de **"Uso & Custos"** para **"Custos & Infra IA"** (deixa claro o foco).

### Arquivos afetados

- `src/components/platform/UsageAnalyticsTab.tsx` — refator principal (corte de ~250 linhas)
- `src/pages/PlatformAdminDashboard.tsx` — renomear o trigger da aba

### Resultado esperado

- **Gabardo View** = "quem usou o quê, por quanto tempo, qual feature adotou" (negócio).
- **Custos & Infra IA** = "quanto custou, qual modelo, qual function, quais rotas estão mortas, quando bate o pico" (técnico).

Sem sobreposição, cada aba com propósito único e screenshot-ready.

## Pergunta antes de implementar

A edge function `get-usage-summary` continua sendo usada pelo que sobra (IA, heatmap, dead routes, custo por empresa) — **não precisa mexer no backend**. Confirma que posso prosseguir com esse corte?
