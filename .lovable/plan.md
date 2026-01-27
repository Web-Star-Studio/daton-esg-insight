
# Plano: Corrigir Graficos LAIA para Agrupar por Atividade/Operacao

## Contexto do Problema

Ao importar planilhas LAIA (como `asp.imp_CHUI.xlsx`), o sistema atualmente:

1. Cria setores genericos como "Setor 1", "Setor 2" baseado nos codigos numericos da coluna `COD SET`
2. O campo **Atividade/Operacao** (coluna 3) contem os valores descritivos reais: "PATIO EXTERNO", "OFICINA", "FROTA - TRANSPORTE", "COPA", etc.
3. Os graficos do dashboard mostram distribuicao por "Setor 1", "Setor 2" - o que nao e informativo

**Solicitacao:** Os graficos devem mostrar distribuicao por **Atividade/Operacao** ao inves de por Setor generico.

---

## Solucao Proposta

Alterar o servico e dashboard LAIA para agrupar estatisticas por `activity_operation` ao inves de por `sector.name`.

---

## Alteracoes Tecnicas

### Arquivo 1: `src/services/laiaService.ts`

**Funcao `getLAIADashboardStats` (linhas 320-380)**

Modificar para agrupar por `activity_operation`:

```typescript
// Antes (linhas 359-377):
const sectorCounts: Record<string, number> = {};
assessments?.forEach((a) => {
  // ...
  const sectorName = (a.sector as { name: string } | null)?.name ?? "Sem Setor";
  sectorCounts[sectorName] = (sectorCounts[sectorName] ?? 0) + 1;
});
stats.by_sector = Object.entries(sectorCounts)
  .map(([sector_name, count]) => ({ sector_name, count }))
  .sort((a, b) => b.count - a.count);

// Depois:
const activityCounts: Record<string, number> = {};
assessments?.forEach((a) => {
  // ...
  const activityName = a.activity_operation || "Nao especificada";
  activityCounts[activityName] = (activityCounts[activityName] ?? 0) + 1;
});
stats.by_sector = Object.entries(activityCounts)
  .map(([sector_name, count]) => ({ sector_name, count }))
  .sort((a, b) => b.count - a.count);
```

**Nota:** Mantemos o nome do campo `by_sector` para compatibilidade, mas agora representa "por atividade".

**Query da funcao** - adicionar `activity_operation` ao select:

```typescript
// Linha 334-341
let query = supabase
  .from("laia_assessments")
  .select(`
    id,
    category,
    significance,
    activity_operation,
    sector:laia_sectors(name)
  `)
```

---

### Arquivo 2: `src/components/laia/LAIADashboard.tsx`

**Atualizar titulos dos graficos (linhas 124-165)**

Alterar os labels para refletir que a distribuicao e por atividade/operacao:

```typescript
// Linha 128-129
<CardTitle className="flex items-center gap-2">
  <BarChart3 className="h-5 w-5" />
  Distribuicao por Atividade/Operacao
</CardTitle>

// Linha 162-164
<CardTitle className="flex items-center gap-2">
  <TrendingUp className="h-5 w-5" />
  Proporcao por Atividade
</CardTitle>
```

---

### Arquivo 3: `src/types/laia.ts`

**Opcional:** Renomear o campo no tipo `LAIADashboardStats` para maior clareza semantica:

```typescript
// Linha ~35
export interface LAIADashboardStats {
  total: number;
  significativos: number;
  nao_significativos: number;
  criticos: number;
  moderados: number;
  despreziveis: number;
  by_sector: { sector_name: string; count: number }[];  // Manter por compatibilidade
  // Alternativa: by_activity: { activity_name: string; count: number }[];
}
```

---

## Resumo das Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `src/services/laiaService.ts` | Agrupar por `activity_operation` ao inves de `sector.name` |
| `src/components/laia/LAIADashboard.tsx` | Atualizar titulos dos graficos |
| `src/types/laia.ts` | Opcional: atualizar tipo para clareza |

**Total: 2-3 arquivos, ~15 linhas modificadas**

---

## Resultado Esperado

Antes:
- Grafico mostra: "Setor 1: 5", "Setor 2: 3", "Setor 3: 8"

Depois:
- Grafico mostra: "PATIO EXTERNO: 5", "OFICINA: 3", "FROTA - TRANSPORTE: 8"

---

## Beneficios

- **Informacao util:** Usuario ve exatamente quais atividades tem mais aspectos ambientais
- **Alinhamento com planilha:** Os valores correspondem diretamente ao que foi importado na coluna "ATIVIDADE/OPERACAO"
- **Decisoes melhores:** Permite identificar areas operacionais que requerem mais atencao ambiental
