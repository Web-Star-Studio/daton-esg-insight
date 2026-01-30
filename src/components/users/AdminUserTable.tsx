import { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Eye, 
  Pencil, 
  KeyRound, 
  UserMinus, 
  UserPlus,
  Trash2, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { UserProfile, UserFilters } from '@/hooks/data/useUserManagement';
import { Skeleton } from '@/components/ui/skeleton';

interface AdminUserTableProps {
  users: UserProfile[];
  isLoading?: boolean;
  currentUserId?: string;
  filters: UserFilters;
  onSort: (column: UserFilters['orderBy']) => void;
  onView: (user: UserProfile) => void;
  onEdit: (user: UserProfile) => void;
  onResetPassword: (user: UserProfile) => void;
  onDeactivate: (user: UserProfile) => void;
  onReactivate: (user: UserProfile) => void;
  onDelete: (user: UserProfile) => void;
}

const ROLE_CONFIG: Record<string, { label: string; className: string }> = {
  platform_admin: { label: 'Platform Admin', className: 'bg-indigo-600 text-white' },
  super_admin: { label: 'Super Admin', className: 'bg-purple-500 text-white' },
  admin: { label: 'Admin', className: 'bg-destructive text-destructive-foreground' },
  manager: { label: 'Gerente', className: 'bg-blue-500 text-white' },
  analyst: { label: 'Analista', className: 'bg-green-500 text-white' },
  operator: { label: 'Operador', className: 'bg-yellow-500 text-white' },
  viewer: { label: 'Visualizador', className: 'bg-muted text-muted-foreground' },
  auditor: { label: 'Auditor', className: 'bg-orange-500 text-white' },
};

export function AdminUserTable({
  users,
  isLoading,
  currentUserId,
  filters,
  onSort,
  onView,
  onEdit,
  onResetPassword,
  onDeactivate,
  onReactivate,
  onDelete,
}: AdminUserTableProps) {
  const getSortIcon = (column: UserFilters['orderBy']) => {
    if (filters.orderBy !== column) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return filters.orderDir === 'asc' 
      ? <ArrowUp className="h-4 w-4" />
      : <ArrowDown className="h-4 w-4" />;
  };

  const SortableHeader = ({ 
    column, 
    children 
  }: { 
    column: UserFilters['orderBy']; 
    children: React.ReactNode 
  }) => (
    <TableHead>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 data-[state=open]:bg-accent"
        onClick={() => onSort(column)}
      >
        {children}
        {getSortIcon(column)}
      </Button>
    </TableHead>
  );

  const truncateId = (id: string) => {
    return `${id.slice(0, 8)}...`;
  };

  const getRoleDisplay = (role: string) => {
    const config = ROLE_CONFIG[role] || ROLE_CONFIG.viewer;
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (user: UserProfile) => {
    const isActive = user.is_active !== false && !user.deleted_at;
    return (
      <Badge variant={isActive ? 'default' : 'secondary'} className={isActive ? 'bg-green-500' : 'bg-muted'}>
        {isActive ? 'Ativo' : 'Inativo'}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="w-[70px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-8 w-8" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="w-[70px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                Nenhum usuário encontrado.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <SortableHeader column="full_name">Nome</SortableHeader>
            <SortableHeader column="email">Email</SortableHeader>
            <SortableHeader column="username">Username</SortableHeader>
            <SortableHeader column="role">Papel</SortableHeader>
            <TableHead>Status</TableHead>
            <SortableHeader column="created_at">Criado em</SortableHeader>
            <TableHead className="w-[70px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const isCurrentUser = user.id === currentUserId;
            const isActive = user.is_active !== false && !user.deleted_at;
            const isProtected = ['platform_admin', 'super_admin'].includes(user.role);

            return (
              <TableRow key={user.id} className={!isActive ? 'opacity-60' : ''}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {truncateId(user.id)}
                </TableCell>
                <TableCell className="font-medium">
                  {user.full_name}
                  {isCurrentUser && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Você
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell className="text-muted-foreground">
                  {user.username || '-'}
                </TableCell>
                <TableCell>{getRoleDisplay(user.role)}</TableCell>
                <TableCell>{getStatusBadge(user)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Abrir menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(user)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(user)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onResetPassword(user)}>
                        <KeyRound className="mr-2 h-4 w-4" />
                        Resetar Senha
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      {isActive ? (
                        <DropdownMenuItem 
                          onClick={() => onDeactivate(user)}
                          disabled={isCurrentUser || isProtected}
                          className="text-orange-600 focus:text-orange-600"
                        >
                          <UserMinus className="mr-2 h-4 w-4" />
                          Desativar
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem 
                          onClick={() => onReactivate(user)}
                          className="text-green-600 focus:text-green-600"
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Reativar
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuItem 
                        onClick={() => onDelete(user)}
                        disabled={isCurrentUser || isProtected}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir Permanentemente
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
