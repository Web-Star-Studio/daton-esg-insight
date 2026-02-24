import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Mail } from 'lucide-react';
import { useUserManagement, type UserProfile } from '@/hooks/data/useUserManagement';
import { UserStatsCards } from '@/components/users/UserStatsCards';
import { UserSearchFilters } from '@/components/users/UserSearchFilters';
import { AdminUserTable } from '@/components/users/AdminUserTable';
import { UserFormModal } from '@/components/users/UserFormModal';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const UserInviteModule = () => {
  const { user: currentUser } = useAuth();
  const {
    users,
    stats,
    filters,
    usersLoading,
    isCreating,
    isUpdating,
    isResending,
    createUser,
    updateUser,
    softDeleteUser,
    reactivateUser,
    deleteUser,
    resetPassword,
    resendInvite,
    updateFilters,
    checkEmailUnique,
    checkUsernameUnique,
    pagination,
  } = useUserManagement();

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null);
  const [deactivateUser, setDeactivateUser] = useState<UserProfile | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserProfile | null>(null);

  const handleInvite = () => {
    setEditingUser(null);
    setShowFormModal(true);
  };

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user);
    setShowFormModal(true);
  };

  const handleSave = (data: Partial<UserProfile>) => {
    if (editingUser) {
      updateUser({ ...data, id: editingUser.id });
    } else {
      createUser(data);
    }
    setShowFormModal(false);
    setEditingUser(null);
  };

  const handleResendInvite = (user: UserProfile) => {
    resendInvite({
      userId: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    });
  };

  const handleSort = (column: typeof filters.orderBy) => {
    if (filters.orderBy === column) {
      updateFilters({ orderDir: filters.orderDir === 'asc' ? 'desc' : 'asc' });
    } else {
      updateFilters({ orderBy: column, orderDir: 'asc' });
    }
  };

  const handleConfirmDeactivate = () => {
    if (deactivateUser) {
      softDeleteUser({ userId: deactivateUser.id, fullName: deactivateUser.full_name });
      setDeactivateUser(null);
    }
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmUser) {
      deleteUser({ userId: deleteConfirmUser.id, fullName: deleteConfirmUser.full_name });
      setDeleteConfirmUser(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Gestão de Usuários e Convites
            </CardTitle>
            <CardDescription>
              Convide novos usuários por email e gerencie os membros da sua organização
            </CardDescription>
          </div>
          <Button onClick={handleInvite} className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Convidar Usuário
          </Button>
        </CardHeader>
      </Card>

      {/* Stats */}
      <UserStatsCards stats={stats} />

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <UserSearchFilters filters={filters} onFilterChange={updateFilters} />
        </CardContent>
      </Card>

      {/* Table */}
      <AdminUserTable
        users={users}
        isLoading={usersLoading}
        currentUserId={currentUser?.id}
        filters={filters}
        onSort={handleSort}
        onView={(user) => setViewingUser(user)}
        onEdit={handleEdit}
        onResetPassword={(user) => resetPassword({ userId: user.id, email: user.email })}
        onDeactivate={(user) => setDeactivateUser(user)}
        onReactivate={(user) => reactivateUser({ userId: user.id, fullName: user.full_name })}
        onDelete={(user) => setDeleteConfirmUser(user)}
      />

      {/* Pagination info */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Mostrando {users.length} de {pagination.total} usuários
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => updateFilters({ page: pagination.page - 1 })}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => updateFilters({ page: pagination.page + 1 })}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      {/* Form Modal */}
      <UserFormModal
        open={showFormModal}
        onOpenChange={setShowFormModal}
        user={editingUser}
        onSave={handleSave}
        isLoading={isCreating || isUpdating}
        onResendInvite={handleResendInvite}
        isResending={isResending}
        checkEmailUnique={checkEmailUnique}
        checkUsernameUnique={checkUsernameUnique}
      />

      {/* View User Dialog */}
      <Dialog open={!!viewingUser} onOpenChange={() => setViewingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
            <DialogDescription>Informações completas do usuário</DialogDescription>
          </DialogHeader>
          {viewingUser && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nome:</span>
                <span className="font-medium">{viewingUser.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span>{viewingUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Papel:</span>
                <Badge variant="secondary">{viewingUser.role}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Departamento:</span>
                <span>{viewingUser.department || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Telefone:</span>
                <span>{viewingUser.phone || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Criado em:</span>
                <span>{format(new Date(viewingUser.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={viewingUser.is_active !== false ? 'default' : 'secondary'}>
                  {viewingUser.is_active !== false ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirm */}
      <AlertDialog open={!!deactivateUser} onOpenChange={() => setDeactivateUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desativar <strong>{deactivateUser?.full_name}</strong>?
              O usuário perderá acesso ao sistema, mas poderá ser reativado depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeactivate}>Desativar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteConfirmUser} onOpenChange={() => setDeleteConfirmUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Permanentemente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir permanentemente <strong>{deleteConfirmUser?.full_name}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
