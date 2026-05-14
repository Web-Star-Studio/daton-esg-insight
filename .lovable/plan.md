## Objetivo

Gerar um **PDF executivo** que o Daton possa entregar ao cliente Gabardo (e usar como template para outros), respondendo:

1. **Quanto já foi investido** no desenvolvimento do Daton até hoje (em horas × R$50 + tokens de IA consumidos no build).
2. **Quanto custa manter** mensalmente, quebrado por módulo, somando: tokens de IA em runtime, infra (Supabase/Lovable Cloud), domínio/terceiros e bolsa de manutenção evolutiva.

## Metodologia

### Estimativa de horas já gastas (triangulação)

Três fontes combinadas, média ponderada:

- **A. Contagem de código** — `~477k LOC` em `src/` + `~75 edge functions` + `436 migrations`. Aplicar produtividade ajustada (60–80 LOC/h efetivos para código gerado por IA com revisão humana, considerando refactors e descartes).
- **B. Histórico de mensagens Lovable** — extrair número de turnos/iterações desta workspace como proxy de esforço de produto (PM + QA + prompt engineering).
- **C. Complexidade funcional** — pontuar cada módulo por features entregues (CRUDs, integrações, IA, dashboards, fluxos multi-stage) usando benchmarks de mercado (story points → horas).

A triangulação dá faixa baixa/central/alta para evitar número único frágil.

### Custo de IA já consumido

- Histórico real da tabela `ai_usage_logs`: hoje acumula `~US$ 3,57` (108 chamadas; Gemini 2.5 Pro domina). Converter a BRL pelo câmbio do dia.
- Acrescentar estimativa de tokens consumidos **no build via Lovable** (não logados na tabela) — usar média de mercado por LOC gerado.

### Custo operacional mensal por módulo

Para cada um dos módulos mapeados abaixo, somar 4 componentes:

```text
Custo mensal módulo = IA runtime + Infra alocada + Terceiros + Bolsa manutenção
```

- **IA runtime**: projeção mensal a partir do `ai_usage_logs` (últimos 30/90 dias) atribuído ao módulo via nome da edge function. 19 edge functions chamam IA.
- **Infra**: rateio do custo Supabase (DB, storage, edge invocations, bandwidth) por % de tabelas/storage do módulo.
- **Terceiros**: domínio `daton.com.br`, e-mail transacional, ViaCEP (grátis), OCR MTR, Perplexity (legislação).
- **Manutenção evolutiva**: bolsa sugerida de horas/mês × R$50 por módulo, dimensionada pela criticidade e taxa de mudança.

### Mapa de módulos (capítulos do PDF)

Baseado em `src/components/`, `src/pages/` e edge functions:

| Módulo | Componentes-chave |
|---|---|
| SGQ / ISO 9001 | document control, audits, NCs, ações corretivas |
| LAIA / ISO 14001 | sectors, assessments, revisions |
| Licenciamento ambiental | licenses, renovações, compliance profiles, legislações |
| Resíduos & MTR | waste logs, OCR de MTR, fornecedores |
| Emissões GEE & Água | inventários, monitoramento |
| Social / RH | employees, training, succession, indicadores |
| Governança / ESG | materialidade, GRI wizard, ROI ESG |
| Financeiro | contas a pagar/receber, plano de contas, lançamentos |
| Inteligência & IA | daton-ai-chat, insights engine, learning engine |
| Plataforma & Admin | onboarding, RBAC, multi-tenant, platform admin |
| Infra transversal | auth, notificações, storage, design system |

## Entregável

PDF de ~12–18 páginas em `/mnt/documents/daton-analise-custo-gabardo.pdf` com:

1. **Capa** — Daton, cliente Gabardo, data, escopo do orçamento.
2. **Sumário executivo** — 1 página: total investido (faixa R$), custo mensal recomendado, ROI vs reconstrução em software house.
3. **Metodologia** — como calculamos (transparência para o cliente).
4. **Investimento já realizado** — tabela por módulo (horas estimadas, R$ horas, IA build, total) + gráfico de barras.
5. **Custo operacional mensal** — tabela por módulo (IA runtime, infra, terceiros, manutenção, total) + gráfico de pizza.
6. **Detalhamento por módulo** — 1 parágrafo + sub-tabela cada (11 módulos).
7. **Premissas e limitações** — câmbio USD/BRL, faixa de produtividade, escopo do que não está incluso (treinamento, suporte N1).
8. **Anexo** — dados brutos: top 10 edge functions por custo de IA, totais de LOC, lista de 75 edge functions.

Identidade visual Daton (Carbon Emerald `#00bf63`, fundo `#0B1210`, Plus Jakarta Sans).

## Detalhes técnicos

- Script Python em `/tmp/gen_cost_report.py` usando ReportLab (Platypus) para gerar o PDF com tabelas, gráficos (matplotlib) e branding.
- Coletar números via:
  - `wc -l` por subpasta de `src/components/` e `src/pages/` para LOC por módulo.
  - `supabase--read_query` em `ai_usage_logs` agrupado por `function_name` (precisa confirmar se a coluna existe; senão usar `metadata`).
  - Tabela hardcoded de mapeamento `edge_function → módulo` no script.
- Câmbio USD/BRL: usar valor fixo (ex.: R$5,00) declarado nas premissas — sem dependência de API externa.
- QA visual obrigatório: converter PDF para imagens com `pdftoppm` e revisar cada página antes de entregar.
- Versionar como `_v1`, `_v2` se o cliente pedir ajustes.

## Fora de escopo

- Não altera código da aplicação.
- Não inclui análise de receita/preço de venda ao cliente final (só custo).
- Não rastreia retroativamente custo de IA do build no Lovable — entra como estimativa declarada.
