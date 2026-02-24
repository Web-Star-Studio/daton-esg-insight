

# Convite de Usuarios por Email no Admin Dashboard

## Situacao Atual

A infraestrutura de convites ja esta **100% implementada**:
- Edge Function `invite-user` funcional com Resend
- `RESEND_API_KEY` ja configurada nas secrets
- Hook `useUserManagement` com `createUser` e `resendInvite`
- `UserFormModal` com formulario completo (nome, email, role, departamento, telefone)
- Pagina `/gestao-usuarios` ja usa tudo isso

O que falta: disponibilizar essa funcionalidade dentro do `/admin-dashboard`.

## Plano

### 1. Criar componente `src/components/admin/UserInviteModule.tsx`

Novo modulo para a tab de convites no admin dashboard contendo:
- Botao "Convidar Usuario" que abre o `UserFormModal`
- Tabela de usuarios da organizacao (reutilizando dados do `useUserManagement`)
- Cards de estatisticas (total de usuarios, ativos, pendentes)
- Acoes: reenviar convite, ver detalhes
- Reutiliza os componentes existentes: `UserFormModal`, `UserStatsCards`, `AdminUserTable`

### 2. Modificar `src/pages/AdminDashboard.tsx`

Adicionar uma quinta tab "Usuarios" com icone `Users`:
- Nova tab entre as existentes
- Conteudo renderiza o `UserInviteModule`
- Grid de tabs passa de 4 para 5 colunas

## Secao Tecnica

### UserInviteModule

O componente vai:
1. Importar e usar o hook `useUserManagement` (ja existente)
2. Renderizar `UserStatsCards` para metricas
3. Renderizar `AdminUserTable` para lista de usuarios
4. Renderizar `UserFormModal` para criar/editar usuarios
5. Incluir `UserSearchFilters` para busca e filtros
6. Toda a logica de convite, reenvio e CRUD ja existe no hook

```typescript
// Estrutura simplificada
const UserInviteModule = () => {
  const { users, stats, createUser, resendInvite, ... } = useUserManagement();
  const [showForm, setShowForm] = useState(false);
  
  return (
    <div>
      <header com botao "Convidar Usuario" />
      <UserStatsCards stats={stats} />
      <UserSearchFilters />
      <AdminUserTable users={users} />
      <UserFormModal open={showForm} onSave={createUser} />
    </div>
  );
};
```

### AdminDashboard.tsx

```typescript
// Adicionar import
import { UserInviteModule } from '@/components/admin/UserInviteModule';
import { Users } from 'lucide-react';

// Adicionar tab
<TabsTrigger value="users">
  <Users className="h-4 w-4" />
  <span className="hidden sm:inline">Usuarios</span>
</TabsTrigger>

<TabsContent value="users">
  <UserInviteModule />
</TabsContent>
```

### Nenhuma mudanca no backend
A Edge Function `invite-user` e as queries do `useUserManagement` ja atendem completamente. Apenas reorganizamos componentes existentes no frontend.

