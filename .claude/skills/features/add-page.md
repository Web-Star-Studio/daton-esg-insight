# Skill: add-page
# Trigger: /add-page
# Descrição: Scaffold completo de uma nova página — componente, rota protegida, rota demo, mock data e item no sidebar

O usuário quer adicionar uma nova página ao sistema. Execute todos os passos abaixo em ordem.

## Perguntas iniciais (se não informadas)

Antes de iniciar, confirme com o usuário:
1. **Nome da página** (ex: "Gestão de Carbono")
2. **Módulo** (ESG Ambiental / Social / Governança / Qualidade / Fornecedores / Outro)
3. **Rota protegida** (ex: `/carbono`) — para usuários aprovados
4. **Rota demo** (ex: `/demo/carbono`) — para usuários em avaliação
5. **Item no sidebar?** (Sim/Não — e em qual seção)
6. **Componentes principais** (tabela, gráfico, cards de métricas, formulário?)

## Passo 1 — Criar o componente da página

**Local:** `src/pages/[NomePagina].tsx`

```typescript
import { useDemo } from '@/contexts/DemoContext';
import { triggerDemoBlocked } from '@/utils/demoGuard';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function NomePagina() {
  const { isDemo } = useDemo();

  // Fetch de dados — funciona em ambos os modos (demo injeta via DemoDataSeeder)
  const { data, isLoading } = useQuery({
    queryKey: ['nome-da-entidade'],
    queryFn: () => fetchDados(), // DemoDataSeeder intercepta no modo demo
  });

  // Mutation protegida
  const salvar = useMutation({
    mutationFn: async (payload) => {
      if (isDemo) { triggerDemoBlocked(); return; }
      return await apiCall(payload);
    },
  });

  if (isLoading) return <div className="p-6">Carregando...</div>;

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      {/* Header da página */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">Nome da Página</h1>
          <p className="text-sm text-muted-foreground">Descrição breve</p>
        </div>
        <Button onClick={() => salvar.mutate({})}>
          Ação Principal
        </Button>
      </div>

      {/* Conteúdo */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Cards, tabelas, gráficos */}
      </div>
    </div>
  );
}
```

**Padrões obrigatórios no componente:**
- `useDemo()` importado e verificado em toda ação de escrita
- Layout responsivo usando `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Padding responsivo: `p-4 sm:p-6`
- Títulos responsivos: `text-xl sm:text-2xl`
- Loading state tratado

## Passo 2 — Registrar lazy import em App.tsx

Abra `src/App.tsx`. Localize o bloco de lazy imports (geralmente após linha 50):

```typescript
// Adicionar junto aos outros lazy imports do mesmo módulo:
const NomePagina = lazy(() => import('./pages/NomePagina'));
```

## Passo 3 — Adicionar rota protegida

Em `src/App.tsx`, dentro da seção de rotas protegidas (buscar por `<Route path="/dashboard"`):

```typescript
<Route
  path="/nome-rota"
  element={
    <ProtectedLazyPageWrapper>
      <NomePagina />
    </ProtectedLazyPageWrapper>
  }
/>
```

## Passo 4 — Adicionar rota demo

Em `src/App.tsx`, dentro do bloco `<Route path="/demo" ...>`:

```typescript
<Route
  path="nome-rota"
  element={
    <LazyPageWrapper>
      <NomePagina />
    </LazyPageWrapper>
  }
/>
```

**Importante:** A mesma página serve tanto a rota protegida quanto a demo — o comportamento muda via `useDemo()`.

## Passo 5 — Adicionar item no sidebar

Abra `src/components/AppSidebar.tsx`. Localize a seção correta (ex: Ambiental, Social, Governança):

```typescript
{
  title: 'Nome da Página',
  url: isDemo ? '/demo/nome-rota' : '/nome-rota',
  icon: IconName, // Importar de 'lucide-react'
},
```

**Atenção:** Links no sidebar usam `isDemo` para alternar entre `/demo/*` e a rota real.

## Passo 6 — Configurar módulo (se novo módulo)

Se a página pertence a um módulo novo, registrar em `src/config/enabledModules.ts`:

```typescript
nomeModulo: true, // ou false para desabilitado
```

E em `src/config/routeModuleMap.ts`:

```typescript
'/nome-rota': 'nomeModulo',
'/demo/nome-rota': 'nomeModulo',
```

## Passo 7 — Criar mock data para demo

Seguir a skill `/demo-add-mock` para criar dados mock realistas.

Resumo rápido:
1. Adicionar mock em `src/data/demo/[modulo]Mocks.ts`
2. Registrar `setQueryData` no `DemoDataSeeder.tsx`
3. Adicionar ao `queryResolver.ts` se necessário
4. Exportar no `src/data/demo/index.ts`

## Passo 8 — Verificar type-check

```bash
bun run type-check
```

Corrigir todos os erros antes de prosseguir.

## Passo 9 — Testar ambos os contextos

```bash
bun run dev
```

1. Acesse `/nome-rota` como usuário aprovado — confirme que funciona
2. Acesse `/demo/nome-rota` como usuário demo — confirme que:
   - Dados mock aparecem
   - Ações de escrita disparam o `DemoBlockedModal`
   - Não há erros no console

## Checklist final

- [ ] `src/pages/NomePagina.tsx` criado com padrões responsivos
- [ ] `useDemo()` integrado em todas as ações de escrita
- [ ] Lazy import adicionado em `App.tsx`
- [ ] Rota protegida registrada em `App.tsx`
- [ ] Rota demo registrada em `App.tsx`
- [ ] Item adicionado no sidebar com URL condicional (`isDemo`)
- [ ] Mock data criado e injetado no DemoDataSeeder
- [ ] Type-check passando sem erros
- [ ] Testado em rota protegida e rota demo
