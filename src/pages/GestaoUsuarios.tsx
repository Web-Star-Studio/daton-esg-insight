import { useState } from 'react';
import { useUserManagement } from '@/hooks/data/useUserManagement';
import { UserManagementHeader } from '@/components/users/UserManagementHeader';
import { UserStatsCards } from '@/components/users/UserStatsCards';
import { UserListTable } from '@/components/users/UserListTable';
import { UserFormModal } from '@/components/users/UserFormModal';
import type { UserProfile } from '@/hooks/data/useUserManagement';

export default function GestaoUsuarios() {
  const { 
    users, 
    stats, 
    usersLoading, 
    createUser, 
    updateUser,
    isCreating,
    isUpdating 
  } = useUserManagement();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const handleNewUser = () => {
    setSelectedUser(null);
    setModalOpen(true);
  };

  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user);
    setModalOpen(true);
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

  return (
    <>
      <div className="space-y-6">
        <UserManagementHeader onNewUser={handleNewUser} />
        <UserStatsCards stats={stats} />
        <UserListTable 
          users={users} 
          onEdit={handleEditUser}
          isLoading={usersLoading}
        />
      </div>

      <UserFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        user={selectedUser}
        onSave={handleSaveUser}
        isLoading={isCreating || isUpdating}
      />
    </>
  );
}