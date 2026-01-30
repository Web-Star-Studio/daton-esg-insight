import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  AtSign, 
  Shield, 
  Calendar, 
  Building, 
  Phone,
  Briefcase 
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { UserProfile } from '@/hooks/data/useUserManagement';

interface UserDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile | null;
}

const ROLE_LABELS: Record<string, string> = {
  platform_admin: 'Administrador da Plataforma',
  super_admin: 'Super Administrador',
  admin: 'Administrador',
  manager: 'Gerente',
  analyst: 'Analista',
  operator: 'Operador',
  viewer: 'Visualizador',
  auditor: 'Auditor',
};

export function UserDetailsDialog({
  open,
  onOpenChange,
  user,
}: UserDetailsDialogProps) {
  if (!user) return null;

  const isActive = user.is_active !== false && !user.deleted_at;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            Detalhes do Usuário
          </DialogTitle>
          <DialogDescription>
            Informações completas do usuário selecionado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header with status */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{user.full_name}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Badge variant={isActive ? 'default' : 'secondary'} className={isActive ? 'bg-green-500' : ''}>
              {isActive ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>

          <Separator />

          {/* Details Grid */}
          <div className="grid gap-4">
            <DetailItem
              icon={<Mail className="h-4 w-4" />}
              label="Email"
              value={user.email}
            />
            
            <DetailItem
              icon={<AtSign className="h-4 w-4" />}
              label="Username"
              value={user.username || 'Não definido'}
            />
            
            <DetailItem
              icon={<Shield className="h-4 w-4" />}
              label="Papel no Sistema"
              value={ROLE_LABELS[user.role] || user.role}
            />
            
            {user.department && (
              <DetailItem
                icon={<Briefcase className="h-4 w-4" />}
                label="Departamento"
                value={user.department}
              />
            )}
            
            {user.phone && (
              <DetailItem
                icon={<Phone className="h-4 w-4" />}
                label="Telefone"
                value={user.phone}
              />
            )}
            
            <DetailItem
              icon={<Calendar className="h-4 w-4" />}
              label="Criado em"
              value={format(new Date(user.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
            />

            <DetailItem
              icon={<Building className="h-4 w-4" />}
              label="ID do Usuário"
              value={
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                  {user.id}
                </code>
              }
            />
          </div>

          {/* Inactive info */}
          {!isActive && user.deleted_at && (
            <>
              <Separator />
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <p className="text-muted-foreground">
                  <strong>Desativado em:</strong>{' '}
                  {format(new Date(user.deleted_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailItem({ 
  icon, 
  label, 
  value 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}
