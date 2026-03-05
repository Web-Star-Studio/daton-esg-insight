# Skill: demo-add-mock
# Trigger: /demo-add-mock
# Descrição: Adicionar ou atualizar dados mock para uma feature/página no modo demo

O usuário quer adicionar dados mock para o modo demo. Siga rigorosamente os passos abaixo.

## REGRA FUNDAMENTAL
No modo demo (`/demo/*`) NUNCA ocorrem chamadas reais ao Supabase. Todo dado vem de:
1. `queryClient.setQueryData()` injetado pelo `DemoDataSeeder`
2. Fallback automático via `src/data/demo/queryResolver.ts`

## Passos obrigatórios

### 1. Identificar o módulo e query keys

Leia o componente/página alvo para descobrir:
- Quais `useQuery({ queryKey: [...] })` são usados
- Quais dados são esperados (shape dos objetos)

```bash
# Encontrar os useQuery do componente
grep -n "useQuery\|queryKey" src/pages/[NomePagina].tsx
```

### 2. Escolher o arquivo de mock correto

```
src/data/demo/
├── dashboardMocks.ts       → Stats gerais, KPIs do painel
├── environmentalMocks.ts   → Ambiental, GEE, resíduos, licenciamento
├── socialMocks.ts          → Funcionários, treinamentos, segurança
├── governanceMocks.ts      → Auditoria, compliance, riscos, materialidade
├── qualityMocks.ts         → SGQ, não conformidades, indicadores
├── supplierMocks.ts        → Fornecedores, avaliações
├── indicatorMocks.ts       → KPIs transversais
├── reportsMocks.ts         → Relatórios gerados
├── dataReportsMocks.ts     → Dados de relatórios
├── dataCollectionMocks.ts  → Coleta de dados, formulários
├── organizationMocks.ts    → Empresa, setores, unidades
├── settingsMocks.ts        → Configurações, usuários, papéis
└── financialMocks.ts       → Financeiro (módulo desabilitado)
```

Se nenhum arquivo se encaixa, adicione ao mais próximo ou crie um novo e registre em `src/data/demo/index.ts`.

### 3. Criar o mock data

```typescript
// Exemplo de padrão para adicionar no arquivo correto
export const [nomeMock]MockData = {
  // Para lista de itens:
  items: [
    {
      id: "demo-1",
      // ... campos completos com dados realistas em português
      created_at: new Date().toISOString(),
    },
    // Sempre 3-5 itens para parecer real
  ],

  // Para stats/métricas:
  stats: {
    total: 42,
    active: 38,
    trend: +12,
    // ...
  },

  // Para série temporal (gráficos):
  trend: [
    { month: "Jan", value: 100 },
    { month: "Fev", value: 115 },
    // ... 12 meses
  ],
};
```

**Regras de dados mock:**
- IDs sempre prefixados com `"demo-"` (ex: `"demo-uuid-1"`)
- Datas usando `new Date(Date.now() - N * 86400000).toISOString()` para variedade
- Valores numéricos realistas para ESG (não use 1, 2, 3 — use 87, 142, 2.340)
- Textos em português brasileiro
- Status: use os enums reais do projeto (ex: `'compliant'`, `'pending'`, `'non_compliant'`)

### 4. Registrar no DemoDataSeeder

Abra `src/components/DemoDataSeeder.tsx` e adicione o `setQueryData` na fase de sincronização:

```typescript
// Na função de seed síncrono, dentro do array de chamadas:
queryClient.setQueryData(['nome-da-query-key'], dadosMock);
queryClient.setQueryData(['nome-da-query-key', { filtro: 'valor' }], dadosMock);
```

### 5. Registrar no queryResolver (fallback)

Abra `src/data/demo/queryResolver.ts` e adicione mapeamento de query key:

```typescript
// No mapa de correspondências:
'nome-da-query-key': [nomeMock]MockData.items,
'outra-query-key': [nomeMock]MockData.stats,
```

Se a query key contém palavras-chave já mapeadas (trend, stats, list), o fallback automático funciona sem alteração.

### 6. Registrar no index de mocks

```typescript
// src/data/demo/index.ts — adicionar export:
export { [nomeMock]MockData } from './[arquivo]Mocks';
```

### 7. Verificar no navegador

```bash
bun run dev
# Acesse /demo/[rota-da-feature]
# Confirme que os dados aparecem
# Confirme que não há erros de console sobre queries não resolvidas
```

## Anti-padrões (NUNCA faça)

```typescript
// ❌ NUNCA chame Supabase diretamente em componentes de demo
const { data } = useQuery({
  queryFn: () => supabase.from('tabela').select('*'), // PROIBIDO no demo
});

// ❌ NUNCA use useEffect com writes no contexto demo
useEffect(() => {
  supabase.from('tabela').insert(dados); // PROIBIDO
}, []);

// ✅ CORRETO: deixa o DemoDataSeeder injetar via queryClient.setQueryData
// O componente usa useQuery normalmente, o DemoDataSeeder intercepta
const { data } = useQuery({ queryKey: ['minha-key'], queryFn: fetchFn });
```

## Checklist final

- [ ] Mock data criado com dados realistas em PT-BR
- [ ] IDs prefixados com `"demo-"`
- [ ] `setQueryData` adicionado no DemoDataSeeder
- [ ] Fallback no queryResolver atualizado
- [ ] Export registrado no index
- [ ] Testado em `/demo/[rota]` sem erros no console
- [ ] Nenhuma chamada real ao Supabase ocorre (verifique Network tab)
