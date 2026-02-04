
# Plano de Correção: Treinamentos não aparecem na tela

## Diagnóstico do Problema

### Causa Raiz Identificada

O problema é uma **combinação de dois fatores**:

1. **Ausência de verificação de autenticação** na página `GestaoTreinamentos.tsx`
2. **Cache excessivo** (2 minutos de `staleTime`) sem condição de habilitação

```text
┌──────────────────────────────────────────────────────────────────┐
│  Usuário acessa /gestao-treinamentos                             │
└──────────────────────────────────────────────────────────────────┘
                              │
                              v
┌──────────────────────────────────────────────────────────────────┐
│  useQuery executa ANTES da autenticação estar pronta             │
│  (auth.uid() = NULL no momento da query)                         │
└──────────────────────────────────────────────────────────────────┘
                              │
                              v
┌──────────────────────────────────────────────────────────────────┐
│  RLS bloqueia: get_user_company_id() retorna NULL                │
│  → SELECT retorna 0 linhas                                       │
└──────────────────────────────────────────────────────────────────┘
                              │
                              v
┌──────────────────────────────────────────────────────────────────┐
│  React Query CACHEIA o array vazio por 2 minutos                 │
│  (staleTime: 2 * 60 * 1000)                                      │
└──────────────────────────────────────────────────────────────────┘
                              │
                              v
┌──────────────────────────────────────────────────────────────────┐
│  Autenticação completa (segundos depois)                         │
│  MAS o cache não é refetch porque ainda é "fresh"                │
└──────────────────────────────────────────────────────────────────┘
                              │
                              v
┌──────────────────────────────────────────────────────────────────┐
│  "Nenhum programa encontrado" - lista vazia                      │
└──────────────────────────────────────────────────────────────────┘
```

### Evidência

A página `GestaoDesempenho.tsx` usa corretamente:

```typescript
const { isAuthenticated, isLoading: authLoading } = useAuthCheck();

const { data: performanceStats } = useQuery({
  queryKey: ['performance-stats'],
  queryFn: getPerformanceStats,
  enabled: isAuthenticated,  // ← Query só executa quando autenticado
});
```

Já `GestaoTreinamentos.tsx` não tem essa verificação:

```typescript
// SEM verificação de autenticação!
const { data: programs = [] } = useQuery({
  queryKey: ['training-programs'],
  queryFn: getTrainingPrograms,
  staleTime: 2 * 60 * 1000,
  // Falta: enabled: isAuthenticated
});
```

---

## Solução Proposta

### Adicionar verificação de autenticação nas queries

**Arquivo:** `src/pages/GestaoTreinamentos.tsx`

Adicionar o hook `useAuthCheck` e condicionar todas as queries com `enabled: isAuthenticated`:

```typescript
import { useAuthCheck } from "@/hooks/useAuthCheck";

export default function GestaoTreinamentos() {
  // ... state declarations ...
  
  // Adicionar verificação de autenticação
  const { isAuthenticated, isLoading: authLoading } = useAuthCheck();

  // Query condicionada à autenticação
  const { data: programs = [], isLoading: isLoadingPrograms } = useQuery({
    queryKey: ['training-programs'],
    queryFn: getTrainingPrograms,
    staleTime: 2 * 60 * 1000,
    enabled: isAuthenticated,  // ← ADICIONAR
  });

  // Aplicar em todas as outras queries também
  const { data: categories = [] } = useQuery({
    queryKey: ['training-categories'],
    queryFn: getTrainingCategories,
    staleTime: 5 * 60 * 1000,
    enabled: isAuthenticated,  // ← ADICIONAR
  });

  const { data: employeeTrainings = [] } = useQuery({
    queryKey: ['employee-trainings'],
    queryFn: getEmployeeTrainings,
    staleTime: 60 * 1000,
    enabled: isAuthenticated,  // ← ADICIONAR
  });

  const { data: trainingMetrics } = useQuery({
    queryKey: ['training-metrics'],
    queryFn: getTrainingMetrics,
    staleTime: 3 * 60 * 1000,
    enabled: isAuthenticated,  // ← ADICIONAR
  });

  // Mostrar loading enquanto verifica autenticação
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
}
```

---

## Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `src/pages/GestaoTreinamentos.tsx` | Adicionar `useAuthCheck` e `enabled: isAuthenticated` em todas as queries |

---

## Mudanças Detalhadas

### 1. Adicionar import do hook de autenticação

```typescript
import { useAuthCheck } from "@/hooks/useAuthCheck";
```

### 2. Usar o hook no componente

```typescript
const { isAuthenticated, isLoading: authLoading, error: authError } = useAuthCheck();
```

### 3. Adicionar `enabled: isAuthenticated` em todas as queries

Queries a atualizar:
- `['training-programs']`
- `['training-categories']`
- `['employee-trainings']`
- `['training-metrics']`

### 4. Adicionar estado de carregamento enquanto verifica autenticação

```typescript
if (authLoading) {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}
```

---

## Resultado Esperado

| Cenário | Antes | Depois |
|---------|-------|--------|
| Primeiro acesso (auth não pronta) | Query executa com auth=NULL, retorna [], cacheia vazio | Query aguarda auth, executa só quando pronta |
| Cache após auth | Mantém [] por 2 min | Dados corretos cacheados |
| Navegação entre páginas | Pode mostrar dados vazios | Sempre mostra dados corretos |

---

## Seção Técnica

### Por que isso resolve o problema?

O TanStack Query com `enabled: false` **não executa a query**. Isso significa:

1. A query fica em estado "idle" enquanto `isAuthenticated === false`
2. Quando a autenticação completa, `enabled` muda para `true`
3. A query executa com a sessão válida
4. RLS funciona corretamente pois `auth.uid()` retorna o ID do usuário
5. Os dados são retornados e cacheados

### Fluxo corrigido

```text
┌─────────────────────────────┐
│  Acesso à página            │
│  isAuthenticated = false    │
│  Queries em estado IDLE     │
└─────────────────────────────┘
              │
              v
┌─────────────────────────────┐
│  Autenticação completa      │
│  isAuthenticated = true     │
└─────────────────────────────┘
              │
              v
┌─────────────────────────────┐
│  Queries executam           │
│  auth.uid() = ID válido     │
│  RLS permite acesso         │
└─────────────────────────────┘
              │
              v
┌─────────────────────────────┐
│  Dados retornados e         │
│  cacheados corretamente     │
└─────────────────────────────┘
```
