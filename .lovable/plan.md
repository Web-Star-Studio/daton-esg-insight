
# Plano de Correção: Race Condition em Múltiplas Páginas Protegidas

## Diagnóstico

Durante o teste end-to-end do sistema, identifiquei **4 páginas adicionais** com o mesmo problema de race condition que foi corrigido em `GestaoTreinamentos` e `GestaoDesempenho`.

### Páginas Afetadas

| Página | Arquivo | Queries com `enabled: !!user` |
|--------|---------|-------------------------------|
| Gestão de Stakeholders | `src/pages/GestaoStakeholders.tsx` | 2 queries (linhas 52, 58) |
| Configuração Organizacional | `src/pages/ConfiguracaoOrganizacional.tsx` | 1 query (linha 92) |
| Coleta de Dados | `src/pages/ColetaDados.tsx` | 2 queries (linhas 65, 71) |
| Análise de Materialidade | `src/pages/AnaliseMaterialidade.tsx` | 2 queries (linhas 44, 50) |
| Formulários Customizados | `src/pages/FormulariosCustomizados.tsx` | useEffect com authLoading (linha 52) |

### Arquivos que NÃO precisam de correção

- `usePermissions.tsx` - Hook reutilizável, condição faz sentido
- `useNotificationCounts.tsx` - Condição complexa com companyId
- Componentes modais/widgets - Usam condições específicas de dados

### Por que o problema ocorre?

Todas essas páginas estão envolvidas pelo `ProtectedRoute`, que já garante:
1. `isLoading === false`
2. `user !== null`

Porém, devido a timing do React Context, o componente filho pode ler `user = null` por um frame antes de receber a atualização, fazendo com que:
- `enabled: !!user` seja `false`
- Queries retornem arrays vazios `[]`
- UI mostre "Nenhum dado encontrado"

---

## Solução

Aplicar o mesmo padrão de correção usado em `GestaoTreinamentos` e `GestaoDesempenho`:

1. **Remover `enabled: !!user`** de todas as queries em páginas protegidas
2. **Manter loading states** baseados no estado das queries
3. **Confiar no ProtectedRoute** para garantia de autenticação

---

## Mudanças por Arquivo

### 1. GestaoStakeholders.tsx

```typescript
// REMOVER enabled: !!user das queries
const { data: stakeholders = [], isLoading } = useQuery({
  queryKey: ['stakeholders'],
  queryFn: () => getStakeholders(),
  // enabled: !!user,  <- REMOVER
});

const { data: engagementStats } = useQuery({
  queryKey: ['stakeholder-stats'],
  queryFn: () => getStakeholderEngagementStats(),
  // enabled: !!user,  <- REMOVER
});
```

### 2. ConfiguracaoOrganizacional.tsx

```typescript
const { data: profile, isLoading } = useQuery({
  queryKey: ['organizational-profile'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .limit(1)
      .single();
    
    if (error) throw error;
    return data as OrganizationalProfile;
  },
  // enabled: !!user,  <- REMOVER
});
```

### 3. ColetaDados.tsx

```typescript
const { data: tasks = [], isLoading: tasksLoading } = useQuery({
  queryKey: ['data-collection-tasks'],
  queryFn: () => dataCollectionService.getTasks(),
  // enabled: !!user,  <- REMOVER
});

const { data: importJobs = [] } = useQuery({
  queryKey: ['import-jobs'],
  queryFn: () => dataCollectionService.getImportJobs(),
  // enabled: !!user,  <- REMOVER
});
```

### 4. AnaliseMaterialidade.tsx

```typescript
const { data: themes = [], isLoading: loadingThemes } = useQuery({
  queryKey: ['materiality-themes'],
  queryFn: () => getMaterialityThemes(),
  // enabled: !!user,  <- REMOVER
});

const { data: assessments = [], isLoading: loadingAssessments } = useQuery({
  queryKey: ['materiality-assessments'],
  queryFn: () => getMaterialityAssessments(),
  // enabled: !!user,  <- REMOVER
  retry: 2,
  retryDelay: 1000,
});
```

### 5. FormulariosCustomizados.tsx

```typescript
// SIMPLIFICAR useEffect - remover verificação de authLoading
useEffect(() => {
  loadForms();
}, []);  // Executar no mount, ProtectedRoute garante auth

// REMOVER useAuth completamente se não for usado para mais nada
```

---

## Resumo de Impacto

| Arquivo | Linhas a Modificar | Tipo de Mudança |
|---------|-------------------|-----------------|
| GestaoStakeholders.tsx | 52, 58 | Remover `enabled: !!user` |
| ConfiguracaoOrganizacional.tsx | 92 | Remover `enabled: !!user` |
| ColetaDados.tsx | 65, 71 | Remover `enabled: !!user` |
| AnaliseMaterialidade.tsx | 44, 50 | Remover `enabled: !!user` |
| FormulariosCustomizados.tsx | 25, 52-57 | Remover authLoading check |

---

## Resultado Esperado

Após as correções:

| Cenário | Antes | Depois |
|---------|-------|--------|
| Primeiro acesso a qualquer página protegida | Possível lista vazia | Dados carregam corretamente |
| Navegação entre páginas | Inconsistente | Dados sempre presentes |
| Reload da página | Race condition | Queries executam imediatamente |

---

## Seção Técnica

### Padrão Correto para Páginas Protegidas

```typescript
// Em página envolvida por ProtectedRoute:
export default function MinhaPagena() {
  // NÃO usar:
  // const { user } = useAuth();
  // enabled: !!user

  // USAR:
  const { data, isLoading } = useQuery({
    queryKey: ['meus-dados'],
    queryFn: () => fetchDados(),
    // Sem enabled - ProtectedRoute garante auth
  });

  if (isLoading) {
    return <Skeleton />; // Loading baseado na query
  }

  return <div>{/* Conteúdo */}</div>;
}
```

### Quando usar `enabled: !!user`?

- Em hooks reutilizáveis (ex: `usePermissions`)
- Em componentes que podem aparecer em contextos públicos
- Em modais/widgets condicionais
- Em páginas públicas com features opcionais para usuários logados
