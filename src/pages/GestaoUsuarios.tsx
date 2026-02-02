import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserManagement } from '@/hooks/data/useUserManagement';
import { UserManagementHeader } from '@/components/users/UserManagementHeader';
import { UserStatsCards } from '@/components/users/UserStatsCards';
import { AdminUserTable } from '@/components/users/AdminUserTable';
import { UserSearchFilters } from '@/components/users/UserSearchFilters';
import { UserPagination } from '@/components/users/UserPagination';
import { UserFormModal } from '@/components/users/UserFormModal';
import { UserDetailsDialog } from '@/components/users/UserDetailsDialog';
import { ResetPasswordDialog } from '@/components/users/ResetPasswordDialog';
import { DeleteUserDialog } from '@/components/users/DeleteUserDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Shield, Settings } from 'lucide-react';
import { PermissionGate } from '@/components/permissions/PermissionGate';
import { usePermissions, UserRole } from '@/hooks/usePermissions';
import type { UserProfile, UserFilters } from '@/hooks/data/useUserManagement';

interface UserProfileWithRole extends UserProfile {
  role: UserRole;
}

export default function GestaoUsuarios() {
  const queryClient = useQueryClient();
  const { isSuperAdmin, isAdmin, currentUserId } = usePermissions();
  const { 
    users, 
    stats, 
    pagination,
    filters,
    usersLoading, 
    createUser, 
    updateUser,
    softDeleteUser,
    reactivateUser,
    deleteUser,
    resetPassword,
    resendInvite,
    updateFilters,
    isCreating,
    isUpdating,
    isSoftDeleting,
    isDeleting,
    isResetting,
    isResending,
    checkEmailUnique,
    checkUsernameUnique,
  } = useUserManagement();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch all users with roles for permissions tab
  const { data: usersWithRoles, isLoading: rolesLoading } = useQuery({
    queryKey: ['company-users-roles'],
    queryFn: async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.company_id) return [];

      // SECURE: Fetch roles from user_roles table
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, company_id')
        .eq('company_id', profile.company_id)
        .order('full_name');

      if (!profiles) return [];

      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', profiles.map(p => p.id));

      const rolesMap = new Map(userRoles?.map(ur => [ur.user_id, ur.role]) || []);

      return profiles.map(p => ({
        ...p,
        role: rolesMap.get(p.id) || 'viewer'
      })) as UserProfileWithRole[];
    }
  });

  // Mutation to update user role
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: UserRole }) => {
      // SECURE: Update role in user_roles table
      const { error } = await supabase
        .from('user_roles')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-users-roles'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Função do usuário atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar função: ' + error.message);
    }
  });

  // Handlers
  const handleNewUser = () => {
    setSelectedUser(null);
    setModalOpen(true);
  };

  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const handleViewUser = (user: UserProfile) => {
    setSelectedUser(user);
    setViewDialogOpen(true);
  };

  const handleResetPassword = (user: UserProfile) => {
    setSelectedUser(user);
    setResetDialogOpen(true);
  };

  const handleConfirmResetPassword = () => {
    if (selectedUser) {
      resetPassword({ userId: selectedUser.id, email: selectedUser.email });
      setResetDialogOpen(false);
    }
  };

  const handleDeactivateUser = (user: UserProfile) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleReactivateUser = (user: UserProfile) => {
    reactivateUser({ userId: user.id, fullName: user.full_name });
  };

  const handleDeleteUser = (user: UserProfile) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleSoftDelete = (reason?: string) => {
    if (selectedUser) {
      softDeleteUser({ userId: selectedUser.id, reason, fullName: selectedUser.full_name });
    }
  };

  const handleHardDelete = (reason?: string) => {
    if (selectedUser) {
      deleteUser({ userId: selectedUser.id, reason, fullName: selectedUser.full_name });
    }
  };

  const handleSaveUser = (data: Partial<UserProfile>) => {
    if (selectedUser) {
      updateUser({ id: selectedUser.id, ...data });
    } else {
      createUser(data);
    }
    setModalOpen(false);
    setSelectedUser(null);
  };

  const handleResendInvite = (user: UserProfile) => {
    resendInvite({
      userId: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    });
  };

  const handleSort = useCallback((column: UserFilters['orderBy']) => {
    const newDir = filters.orderBy === column && filters.orderDir === 'asc' ? 'desc' : 'asc';
    updateFilters({ orderBy: column, orderDir: newDir });
  }, [filters.orderBy, filters.orderDir, updateFilters]);

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'platform_admin': return 'bg-indigo-600';
      case 'super_admin': return 'bg-purple-500';
      case 'admin': return 'bg-red-500';
      case 'manager': return 'bg-blue-500';
      case 'analyst': return 'bg-green-500';
      case 'operator': return 'bg-yellow-500';
      case 'viewer': return 'bg-gray-500';
      case 'auditor': return 'bg-orange-500';
      default: return 'bg-gray-400';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    const labels: Record<UserRole, string> = {
      platform_admin: 'Administrador da Plataforma',
      super_admin: 'Super Administrador',
      admin: 'Administrador',
      manager: 'Gerente',
      analyst: 'Analista',
      operator: 'Operador',
      viewer: 'Visualizador',
      auditor: 'Auditor'
    };
    return labels[role] || role;
  };

  return (
    <>
      <div className="space-y-6">
        <UserManagementHeader onNewUser={handleNewUser} />
        <UserStatsCards stats={stats} />

        <Tabs defaultValue="usuarios" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-auto">
            <TabsTrigger value="usuarios" className="text-sm py-2.5">Usuários</TabsTrigger>
            <TabsTrigger value="permissoes" className="text-sm py-2.5">Permissões</TabsTrigger>
          </TabsList>

          <TabsContent value="usuarios" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Usuários</CardTitle>
                <CardDescription>
                  Gerencie todos os usuários do sistema com busca, filtros e ações avançadas.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <UserSearchFilters 
                  filters={filters}
                  onFilterChange={updateFilters}
                />

                {/* Table */}
                <AdminUserTable
                  users={users}
                  isLoading={usersLoading}
                  currentUserId={currentUserId}
                  filters={filters}
                  onSort={handleSort}
                  onView={handleViewUser}
                  onEdit={handleEditUser}
                  onResetPassword={handleResetPassword}
                  onDeactivate={handleDeactivateUser}
                  onReactivate={handleReactivateUser}
                  onDelete={handleDeleteUser}
                />

                {/* Pagination */}
                {pagination.total > 0 && (
                  <UserPagination
                    page={pagination.page}
                    limit={pagination.limit}
                    total={pagination.total}
                    totalPages={pagination.totalPages}
                    onPageChange={(page) => updateFilters({ page })}
                    onLimitChange={(limit) => updateFilters({ limit, page: 1 })}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissoes" className="space-y-4">
            <PermissionGate 
              permission="users.view" 
              showAlert
              fallback={
                <Card>
                  <CardHeader>
                    <Shield className="h-8 w-8 text-muted-foreground mb-2" />
                    <CardTitle>Acesso Negado</CardTitle>
                    <CardDescription>
                      Você não tem permissão para gerenciar permissões de usuários.
                    </CardDescription>
                  </CardHeader>
                </Card>
              }
            >
              <Card>
                <CardHeader>
                  <CardTitle>Gerenciamento de Permissões</CardTitle>
                  <CardDescription>
                    {usersWithRoles?.length || 0} usuário(s) cadastrado(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {rolesLoading ? (
                    <p className="text-muted-foreground">Carregando usuários...</p>
                  ) : (
                    <div className="space-y-4">
                      {usersWithRoles?.map((user) => (
                        <div 
                          key={user.id} 
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <p className="font-medium">{user.full_name}</p>
                              <Badge className={getRoleBadgeColor(user.role)}>
                                {getRoleLabel(user.role)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">ID: {user.id}</p>
                          </div>
                          
                          <PermissionGate permission="users.manage_permissions">
                            <div className="flex items-center gap-2">
                              <Select
                                value={user.role}
                                onValueChange={(newRole) => {
                                  if (!isSuperAdmin && newRole === 'super_admin') {
                                    toast.error('Apenas Super Admins podem criar outros Super Admins');
                                    return;
                                  }
                                  updateRoleMutation.mutate({ 
                                    userId: user.id, 
                                    newRole: newRole as UserRole 
                                  });
                                }}
                                disabled={!isAdmin || user.role === 'super_admin'}
                              >
                                <SelectTrigger className="w-[200px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {isSuperAdmin && (
                                    <SelectItem value="super_admin">Super Administrador</SelectItem>
                                  )}
                                  <SelectItem value="admin">Administrador</SelectItem>
                                  <SelectItem value="manager">Gerente</SelectItem>
                                  <SelectItem value="analyst">Analista</SelectItem>
                                  <SelectItem value="operator">Operador</SelectItem>
                                  <SelectItem value="viewer">Visualizador</SelectItem>
                                  <SelectItem value="auditor">Auditor</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </PermissionGate>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Descrição das Funções
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex gap-3">
                      <Badge className="bg-purple-500">Super Admin</Badge>
                      <p className="text-muted-foreground">Acesso total ao sistema</p>
                    </div>
                    <div className="flex gap-3">
                      <Badge className="bg-red-500">Admin</Badge>
                      <p className="text-muted-foreground">Gerenciamento completo da empresa</p>
                    </div>
                    <div className="flex gap-3">
                      <Badge className="bg-blue-500">Gerente</Badge>
                      <p className="text-muted-foreground">Gestão de dados e relatórios</p>
                    </div>
                    <div className="flex gap-3">
                      <Badge className="bg-green-500">Analista</Badge>
                      <p className="text-muted-foreground">Análise de dados e criação de relatórios</p>
                    </div>
                    <div className="flex gap-3">
                      <Badge className="bg-yellow-500">Operador</Badge>
                      <p className="text-muted-foreground">Entrada de dados operacionais</p>
                    </div>
                    <div className="flex gap-3">
                      <Badge className="bg-gray-500">Visualizador</Badge>
                      <p className="text-muted-foreground">Apenas visualização de dados</p>
                    </div>
                    <div className="flex gap-3">
                      <Badge className="bg-orange-500">Auditor</Badge>
                      <p className="text-muted-foreground">Acesso para auditoria e conformidade</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </PermissionGate>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <UserFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        user={selectedUser}
        onSave={handleSaveUser}
        isLoading={isCreating || isUpdating}
        onResendInvite={handleResendInvite}
        isResending={isResending}
        checkEmailUnique={checkEmailUnique}
        checkUsernameUnique={checkUsernameUnique}
      />

      <UserDetailsDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        user={selectedUser}
      />

      <ResetPasswordDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        user={selectedUser}
        onConfirm={handleConfirmResetPassword}
        isLoading={isResetting}
      />

      <DeleteUserDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        user={selectedUser}
        onSoftDelete={handleSoftDelete}
        onHardDelete={handleHardDelete}
        isSoftDeleting={isSoftDeleting}
        isHardDeleting={isDeleting}
      />
    </>
  );
}
