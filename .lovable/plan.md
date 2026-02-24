

# Exibir Atividades das Avaliacoes na Tabela de Setores

## Problema

A coluna "Atividade" na tabela de setores mostra o campo `sector.name` (nome do setor), mas o usuario quer ver as atividades reais -- ou seja, os valores de `activity_operation` das avaliacoes LAIA vinculadas a cada setor.

## Solucao

Buscar as avaliacoes por setor e exibir as atividades (`activity_operation`) unicas na coluna "Atividade" da tabela.

## Alteracoes

### 1. Modificar `src/components/laia/LAIASectorManager.tsx`

- Importar e usar o hook `useLAIAAssessments` para buscar avaliacoes da unidade
- Agrupar as `activity_operation` unicas por `sector_id`
- Na coluna "Atividade", exibir a lista de atividades unicas do setor (separadas por virgula ou como badges)
- Se o setor nao tiver avaliacoes, exibir "-"

### 2. Nenhuma mudanca no backend

Os dados ja existem na tabela `laia_assessments`. Basta busca-los no frontend e cruzar com os setores.

## Secao Tecnica

### Logica de agrupamento

```text
// Buscar todas as avaliacoes da branch
const { data: assessments } = useLAIAAssessments({ branchId });

// Agrupar atividades unicas por sector_id
const activitiesBySector = useMemo(() => {
  const map = new Map<string, string[]>();
  assessments?.forEach(a => {
    if (a.sector_id) {
      const existing = map.get(a.sector_id) || [];
      if (!existing.includes(a.activity_operation)) {
        existing.push(a.activity_operation);
      }
      map.set(a.sector_id, existing);
    }
  });
  return map;
}, [assessments]);
```

### Exibicao na tabela

```text
<TableCell>
  {activitiesBySector.get(sector.id)?.length > 0 
    ? activitiesBySector.get(sector.id).join(", ")
    : "-"
  }
</TableCell>
```

Se houver muitas atividades, exibir as primeiras 3 com indicador "+N mais" para nao poluir a tabela.

### Arquivo modificado
- `src/components/laia/LAIASectorManager.tsx`

