

## Plano: Alterar Graficos do Dashboard LAIA para Mostrar Distribuicao por Setores

### Problema Identificado

Na pagina `/laia/unidade/{id}` (aba "Visao Geral"), os graficos atualmente mostram:
- **Distribuicao por Categoria** (Desprezivel/Moderado/Critico)
- **Distribuicao por Significancia** (Significativo/Nao Significativo)

O usuario deseja que esses graficos mostrem a **distribuicao por setores** ao inves dessas metricas.

---

### Analise da Situacao Atual

| Componente | Arquivo | Descricao |
|------------|---------|-----------|
| Dashboard LAIA | `src/components/laia/LAIADashboard.tsx` | Renderiza graficos de categoria/significancia (linhas 120-196) |
| Stats Service | `src/services/laiaService.ts` | Ja retorna `by_sector` com dados por setor (linhas 375-377) |

O dado `stats.by_sector` ja esta disponivel e contem:
```typescript
{ sector_name: string; count: number }[]
```

---

### Proposta de Alteracao

Substituir os dois graficos de pizza (Categoria e Significancia) por:

1. **Grafico de Barras Horizontal** - "Distribuicao por Setor" (visao principal)
2. **Grafico de Pizza** - "Proporcao por Setor" (visao alternativa)

Ambos usarao os dados de `stats.by_sector`.

---

### Alteracoes Tecnicas

#### Arquivo: `src/components/laia/LAIADashboard.tsx`

**Linhas 52-61**: Remover variaveis `categoryData` e `significanceData`, adicionar cores para setores:

```typescript
// Cores para setores (paleta diversificada)
const SECTOR_COLORS = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#eab308", // yellow
  "#ef4444", // red
  "#8b5cf6", // purple
  "#f97316", // orange
  "#14b8a6", // teal
  "#ec4899", // pink
  "#6366f1", // indigo
  "#84cc16", // lime
];

const sectorChartData = stats.by_sector.map((s, i) => ({
  name: s.sector_name,
  value: s.count,
  color: SECTOR_COLORS[i % SECTOR_COLORS.length],
}));
```

**Linhas 120-196**: Substituir os dois Cards de graficos:

```text
Antes:
- Card 1: "Distribuicao por Categoria" (PieChart com categoryData)
- Card 2: "Distribuicao por Significancia" (PieChart com significanceData)

Depois:
- Card 1: "Distribuicao por Setor" (BarChart horizontal com sectorChartData)
- Card 2: "Proporcao por Setor" (PieChart com sectorChartData)
```

**Linhas 199-216**: Remover o Card duplicado "Aspectos por Setor" que ficaria redundante.

---

### Resultado Visual Esperado

```text
+---------------------------------------------+
|  Cards: Total | Significativos | Criticos | Nao Sig  |
+---------------------------------------------+
|                                             |
|  +-------------------+  +-------------------+
|  | Distribuicao por  |  | Proporcao por     |
|  | Setor (Barras)    |  | Setor (Pizza)     |
|  |                   |  |                   |
|  | Operacional ████  |  |      [PIE]        |
|  | Frota      ███    |  |                   |
|  | Admin      ██     |  |                   |
|  +-------------------+  +-------------------+
|                                             |
+---------------------------------------------+
```

---

### Resumo das Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/laia/LAIADashboard.tsx` | Substituir graficos de categoria/significancia por graficos de setores |

**Total: 1 arquivo, ~80 linhas modificadas**

---

### Beneficios

- **Informacao mais util**: Mostra onde estao concentrados os aspectos ambientais por area da empresa
- **Dados ja disponiveis**: Nao requer alteracao no backend/service
- **Cards de resumo mantidos**: Total, Significativos, Criticos e Nao Significativos continuam visiveis nos cards superiores

