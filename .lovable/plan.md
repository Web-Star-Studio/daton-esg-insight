
## Dados mockados completos para todos os modulos da versao demo

### Escopo do problema

A versao demo atualmente reutiliza os mesmos componentes de pagina da versao live, mas como o usuario demo nao tem dados no Supabase, todas as paginas aparecem vazias. Sao **40+ paginas** com **348 arquivos** usando `useQuery` para buscar dados, cada um com estruturas diferentes.

### Estrategia: Cache Seeding no React Query

Em vez de modificar cada uma das 40+ paginas individualmente, a abordagem mais eficiente e criar um componente `DemoDataSeeder` que pre-popula o cache do React Query com dados mockados quando o usuario esta em modo demo. Assim, quando qualquer pagina faz um `useQuery`, os dados ja estao no cache e o Supabase nao e chamado.

### Arquitetura

```text
App.tsx
  -> QueryClientProvider (queryClient global)
    -> DemoRoute
      -> DemoProvider (isDemo = true)
        -> DemoDataSeeder (seed do cache + queryFn override)
          -> DemoLayout
            -> Paginas (useQuery encontra dados no cache)
```

O `DemoDataSeeder` vai:
1. Acessar o `queryClient` do React Query
2. Definir dados mockados para todas as query keys conhecidas
3. Configurar o `defaultOptions` para nao refetch (evitar que queries tentem buscar do Supabase e sobrescrevam o mock)

### Organizacao dos dados mock

Os dados serao organizados em arquivos separados por modulo dentro de `src/data/demo/`:

| Arquivo | Modulos cobertos |
|---|---|
| `dashboardMocks.ts` | Dashboard principal, KPIs, alertas, atividades recentes |
| `esgMocks.ts` | Gestao ESG, scores, metas, monitoramento ambiental |
| `environmentalMocks.ts` | Emissoes GEE, agua, energia, residuos, carbono |
| `socialMocks.ts` | Dashboard social, colaboradores, treinamentos, SST, carreira |
| `governanceMocks.ts` | Governanca, riscos, compliance, auditorias, stakeholders |
| `qualityMocks.ts` | Dashboard SGQ, indicadores, NCs, acoes corretivas, processos, LAIA |
| `supplierMocks.ts` | Fornecedores, avaliacoes, conexoes, entregas, falhas |
| `financialMocks.ts` | Dashboard financeiro, plano de contas, fluxo de caixa, orcamento |
| `settingsMocks.ts` | Configuracoes, filiais, usuarios, formularios |
| `dataReportsMocks.ts` | Coleta de dados, documentos, relatorios integrados, ODS |
| `organizationMocks.ts` | Estrutura organizacional, departamentos, cargos |

### Dados mockados por modulo (resumo)

Cada modulo tera dados realistas que simulam uma empresa de medio porte do setor industrial:

**Dashboard**: 7 KPIs (emissoes, conformidade, colaboradores, qualidade, fornecedores, energia, reducao CO2), 4 atividades recentes, 3 alertas, score ESG 72.5

**ESG Ambiental**: 15 registros de emissoes GEE (escopos 1-3), 12 meses de monitoramento de agua/energia/emissoes, 8 registros de residuos, 3 projetos de carbono, 5 metas de sustentabilidade

**Social**: 342 colaboradores (stats), 15 treinamentos, 5 incidentes SST, 4 projetos sociais, 12 PDIs de carreira

**Governanca**: 8 riscos corporativos, 12 itens de compliance, 3 auditorias, 6 stakeholders, matriz de materialidade

**Qualidade**: 10 indicadores, 8 nao conformidades, 5 acoes corretivas, 4 mapas de processo, 3 planos estrategicos, 15 documentos controlados

**Fornecedores**: 47 fornecedores cadastrados, 6 tipos, 4 categorias, 12 avaliacoes, 8 conexoes, 5 entregas, 2 falhas, 15 documentos obrigatorios

**Financeiro**: Dashboard com receita/despesa, 20 lancamentos contabeis, 10 contas a pagar, 8 contas a receber, 5 centros de custo, fluxo de caixa 6 meses

**Dados e Relatorios**: 5 tarefas de coleta, 10 documentos, 3 relatorios integrados, dashboard ODS

### Rotas adicionais na demo

Varias rotas existentes na versao live estao faltando na demo. Serao adicionadas todas as rotas correspondentes aos modulos da sidebar:

- Financeiro: `/demo/financeiro/dashboard`, `/demo/financeiro/plano-contas`, etc (14 rotas)
- Ambiental: `/demo/monitoramento-esg`, `/demo/monitoramento-agua`, `/demo/inventario-gee`, etc (10 rotas)
- Governanca: `/demo/governanca-esg`, `/demo/gestao-riscos`, `/demo/compliance`, `/demo/auditoria`, etc (6 rotas)
- Dados e Relatorios: `/demo/coleta-dados`, `/demo/documentos`, `/demo/relatorios-integrados`, etc (6 rotas)
- Configuracoes: `/demo/gestao-filiais`, `/demo/biblioteca-fatores`, etc (5 rotas)
- Outras: `/demo/metas`, `/demo/residuos`, `/demo/projetos-carbono` (5+ rotas)

### Arquivos a criar/modificar

**Novos arquivos:**
- `src/data/demo/index.ts` -- re-exporta todos os mocks e funcao `seedDemoData`
- `src/data/demo/dashboardMocks.ts`
- `src/data/demo/esgMocks.ts`
- `src/data/demo/environmentalMocks.ts`
- `src/data/demo/socialMocks.ts`
- `src/data/demo/governanceMocks.ts`
- `src/data/demo/qualityMocks.ts`
- `src/data/demo/supplierMocks.ts`
- `src/data/demo/financialMocks.ts`
- `src/data/demo/settingsMocks.ts`
- `src/data/demo/dataReportsMocks.ts`
- `src/data/demo/organizationMocks.ts`
- `src/components/DemoDataSeeder.tsx` -- componente que faz o seed do cache

**Arquivos modificados:**
- `src/App.tsx` -- adicionar todas as rotas faltantes na secao demo + integrar DemoDataSeeder
- `src/components/DemoLayout.tsx` -- envolver com DemoDataSeeder

### Implementacao tecnica do DemoDataSeeder

```text
function DemoDataSeeder({ children }) {
  const queryClient = useQueryClient();
  const { isDemo } = useDemo();

  useEffect(() => {
    if (!isDemo) return;
    
    // Seed all known query keys with mock data
    const mockEntries = getAllDemoMockData();
    mockEntries.forEach(({ queryKey, data }) => {
      queryClient.setQueryData(queryKey, data);
    });

    // Override default options to prevent refetching
    queryClient.setDefaultOptions({
      queries: {
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchInterval: false,
        staleTime: Infinity,
        retry: false,
      }
    });
  }, [isDemo, queryClient]);

  return children;
}
```

### Nota sobre escala

Este e um trabalho muito extenso (40+ paginas, ~100 query keys). A implementacao sera feita em fases priorizando os modulos mais visíveis:

**Fase 1 (esta implementacao):** Dashboard, ESG (Ambiental/Social/Governanca), Qualidade, Fornecedores, Financeiro, Organizacional -- cobrindo todas as secoes da sidebar com dados realistas

**Fase 2 (se necessario):** Sub-paginas internas com dados mais detalhados (ex: detalhes de NC individual, formularios de edicao)
