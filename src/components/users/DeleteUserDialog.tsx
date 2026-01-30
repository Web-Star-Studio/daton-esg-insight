import { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertTriangle, Loader2, UserMinus, Trash2 } from 'lucide-react';
import type { UserProfile } from '@/hooks/data/useUserManagement';

type DeleteType = 'soft' | 'hard';

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserProfile | null;
  onSoftDelete: (reason?: string) => void;
  onHardDelete: (reason?: string) => void;
  isSoftDeleting?: boolean;
  isHardDeleting?: boolean;
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  user,
  onSoftDelete,
  onHardDelete,
  isSoftDeleting,
  isHardDeleting,
}: DeleteUserDialogProps) {
  const [deleteType, setDeleteType] = useState<DeleteType>('soft');
  const [reason, setReason] = useState('');
  const [confirmStep, setConfirmStep] = useState(1);

  const isLoading = isSoftDeleting || isHardDeleting;
  const isActive = user?.is_active !== false && !user?.deleted_at;

  const handleClose = () => {
    setDeleteType('soft');
    setReason('');
    setConfirmStep(1);
    onOpenChange(false);
  };

  const handleConfirm = () => {
    // If user is active and we're on step 1, require extra confirmation
    if (isActive && confirmStep === 1) {
      setConfirmStep(2);
      return;
    }

    if (deleteType === 'soft') {
      onSoftDelete(reason || undefined);
    } else {
      onHardDelete(reason || undefined);
    }
    handleClose();
  };

  if (!user) return null;

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              {deleteType === 'soft' ? (
                <UserMinus className="h-5 w-5 text-orange-500" />
              ) : (
                <Trash2 className="h-5 w-5 text-destructive" />
              )}
            </div>
            <AlertDialogTitle>
              {confirmStep === 2 ? 'Confirmação Adicional' : 'Remover Usuário'}
            </AlertDialogTitle>
          </div>

          {confirmStep === 1 ? (
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  Selecione o tipo de remoção para o usuário:
                </p>
                
                <div className="rounded-lg bg-muted p-3">
                  <p className="font-medium">{user.full_name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  {isActive && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      Usuário Ativo
                    </span>
                  )}
                </div>

                <RadioGroup 
                  value={deleteType} 
                  onValueChange={(v) => setDeleteType(v as DeleteType)}
                  className="space-y-3"
                >
                  <div className="flex items-start space-x-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50">
                    <RadioGroupItem value="soft" id="soft" className="mt-1" />
                    <Label htmlFor="soft" className="cursor-pointer flex-1">
                      <div className="font-medium flex items-center gap-2">
                        <UserMinus className="h-4 w-4 text-orange-500" />
                        Desativar (Soft Delete)
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        O usuário será desativado mas seus dados serão mantidos. Pode ser reativado posteriormente.
                      </p>
                    </Label>
                  </div>
                  
                  <div className="flex items-start space-x-3 rounded-lg border border-destructive/30 p-3 cursor-pointer hover:bg-destructive/5">
                    <RadioGroupItem value="hard" id="hard" className="mt-1" />
                    <Label htmlFor="hard" className="cursor-pointer flex-1">
                      <div className="font-medium flex items-center gap-2 text-destructive">
                        <Trash2 className="h-4 w-4" />
                        Excluir Permanentemente (Hard Delete)
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        O usuário e todos os seus dados serão removidos permanentemente. Esta ação é irreversível.
                      </p>
                    </Label>
                  </div>
                </RadioGroup>

                <div className="space-y-2">
                  <Label htmlFor="reason">Motivo (opcional)</Label>
                  <Input
                    id="reason"
                    placeholder="Informe o motivo da remoção..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
              </div>
            </AlertDialogDescription>
          ) : (
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-lg bg-destructive/10 p-4 text-destructive">
                  <AlertTriangle className="h-5 w-5 mt-0.5" />
                  <div>
                    <p className="font-medium">Atenção: Usuário Ativo!</p>
                    <p className="text-sm mt-1">
                      Este usuário está <strong>atualmente ativo</strong> no sistema. 
                      Tem certeza que deseja {deleteType === 'soft' ? 'desativá-lo' : 'excluí-lo permanentemente'}?
                    </p>
                  </div>
                </div>
                
                <div className="rounded-lg bg-muted p-3">
                  <p className="font-medium">{user.full_name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>

                <p className="text-sm text-muted-foreground">
                  {deleteType === 'soft' 
                    ? 'O usuário perderá acesso imediato ao sistema, mas poderá ser reativado.'
                    : 'Todos os dados serão removidos permanentemente. Esta ação NÃO pode ser desfeita.'}
                </p>
              </div>
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Cancelar
          </AlertDialogCancel>
          
          {confirmStep === 1 && isActive && (
            <Button
              onClick={() => setConfirmStep(2)}
              variant={deleteType === 'hard' ? 'destructive' : 'default'}
              className="gap-2"
            >
              Continuar
            </Button>
          )}
          
          {(confirmStep === 2 || !isActive) && (
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={isLoading}
              className={`gap-2 ${deleteType === 'hard' ? 'bg-destructive hover:bg-destructive/90' : ''}`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : deleteType === 'soft' ? (
                <>
                  <UserMinus className="h-4 w-4" />
                  Desativar Usuário
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Excluir Permanentemente
                </>
              )}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
