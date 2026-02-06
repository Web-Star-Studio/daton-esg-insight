

# Plano de Correção: GestaoDesempenho.tsx - Mesmo Problema de Lista Vazia

## Resultado do Teste

O teste da página **Gestão de Treinamentos** confirmou que a correção anterior funcionou - os 4 programas carregaram corretamente na primeira screenshot.

Durante a análise do código, identifiquei que a página **Gestão de Desempenho** (`GestaoDesempenho.tsx`) tem exatamente o mesmo problema que foi corrigido em Treinamentos.

## Problema Identificado

O arquivo `src/pages/GestaoDesempenho.tsx` usa o padrão problemático:

```text
┌────────────────────────────────────────────────────────────────────┐
│  Linha 36:  import { useAuthCheck } from '@/hooks/useAuthCheck';   │
│  Linha 60:  const { isAuthenticated, ... } = useAuthCheck();       │
│  Linha 82:  enabled: isAuthenticated  (query performance-stats)    │
│  Linha 102: enabled: isAuthenticated  (query evaluations)          │
│  Linha 109: enabled: isAuthenticated  (query goals)                │
│  Linha 117: enabled: isAuthenticated  (query competencies)         │
│  Linha 124: enabled: isAuthenticated  (query assessments)          │
│  Linha 131: enabled: isAuthenticated  (query gaps)                 │
└────────────────────────────────────────────────────────────────────┘
```

Isso causa a mesma race condition que afetava Treinamentos:
- O `ProtectedRoute` já valida autenticação
- O `useAuthCheck()` faz verificação duplicada
- As queries ficam com `enabled: false` durante o race
- Dados não carregam

---

## Solução

Aplicar a mesma correção de `GestaoTreinamentos.tsx`:

1. **Remover `useAuthCheck`** - já está no contexto do `ProtectedRoute`
2. **Remover `enabled: isAuthenticated`** das 6 queries
3. **Remover o loading state de auth** (linhas 274-283)
4. **Manter skeleton loaders** baseados no estado das queries

---

## Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `src/pages/GestaoDesempenho.tsx` | Remover useAuthCheck e enabled das queries |

---

## Mudanças Detalhadas

### 1. Remover import e hook

```typescript
// REMOVER linha 36:
import { useAuthCheck } from "@/hooks/useAuthCheck";

// REMOVER linha 60:
const { isAuthenticated, isLoading: authLoading, error: authError, retry: authRetry } = useAuthCheck();
```

### 2. Remover `enabled: isAuthenticated` de todas as queries

Queries afetadas (6 no total):
- `performance-stats` (linha 82)
- `performance-evaluations` (linha 102)
- `employee-goals` (linha 109)
- `competency-matrix` (linha 117)
- `competency-assessments` (linha 124)
- `competency-gaps` (linha 131)

### 3. Remover verificação de authError (linhas 262-271)

O `ProtectedRoute` já trata erros de autenticação.

### 4. Remover loading state de auth (linhas 274-283)

Substituir por skeleton loaders baseados nas queries.

### 5. Ajustar useEffect de inicialização (linhas 63-76)

Mudar de `if (!isAuthenticated)` para sempre executar (o componente só monta quando autenticado).

---

## Resultado Esperado

| Página | Antes | Depois |
|--------|-------|--------|
| Gestão de Treinamentos | Lista vazia corrigida | Dados carregando |
| Gestão de Desempenho | Lista vazia | Dados carregando corretamente |

---

## Seção Técnica

### Por que a correção em Treinamentos funcionou?

A correção removeu a dependência de `useAuthCheck()`, fazendo as queries executarem imediatamente quando o componente monta. Como o `ProtectedRoute` só renderiza o componente após confirmar autenticação, as queries sempre têm uma sessão válida.

### Consistência do Codebase

Após esta correção, nenhuma página protegida usará `useAuthCheck()`. O hook continuará disponível para casos específicos (páginas públicas com features opcionais para usuários logados), mas não será usado em rotas protegidas.

