
# Plano de Correção: Lista Vazia de Treinamentos

## Diagnóstico do Problema

### Causa Raiz Identificada

O problema está no uso conflitante de **dois hooks de autenticação diferentes**:

```text
┌──────────────────────────────────────────────────────────────────┐
│  ProtectedRoute                                                  │
│  Usa: useAuth() (AuthContext)                                    │
│  ✓ Já verificou autenticação                                     │
│  ✓ Renderiza o componente filho                                  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              v
┌──────────────────────────────────────────────────────────────────┐
│  GestaoTreinamentos                                              │
│  Usa: useAuthCheck() (hook separado)                             │
│  ✗ Faz NOVA verificação de sessão                                │
│  ✗ Race condition com Supabase auth                              │
│  ✗ isAuthenticated pode ser false                                │
└──────────────────────────────────────────────────────────────────┘
                              │
                              v
┌──────────────────────────────────────────────────────────────────┐
│  useQuery({ enabled: isAuthenticated })                          │
│  enabled = false → Query NÃO EXECUTA                             │
│  programs = [] → "Nenhum programa encontrado"                    │
└──────────────────────────────────────────────────────────────────┘
```

### Evidências

1. **Dados existem no banco**: 11 programas de treinamento
2. **RLS está configurada corretamente**: `get_user_company_id()` funciona
3. **Outras páginas funcionam**: Usam `useAuth()` diretamente
4. **GestaoTreinamentos e GestaoDesempenho**: Únicas páginas usando `useAuthCheck()`

O `useAuthCheck()` faz uma verificação **independente** de sessão que pode não estar sincronizada com o estado do `AuthContext`. Isso causa o problema quando:
- O `ProtectedRoute` já verificou e confirmou autenticação
- O `useAuthCheck()` ainda está verificando OU falhou silenciosamente
- As queries ficam com `enabled: false` permanentemente

---

## Solução Proposta

### Abordagem: Usar o AuthContext existente

Em vez de usar `useAuthCheck()` (que duplica verificações), usar o `useAuth()` do `AuthContext` que já está validado pelo `ProtectedRoute`.

### Mudança no GestaoTreinamentos.tsx

**De:**
```typescript
const { isAuthenticated, isLoading: authLoading } = useAuthCheck();
```

**Para:**
```typescript
const { user, isLoading: authLoading } = useAuth();
const isAuthenticated = !!user;
```

Isso aproveita o estado de autenticação já validado pelo `ProtectedRoute`, eliminando a race condition.

---

## Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `src/pages/GestaoTreinamentos.tsx` | Trocar `useAuthCheck()` por `useAuth()` |

---

## Mudanças Detalhadas

### 1. Substituir import

```typescript
// ANTES:
import { useAuthCheck } from '@/hooks/useAuthCheck';

// DEPOIS:
import { useAuth } from '@/contexts/AuthContext';
```

### 2. Substituir hook de autenticação

```typescript
// ANTES:
const { isAuthenticated, isLoading: authLoading } = useAuthCheck();

// DEPOIS:
const { user, isLoading: authLoading } = useAuth();
const isAuthenticated = !!user;
```

### 3. Manter queries condicionadas

As queries já estão corretamente condicionadas com `enabled: isAuthenticated`. Só precisamos garantir que `isAuthenticated` venha do contexto correto.

---

## Resultado Esperado

| Cenário | Antes | Depois |
|---------|-------|--------|
| Primeiro acesso | Lista vazia (isAuthenticated=false) | Dados carregados corretamente |
| Race condition | Duas verificações concorrentes | Uma fonte única de verdade |
| Cache | Vazio cacheado incorretamente | Dados corretos cacheados |

---

## Fluxo Corrigido

```text
┌─────────────────────────────┐
│  ProtectedRoute             │
│  useAuth() verifica         │
│  user = { id, company... }  │
└─────────────────────────────┘
              │
              v
┌─────────────────────────────┐
│  GestaoTreinamentos         │
│  useAuth() (mesmo estado)   │
│  isAuthenticated = true ✓   │
└─────────────────────────────┘
              │
              v
┌─────────────────────────────┐
│  useQuery executa           │
│  RLS funciona               │
│  Dados retornados ✓         │
└─────────────────────────────┘
```

---

## Seção Técnica

### Por que isso funciona?

O `AuthContext` é o **contexto pai** que já verificou a autenticação. Quando o `ProtectedRoute` renderiza o componente filho (GestaoTreinamentos), ele já garantiu que:

1. `user` existe
2. A sessão é válida
3. O perfil foi carregado

Usar `useAuth()` dentro do componente filho simplesmente **acessa o mesmo estado** já validado, sem fazer novas verificações.

### Benefícios adicionais

1. **Consistência**: Mesma fonte de verdade para autenticação
2. **Performance**: Elimina query duplicada ao banco
3. **Menos código**: Remove dependência de hook separado
4. **Menos bugs**: Sem race conditions entre hooks

### Nota sobre useAuthCheck

O hook `useAuthCheck` pode ser útil em contextos onde não há `ProtectedRoute` envolvendo (ex: páginas públicas com features opcionais para usuários logados). Mas dentro de rotas protegidas, deve-se usar o `useAuth()` do contexto.
