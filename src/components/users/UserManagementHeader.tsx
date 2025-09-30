import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UserManagementHeaderProps {
  onNewUser: () => void;
}

export const UserManagementHeader = ({ onNewUser }: UserManagementHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Usuários</h1>
        <p className="text-muted-foreground">
          Gerencie usuários, permissões e controle de acesso ao sistema
        </p>
      </div>
      <Button onClick={onNewUser}>
        <UserPlus className="mr-2 h-4 w-4" />
        Novo Usuário
      </Button>
    </div>
  );
};
