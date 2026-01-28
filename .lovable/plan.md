
# Plano: Corrigir Loading State no Sistema de Permissoes

## Diagnostico

O `PermissionGate` mostra "Voce nao tem permissao" porque renderiza **antes** das queries de permissoes terminarem:

```
Usuario acessa /gestao-usuarios
         |
         v
   PermissionGate verifica hasPermission('users.view')
         |
         v
   usePermissions.rolePermissions = [] (ainda carregando!)
         |
         v
   hasPermission retorna false
         |
         v
   Mostra "Sem permissao" (ERRO!)
         |
   [...]
         v
   Query termina - rolePermissions = [28 permissoes]
         |
   (mas o componente ja mostrou erro)
```

## Solucao

Adicionar estados de loading ao hook `usePermissions` e fazer o `PermissionGate` aguardar o carregamento.

---

## Alteracoes

### Arquivo 1: `src/hooks/usePermissions.tsx`

Adicionar retorno de estados `isLoading`:

```typescript
export const usePermissions = () => {
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['current-user'],
    // ...
  });

  const { data: userRole, isLoading: roleLoading } = useQuery({
    queryKey: ['user-role', user?.id],
    // ...
  });

  const { data: rolePermissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ['role-permissions', userRole],
    // ...
  });

  // Estado de loading combinado
  const isLoading = userLoading || roleLoading || permissionsLoading;

  return {
    // ... outros retornos existentes
    isLoading,
  };
};
```

### Arquivo 2: `src/components/permissions/PermissionGate.tsx`

Adicionar tratamento de loading:

```typescript
export const PermissionGate = ({ 
  permission, 
  requireAll = false,
  fallback,
  showAlert = false,
  children 
}: PermissionGateProps) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = usePermissions();

  // Mostrar loading enquanto verifica permissoes
  if (isLoading) {
    if (showAlert) {
      return (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">Verificando permissoes...</span>
        </div>
      );
    }
    return null; // ou fallback silencioso
  }

  const hasAccess = Array.isArray(permission)
    ? requireAll 
      ? hasAllPermissions(permission)
      : hasAnyPermission(permission)
    : hasPermission(permission);

  // ... resto do codigo
};
```

---

## Resumo das Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/usePermissions.tsx` | Adicionar `isLoading` baseado nas 3 queries |
| `src/components/permissions/PermissionGate.tsx` | Mostrar loading enquanto verifica permissoes |

---

## Resultado Esperado

1. Enquanto queries carregam: mostra spinner "Verificando permissoes..."
2. Apos queries terminarem: mostra conteudo ou mensagem de erro real
3. Admins verao a lista de usuarios corretamente
4. Nao mostrara mais "sem permissao" falsamente durante o carregamento
