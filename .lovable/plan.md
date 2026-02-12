
## Plano: Header completo no Demo + Dados mockados em todas as paginas

### Problema 1: Header do Demo sem botoes

O `DemoLayout.tsx` usa um header simplificado com apenas o `SidebarTrigger` e logo, sem os botoes de perfil, notificacoes, tour e ajuda contextual que existem no `AppHeader` da versao de producao.

**Correcao:** Substituir o header manual do `DemoLayout` pelo componente `AppHeader` reutilizado. O `AppHeader` usa `useAuth()` que ja fornece `user` e `logout`, funcionando para usuarios autenticados nao aprovados.

**Arquivo:** `src/components/DemoLayout.tsx`
- Importar e usar `<AppHeader />` no lugar do header manual
- Remover o header inline customizado

---

### Problema 2: Dados zerados em muitas paginas

A raiz do problema e que o `DemoDataSeeder` apenas faz seed de chaves de query especificas, mas muitas paginas usam:
- QueryKeys com parametros dinamicos (ex: `['dashboard-stats', dateRange]`, `['employees-paginated', page, size, search...]`)
- QueryKeys que nao existem nos mocks (ex: `employees-stats`, `benefit-stats`, `nc-dashboard-stats`, `employees-paginated`, `managed-suppliers`, `esg-dashboard`, `emission-stats`, etc.)

A abordagem de "seeding" nao e suficiente porque nunca sera possivel cobrir todas as combinacoes de parametros. A solucao e **interceptar o QueryClient** para que, em modo demo, QUALQUER query que nao encontre dados no cache retorne dados vazios em vez de disparar uma requisicao ao Supabase.

### Estrategia de correcao (duas frentes):

#### Frente A: Interceptar queries nao semeadas

**Arquivo:** `src/components/DemoDataSeeder.tsx`

Alem de semear dados, configurar uma `defaultOptions.queries.queryFn` global que:
1. Primeiro verifica se o cache ja tem dados para a query (semeados)
2. Se nao tiver, retorna dados padrao vazios (`[]`, `{}`, `null`) sem chamar Supabase
3. Isso garante que NENHUMA query escape para o backend

```
queryClient.setDefaultOptions({
  queries: {
    queryFn: () => {
      // Retorna vazio para queries nao semeadas - impede chamadas ao Supabase
      return null;
    },
    ...
  }
});
```

#### Frente B: Adicionar mock entries faltantes

Expandir os arquivos de mock data para cobrir TODAS as queryKeys usadas pelas paginas do demo. As queryKeys faltantes incluem (lista nao exaustiva):

**`socialMocks.ts`** - Adicionar:
- `['employees-stats']` com totalEmployees, activeEmployees, departments, avgSalary
- `['employees-paginated', ...]` com paginacao simulada de funcionarios (cobrir qualquer combinacao de parametros usando seed fuzzy)
- `['benefit-stats']` com estatisticas de beneficios
- `['benefits']` com dados preenchidos (atualmente array vazio)
- `['attendance-records', ...]` com dados preenchidos

**`dashboardMocks.ts`** - Adicionar:
- `['esg-dashboard']` (usado pelo Index.tsx)
- `['emission-stats']` (usado pelo Index.tsx)
- `['license-stats']` (usado pelo Index.tsx)
- `['waste-dashboard']` (usado pelo Index.tsx)
- `['production-health']` ja existe, manter

**`qualityMocks.ts`** - Adicionar:
- `['nc-dashboard-stats']` com estatisticas de nao-conformidades
- `['processMaps']` para mapeamento de processos
- `['strategic-maps']` para planejamento estrategico

**`supplierMocks.ts`** - Adicionar:
- `['managed-suppliers']` (lista flat usada por dropdowns)
- `['delivery-stats']` com estatisticas de entregas
- `['supplier-types']` sem company_id (versao global)

**`environmentalMocks.ts`** - Adicionar:
- `['emissions-monitoring', year]` para cada ano
- `['inventory-summary', year]`

**`dataReportsMocks.ts`** - Adicionar:
- `['data-collection-tasks']` sem company_id (versao global)
- `['import-jobs']` com lista de jobs

**`financialMocks.ts`** - Adicionar:
- `['cost-centers']` sem company_id
- `['payable-wastes', ...]`
- `['payables-stats']`

**`settingsMocks.ts`** - Adicionar:
- Profiles e configuracoes adicionais

#### Frente C: Seed com match parcial de queryKey

Para resolver o problema de queryKeys com parametros dinamicos (como `['dashboard-stats', dateRange]` ou `['employees-paginated', 1, 10, '', 'all', 'all']`), implementar um mecanismo no DemoDataSeeder que:

1. Registra os prefixos das queryKeys semeadas
2. Quando uma query e executada com parametros adicionais, verifica se o prefixo da queryKey corresponde a algum mock
3. Se sim, retorna os dados do mock correspondente ao prefixo

Isso sera feito sobrescrevendo a `defaultOptions.queries.queryFn` para fazer lookup por prefixo no cache de mocks.

### Resumo de arquivos a modificar

| Arquivo | Mudanca |
|---|---|
| `src/components/DemoLayout.tsx` | Usar `AppHeader` no header |
| `src/components/DemoDataSeeder.tsx` | Adicionar queryFn global com fallback e match por prefixo |
| `src/data/demo/dashboardMocks.ts` | Adicionar ~5 queryKeys faltantes |
| `src/data/demo/socialMocks.ts` | Adicionar employees-stats, employees-paginated, benefit-stats, preencher arrays vazios |
| `src/data/demo/qualityMocks.ts` | Adicionar nc-dashboard-stats, processMaps, strategic-maps |
| `src/data/demo/supplierMocks.ts` | Adicionar managed-suppliers, delivery-stats |
| `src/data/demo/environmentalMocks.ts` | Adicionar emissions-monitoring, inventory-summary |
| `src/data/demo/dataReportsMocks.ts` | Adicionar data-collection-tasks global, import-jobs |
| `src/data/demo/financialMocks.ts` | Adicionar cost-centers global, payables-stats |
| `src/data/demo/governanceMocks.ts` | Verificar e completar queryKeys faltantes |
| `src/data/demo/organizationMocks.ts` | Verificar e completar queryKeys faltantes |
| `src/data/demo/settingsMocks.ts` | Adicionar profiles adicionais |

### Abordagem tecnica do match por prefixo

```typescript
// No DemoDataSeeder, criar um mapa de prefixo -> dados
const mockMap = new Map<string, unknown>();
mockEntries.forEach(({ queryKey, data }) => {
  const key = JSON.stringify(queryKey);
  mockMap.set(key, data);
});

// QueryFn global que faz lookup por prefixo
queryClient.setDefaultOptions({
  queries: {
    queryFn: ({ queryKey }) => {
      // Tentar match exato primeiro
      const exactKey = JSON.stringify(queryKey);
      if (mockMap.has(exactKey)) return mockMap.get(exactKey);
      
      // Tentar match por prefixo (primeiro elemento)
      for (const [key, data] of mockMap.entries()) {
        const parsed = JSON.parse(key);
        if (parsed[0] === queryKey[0]) return data;
      }
      
      // Fallback: retornar null para impedir chamada ao Supabase
      return null;
    },
    retry: false,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  },
});
```

Isso garante que:
- `['dashboard-stats', {from: Date, to: Date}]` encontra os dados de `['dashboard-stats']`
- `['employees-paginated', 1, 10, '', 'all', 'all']` encontra dados de `['employees-paginated']`
- Qualquer query nao mapeada retorna `null` em vez de chamar o Supabase
