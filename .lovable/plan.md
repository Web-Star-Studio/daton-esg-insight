

# Adicionar Infograficos de Caracterizacao na Visao Geral da LAIA

## Objetivo
Adicionar graficos na tab "Visao Geral" da pagina de unidade, mostrando a distribuicao das avaliacoes por cada tipo de caracterizacao: Temporalidade, Situacao Operacional, Incidencia e Classe de Impacto.

## O que muda

### 1. Atualizar `src/services/laiaService.ts`
Expandir a funcao `getLAIADashboardStats` para retornar tambem os dados agregados por temporalidade, situacao operacional, incidencia e classe de impacto. Os campos `temporality`, `operational_situation`, `incidence` e `impact_class` serao incluidos na query e contabilizados no client-side.

### 2. Atualizar `src/types/laia.ts`
Adicionar os novos campos na interface `LAIADashboardStats`:

```
by_temporality: { name: string; value: number }[]
by_operational_situation: { name: string; value: number }[]
by_incidence: { name: string; value: number }[]
by_impact_class: { name: string; value: number }[]
```

### 3. Atualizar `src/components/laia/LAIADashboard.tsx`
Abaixo dos cards de metricas existentes, adicionar uma grade 2x2 com graficos de pizza (reutilizando o padrao de `recharts` ja usado no projeto via `PieChart`). Cada grafico mostra a distribuicao das avaliacoes:

- **Temporalidade**: Passada / Atual / Futura
- **Situacao Operacional**: Normal / Anormal / Emergencia
- **Incidencia**: Direto / Indireto
- **Classe de Impacto**: Benefico / Adverso

```text
+----------------------------+----------------------------+
| Cards de metricas (existentes)                          |
+----------------------------+----------------------------+
|                                                         |
| Graficos de Caracterizacao                              |
+----------------------------+----------------------------+
|  [Pie] Temporalidade       |  [Pie] Sit. Operacional   |
+----------------------------+----------------------------+
|  [Pie] Incidencia          |  [Pie] Classe de Impacto  |
+----------------------------+----------------------------+
```

O layout dos graficos usara `grid gap-4 md:grid-cols-2` para responsividade, com graficos de pizza (donut) usando `recharts` com `PieChart`, `Pie`, `Cell`, `Legend` e `Tooltip`, seguindo as cores do tema (`hsl(var(--chart-1))` etc.) e o mesmo padrao visual dos graficos existentes em `FieldPieChart.tsx`.

## Secao Tecnica

### Dados no service (`getLAIADashboardStats`)
Incluir `temporality`, `operational_situation`, `incidence` e `impact_class` na query SELECT e agregar os valores em dicionarios, convertendo para arrays `{ name, value }` com os labels traduzidos (ex: `passada` -> `Passada`).

### Componente de graficos
Os graficos serao inline no `LAIADashboard.tsx` usando `recharts` diretamente (PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend), encapsulados em Cards do shadcn. Nao sera necessario criar componentes separados pois sao especificos do dashboard LAIA.

### Cores
Cada grafico tera cores fixas para manter consistencia visual:
- Temporalidade: 3 cores (chart-1, chart-2, chart-3)
- Situacao Operacional: 3 cores (chart-1, chart-2, chart-4)
- Incidencia: 2 cores (chart-1, chart-2)
- Classe de Impacto: 2 cores (verde para benefico, vermelho para adverso)

