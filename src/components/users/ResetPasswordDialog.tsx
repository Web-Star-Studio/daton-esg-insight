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
import { KeyRound, Loader2, Mail } from 'lucide-react';
import type { UserProfile } from '@/hooks/data/useUserManagement';

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile | null;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ResetPasswordDialog({
  open,
  onOpenChange,
  user,
  onConfirm,
  isLoading,
}: ResetPasswordDialogProps) {
  if (!user) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <KeyRound className="h-5 w-5 text-primary" />
            </div>
            <AlertDialogTitle>Resetar Senha</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3">
            <p>
              Você está prestes a enviar um link de recuperação de senha para:
            </p>
            <div className="rounded-lg bg-muted p-3">
              <p className="font-medium">{user.full_name}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {user.email}
              </p>
            </div>
            <p className="text-sm">
              O usuário receberá um email com um link para definir uma nova senha. 
              O link expira em <strong>24 horas</strong>.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm} 
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                Enviar Link
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
