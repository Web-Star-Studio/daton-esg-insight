

## Replicar a experiencia real na versao demo (com dados mock e CRUD desativado)

### Objetivo

Transformar a rota `/demo` para que utilize exatamente o mesmo layout, sidebar e paginas da versao para clientes reais, porem com:
- Dados mockados em vez de queries ao Supabase
- Botoes de CRUD (criar, editar, excluir) desativados, exibindo toast informativo
- Banner contextual de demo/pendencia no topo

### Arquitetura proposta

A implementacao sera dividida em camadas:

1. **DemoContext** - contexto global que sinaliza modo demo
2. **DemoLayout** - wrapper que reutiliza `AppSidebar` + `AppHeader` sem exigir autenticacao
3. **Rotas demo** - `/demo/*` mapeando para as mesmas paginas reais
4. **Hook `useDemo`** - utilitario para paginas verificarem modo demo
5. **Interceptor de CRUD** - funcao utilitaria que substitui acoes de mutacao por toast

### Mudancas detalhadas

#### 1. Criar `src/contexts/DemoContext.tsx`

Contexto simples com `isDemo: boolean`:

```typescript
const DemoContext = createContext({ isDemo: false });
export const useDemo = () => useContext(DemoContext);
export const DemoProvider = ({ children }) => (
  <DemoContext.Provider value={{ isDemo: true }}>{children}</DemoContext.Provider>
);
```

#### 2. Criar `src/components/DemoLayout.tsx`

Layout que reutiliza os mesmos componentes do `MainLayout`, mas:
- Nao exige autenticacao
- Mostra banner de demo/pendencia no topo
- A sidebar usa as mesmas secoes, respeitando `enabledModules.ts`
- Links da sidebar apontam para `/demo/...` em vez de `/...`
- Cliques em acoes exibem toast de demo

Vai utilizar `SidebarProvider`, `AppSidebar` (via prop ou contexto de demo que a sidebar consulta para prefixar rotas) e a mesma estrutura visual.

#### 3. Modificar `src/components/AppSidebar.tsx`

Adicionar suporte ao modo demo:
- Importar `useDemo` do contexto
- Quando `isDemo === true`, prefixar todos os `path` com `/demo`
- O restante do comportamento (filtros de modulos, colapso, busca) permanece identico

#### 4. Modificar `src/components/MainLayout.tsx`

Quando em modo demo (via `DemoProvider`), pular verificacoes de auth e onboarding.

Alternativa mais limpa: criar `DemoLayout` como componente separado que replica a estrutura do `MainLayout` sem as dependencias de auth.

#### 5. Criar rotas demo em `src/App.tsx`

Substituir a rota unica `/demo` por um grupo de rotas:

```typescript
<Route path="/demo" element={<DemoProvider><DemoLayout /></DemoProvider>}>
  <Route index element={<Dashboard />} />
  <Route path="gestao-esg" element={<GestaoESG />} />
  <Route path="quality-dashboard" element={<QualityDashboard />} />
  <Route path="fornecedores/*" element={<SupplierRoutes />} />
  {/* ... demais rotas ativas */}
</Route>
```

#### 6. Criar `src/hooks/useDemoData.ts`

Hook utilitario que retorna mock data quando em demo mode, ou delega para o hook real:

```typescript
export function useDemoQuery<T>(realHook: () => QueryResult<T>, mockData: T) {
  const { isDemo } = useDemo();
  const realResult = realHook(); // chamado sempre mas ignorado em demo
  
  if (isDemo) {
    return { data: mockData, isLoading: false, error: null };
  }
  return realResult;
}
```

#### 7. Criar `src/utils/demoGuard.ts`

Funcao utilitaria para interceptar CRUD:

```typescript
export function demoAction(isDemo: boolean, realAction: () => void) {
  if (isDemo) {
    toast.info('Funcionalidade disponivel na versao completa', {
      description: 'Crie sua conta para acessar todos os recursos.',
      action: { label: 'Criar conta', onClick: () => window.location.href = '/auth' }
    });
    return;
  }
  realAction();
}
```

#### 8. Adaptar paginas prioritarias (fase 1)

Paginas que serao adaptadas primeiro para funcionar em modo demo:

| Pagina | Arquivo | Mock data necessario |
|--------|---------|---------------------|
| Dashboard | `src/pages/Dashboard.tsx` | KPIs, atividades, scores ESG |
| Dashboard SGQ | Pagina de qualidade | Indicadores, NCs |
| Dashboard Fornecedores | Pagina de fornecedores | Lista, avaliacoes |
| Gestao ESG | Painel ESG | Metricas consolidadas |

Cada pagina:
1. Importa `useDemo()` 
2. Se `isDemo`, usa mock data e wrapa botoes de CRUD com `demoAction()`
3. Caso contrario, comportamento normal

### Arquivos criados

| Arquivo | Descricao |
|---------|-----------|
| `src/contexts/DemoContext.tsx` | Contexto de modo demo |
| `src/components/DemoLayout.tsx` | Layout demo reutilizando sidebar real |
| `src/hooks/useDemoData.ts` | Hook para mock data condicional |
| `src/utils/demoGuard.ts` | Interceptor de CRUD para demo |

### Arquivos modificados

| Arquivo | Mudanca |
|---------|---------|
| `src/components/AppSidebar.tsx` | Prefixar rotas com `/demo` quando em modo demo |
| `src/App.tsx` | Substituir rota unica `/demo` por grupo de rotas |
| `src/pages/Dashboard.tsx` | Suporte a mock data via `useDemo()` |
| `src/pages/DemoDashboard.tsx` | Sera removido (substituido pelo Dashboard real em modo demo) |

### Fluxo do usuario

```text
Visitante acessa /demo
    |
    v
DemoProvider (isDemo=true) + DemoLayout
    |
    v
Mesmo AppSidebar (links prefixados /demo/...)
    |
    v
Mesmas paginas renderizadas com mock data
    |
    v
Clique em botao CRUD → toast "Crie sua conta"
    |
    v
Clique em "Criar conta" → /auth
```

### Consideracoes

- A sidebar em modo demo respeita `enabledModules.ts` (mesmos modulos filtrados)
- O banner de demo/pendencia continua visivel no topo
- Paginas serao adaptadas incrementalmente; paginas nao adaptadas mostram estado vazio com mensagem
- O `DemoDashboard.tsx` atual sera removido apos migrar toda a logica para o `Dashboard.tsx` com suporte demo

