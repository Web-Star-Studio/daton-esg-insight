# Skill: demo-audit
# Trigger: /demo-audit
# Descrição: Auditar um componente/página para garantir segurança total no modo demo (zero CRUD real)

O usuário quer verificar se um componente é seguro para o modo demo. Execute a auditoria completa abaixo.

## Objetivo

O modo demo (`/demo/*`) NUNCA pode:
- Fazer chamadas reais de escrita ao Supabase (insert, update, upsert, delete)
- Fazer uploads reais de arquivo
- Enviar e-mails ou notificações reais
- Navegar para fora do namespace `/demo`

## Auditoria — Execute em ordem

### 1. Identificar o alvo

```bash
# Se o usuário informou um arquivo específico, leia-o
# Se não, liste as páginas demo para identificar o alvo
ls src/pages/
grep -r "path=\"[^\"]*\"" src/App.tsx | grep demo
```

### 2. Buscar padrões de CRUD perigosos

```bash
# Mutations do React Query
grep -n "useMutation\|mutate\|mutateAsync" src/[caminho/arquivo].tsx

# Chamadas diretas ao Supabase
grep -n "\.insert\|\.update\|\.upsert\|\.delete\|\.from(" src/[caminho/arquivo].tsx

# Upload de arquivos
grep -n "storage\.upload\|uploadFile\|useAttachments" src/[caminho/arquivo].tsx

# Navegação fora do demo
grep -n "navigate\|useNavigate\|window\.location" src/[caminho/arquivo].tsx
```

### 3. Verificar uso correto de demoGuard

Para cada ação de escrita encontrada, verificar se está protegida:

```typescript
// ✅ CORRETO — usa demoAction para bloqueio condicional
import { demoAction, triggerDemoBlocked } from '@/utils/demoGuard';
import { useDemo } from '@/contexts/DemoContext';

const { isDemo } = useDemo();

const handleSave = () => {
  demoAction(isDemo, () => {
    // Código real só executa quando isDemo === false
    supabase.from('tabela').insert(dados);
  });
};

// ✅ CORRETO — bloqueia e mostra modal
const handleDelete = () => {
  if (isDemo) {
    triggerDemoBlocked();
    return;
  }
  // delete real
};

// ❌ ERRADO — executa sem verificação
const handleSave = () => {
  supabase.from('tabela').insert(dados); // Sem guarda demo
};
```

### 4. Verificar hooks de data fetching

```typescript
// ✅ CORRETO — useQuery sem queryFn que escreve
const { data } = useQuery({
  queryKey: ['minha-entidade'],
  queryFn: () => fetchFromSupabase(), // Apenas leitura — OK
});

// ✅ CORRETO — mutation com guard
const mutation = useMutation({
  mutationFn: async (data) => {
    if (isDemo) { triggerDemoBlocked(); return; }
    return await supabase.from('tabela').insert(data);
  }
});

// ❌ ERRADO — mutation sem guard
const mutation = useMutation({
  mutationFn: (data) => supabase.from('tabela').insert(data), // Sem guard
});
```

### 5. Verificar formulários

```bash
# Formulários com submit
grep -n "onSubmit\|handleSubmit\|form\.submit" src/[caminho/arquivo].tsx
```

Cada `onSubmit` deve ter proteção demo antes de qualquer persistência.

### 6. Verificar navegação

```typescript
// ✅ CORRETO — navegação dentro do demo
navigate('/demo/outra-rota');

// ❌ ERRADO — sai do namespace demo
navigate('/dashboard'); // Remove usuário não aprovado do demo
navigate('/configuracoes');
```

Se houver links para fora do demo, use verificação:
```typescript
const handleNavExternal = () => {
  if (isDemo) {
    triggerDemoBlocked();
    return;
  }
  navigate('/dashboard');
};
```

### 7. Verificar componentes filhos

```bash
# Listar imports de componentes filhos que podem ter mutations
grep -n "^import" src/[caminho/arquivo].tsx | grep -v "ui/"
```

Para cada componente filho relevante, verificar se recebe `isDemo` como prop ou o consome via `useDemo()`.

## Relatório de Auditoria

Ao finalizar, apresente ao usuário:

```markdown
## Resultado da Auditoria — [NomeDoPagina]

### ✅ Itens OK
- Reads via useQuery: seguros
- [outros pontos OK]

### ⚠️ Problemas encontrados (N)
1. **[linha X]** — `useMutation` sem guard demo em `handleSave`
   - Fix: adicionar `if (isDemo) { triggerDemoBlocked(); return; }`

2. **[linha Y]** — Navegação para `/dashboard` sem verificação
   - Fix: [...]

### 🔧 Correções necessárias
[Lista de alterações a fazer]
```

## Após identificar problemas — Aplicar correções

Para cada problema encontrado:

1. Ler o arquivo completo para contexto
2. Aplicar o fix mínimo necessário (não refatorar código que não está errado)
3. Confirmar que `useDemo` está importado se ainda não estiver
4. Confirmar que `triggerDemoBlocked` ou `demoAction` está importado

```typescript
// Import padrão a adicionar se não existir:
import { useDemo } from '@/contexts/DemoContext';
import { triggerDemoBlocked, demoAction } from '@/utils/demoGuard';
```

## Checklist final

- [ ] Zero `insert`/`update`/`upsert`/`delete` sem guard demo
- [ ] Zero uploads de arquivo sem guard demo
- [ ] Zero navegação para fora de `/demo/*` sem guard
- [ ] Todas mutations verificam `isDemo` antes de executar
- [ ] Formulários bloqueiam submit no modo demo
- [ ] Componentes filhos com state de escrita recebem `isDemo` ou usam `useDemo()`
