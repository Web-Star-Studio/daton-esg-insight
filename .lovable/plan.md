

# Plano: Tornar Módulo Operação e Ativos Acessíveis

## Problema Identificado

1. **`/ativos`** está mapeado ao módulo `dataReports` em `enabledModules.ts`, que está desabilitado (`false`). Resultado: redireciona para `/dashboard`.
2. **`/production-monitoring`** (Módulo Operação) não tem entrada no sidebar — a página existe mas é inacessível pela navegação.

## Correções

### 1. Remover `/ativos` do módulo `dataReports`

**Arquivo:** `src/config/enabledModules.ts`
- Remover a linha `{ pattern: /^\/ativos/, moduleKey: 'dataReports' }` do array `DISABLED_ROUTES`
- A rota `/ativos` já está registrada no `App.tsx` e no sidebar como "Central de Dados → Ativos"

**Arquivo:** `src/config/routeModuleMap.ts`
- Verificar/ajustar o mapeamento de `/ativos` (atualmente aponta para `esgEnvironmental`, pode precisar de revisão dependendo de onde você quer que ele viva)

### 2. Adicionar "Módulo Operação" ao sidebar

**Arquivo:** `src/components/AppSidebar.tsx`
- Adicionar entrada de menu para `/production-monitoring` com título "Módulo Operação" e ícone adequado (Settings ou Wrench)
- Posicionar na seção de Qualidade/SGQ ou como seção própria

### 3. Registrar rota no RouteValidator

**Arquivo:** `src/components/RouteValidator.tsx`
- Adicionar `/production-monitoring` à lista `VALID_ROUTES` (não está lá atualmente)

### 4. Atualizar busca global

**Arquivo:** `src/components/navigation/EnhancedGlobalSearch.tsx`
- Adicionar entrada para "Módulo Operação" com path `/production-monitoring`

---

**Resultado:** Ambas as páginas (Ativos e Módulo Operação) ficam acessíveis pelo menu lateral e pela navegação.

