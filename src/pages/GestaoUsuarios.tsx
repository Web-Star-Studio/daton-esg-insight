import { useState } from 'react';
import { useUserManagement } from '@/hooks/data/useUserManagement';
import { UserManagementHeader } from '@/components/users/UserManagementHeader';
import { UserStatsCards } from '@/components/users/UserStatsCards';
import { UserListTable } from '@/components/users/UserListTable';
import type { UserProfile } from '@/hooks/data/useUserManagement';

export default function GestaoUsuarios() {
  const { users, stats, usersLoading } = useUserManagement();
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const handleNewUser = () => {
    // TODO: Abrir modal de criação
    console.log('Criar novo usuário');
  };

  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user);
    // TODO: Abrir modal de edição
    console.log('Editar usuário:', user);
  };

  return (
    <div className="space-y-6">
      <UserManagementHeader onNewUser={handleNewUser} />
      <UserStatsCards stats={stats} />
      <UserListTable 
        users={users} 
        onEdit={handleEditUser}
        isLoading={usersLoading}
      />
    </div>
  );
}