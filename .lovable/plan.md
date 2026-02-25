

# Corrigir filtragem de módulos na sidebar + bloqueio de rotas

## Problema identificado

Após analisar o código e os dados, identifiquei que existem **3 falhas** no sistema de controle de acesso por módulos:

### Falha 1: Mapeamento incompleto na sidebar

O `sectionToModuleKey` em `useModuleSettings.ts` (linha 89-96) **não mapeia a seção ESG**. A seção `'esg'` não tem entrada no mapa, então `isSectionVisible('esg')` sempre retorna `true`. Resultado: a seção ESG inteira nunca é ocultada, mesmo que todos os sub-módulos ESG estejam bloqueados.

Além disso, quando o usuário `5ea9a692` tem `esgEnvironmental`, `esgGovernance`, `esgManagement` bloqueados mas `esgSocial` permitido, a seção ESG deveria aparecer apenas com Social. O filtro `isEsgCategoryVisible` filtra apenas os items de nível 1 dentro do ESG, mas o item `esg-management` (Painel de Gestão ESG) não está na lista de categorias ESG mapeadas corretamente — na verdade está, mas vamos verificar se o `id` bate.

Verificando: no `menuSections`, o item tem `id: "esg-management"` e no `esgCategoryToModuleKey` o mapeamento é `'esg-management': 'esgManagement'`. Isso bate. Então as categorias Ambiental (`environmental-category` → `esgEnvironmental`) e Governança (`governance-category` → `esgGovernance`) e Gestão (`esg-management` → `esgManagement`) deveriam ser filtradas. Social (`social-category` → `esgSocial`) deveria permanecer.

### Falha 2: Seções inteiras não são ocultadas quando necessário

`quality` mapeia para `'sgq'` no sidebar, e o mapeamento `'sgq': 'quality'` existe. `financial` e `data-reports` e `settings` e `suppliers` também existem. Então essas seções deveriam ser filtradas.

**A suspeita principal**: o `useMemo` em `AppSidebar.tsx` (linha 683-695) tem como dependências `[isSectionVisible, isEsgCategoryVisible]`. Estas são **funções** recriadas a cada render do hook `useModuleSettings`. Porém, como `userAccess` é carregado assincronamente, o memo pode computar ANTES dos dados de `userAccess` estarem disponíveis — e quando os dados chegam, as funções mudam mas o `useMemo` pode não re-executar corretamente porque React compara referências de funções.

**Na verdade, o problema real é mais simples**: as funções `isSectionVisible` e `isEsgCategoryVisible` são recriadas a cada render, então o `useMemo` SEMPRE re-executa (nunca é memorizado). Isso deveria funcionar... a menos que o `userAccess` ainda seja `undefined` quando o componente renderiza.

Investigando: o `useQuery` para `userAccess` tem `enabled: !!user?.id`. Se o `user` do `useAuth()` demora a carregar, o `userAccess` fica como `undefined` (não `[]`), e `isModuleVisible` retorna `true` para tudo.

**Mas quando o user carrega e o query roda, deveria re-renderizar.** A menos que exista um cache stale...

### Falha 3: Sem bloqueio a nível de rota

Mesmo que a sidebar funcione, o usuário pode digitar a URL diretamente e acessar qualquer módulo.

## Solução proposta

### 1. Corrigir `useModuleSettings.ts` — tornar funções estáveis e adicionar seção ESG

- Envolver `isModuleVisible`, `isSectionVisible`, `isEsgCategoryVisible` em `useCallback` com dependências corretas (`settings`, `userAccess`, `isDemo`)
- Adicionar lógica para ocultar a seção `'esg'` inteira quando TODAS as sub-categorias ESG estão bloqueadas
- Adicionar log de debug para diagnosticar o que está acontecendo

### 2. Corrigir `AppSidebar.tsx` — dependências do `useMemo`

- Incluir `settings` e `userAccess` (ou os dados brutos) como dependências do `useMemo`, em vez de confiar nas referências de função
- Alternativamente, usar `useCallback` no hook para estabilizar as referências

### 3. Criar mapeamento de rotas e `ModuleGuard`

- Criar `src/config/routeModuleMap.ts` com mapeamento rota → módulo
- Criar componente `ModuleGuard` que verifica permissões antes de renderizar
- Integrar no `ProtectedRoute.tsx` para bloqueio automático
- Bypass para roles `platform_admin`, `super_admin`, `admin`

### 4. Ocultar seção ESG inteira quando vazia

Na sidebar, após filtrar os items ESG, verificar se restam items. Se não, remover a seção ESG inteira.

## Arquivos a modificar

1. **`src/hooks/useModuleSettings.ts`** — estabilizar funções com `useCallback`, adicionar lógica ESG completa
2. **`src/components/AppSidebar.tsx`** — corrigir dependências do `useMemo`, filtrar seção ESG vazia
3. **`src/config/routeModuleMap.ts`** (novo) — mapeamento centralizado rota → módulo
4. **`src/components/ProtectedRoute.tsx`** — integrar verificação de módulo antes de renderizar

## Resultado esperado

- Sidebar oculta corretamente seções e categorias ESG bloqueadas
- Seção ESG desaparece quando todas as sub-categorias estão bloqueadas
- Acesso direto por URL é bloqueado com redirect ao dashboard
- Admins mantêm bypass total

