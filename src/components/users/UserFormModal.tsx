import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserProfile } from "@/hooks/data/useUserManagement";
import { Loader2 } from "lucide-react";
import { logFormSubmission, logFormValidation, createPerformanceLogger } from '@/utils/formLogging';

const userFormSchema = z.object({
  full_name: z.string()
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z.string()
    .email("Email inválido")
    .max(255, "Email deve ter no máximo 255 caracteres"),
  role: z.union([
    z.literal('Admin'),
    z.literal('Gestor'),
    z.literal('Colaborador')
  ]),
  department: z.string().optional(),
  phone: z.string().optional(),
});

type UserFormData = z.infer<typeof userFormSchema>;

interface UserFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserProfile | null;
  onSave: (data: Partial<UserProfile>) => void;
  isLoading?: boolean;
}

export function UserFormModal({ open, onOpenChange, user, onSave, isLoading }: UserFormModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: user ? {
      full_name: user.full_name,
      email: user.email,
      role: user.role as 'Admin' | 'Gestor' | 'Colaborador',
      department: user.department || '',
      phone: user.phone || '',
    } : {
      role: 'Colaborador',
    },
  });

  const roleValue = watch('role');

  const onSubmit = (data: UserFormData) => {
    const perfLogger = createPerformanceLogger('UserFormSubmission');
    
    try {
      const errorMessages = Object.entries(errors).reduce((acc, [key, error]) => {
        if (error) acc[key] = error.message || 'Erro de validação';
        return acc;
      }, {} as Record<string, string>);
      
      logFormValidation('UserFormModal', Object.keys(errors).length === 0, errorMessages);
      
      onSave({
        ...data,
        id: user?.id,
      });
      
      logFormSubmission('UserFormModal', data, true, undefined, { userId: user?.id });
      perfLogger.end(true);
      reset();
    } catch (error) {
      logFormSubmission('UserFormModal', data, false, error, { userId: user?.id });
      perfLogger.end(false, error);
      throw error;
    }
  };

  const handleCancel = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {user ? 'Editar Usuário' : 'Novo Usuário'}
          </DialogTitle>
          <DialogDescription>
            {user 
              ? 'Atualize as informações do usuário abaixo.' 
              : 'Preencha os dados para criar um novo usuário no sistema.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nome Completo */}
          <div className="space-y-2">
            <Label htmlFor="full_name">
              Nome Completo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="full_name"
              placeholder="João Silva"
              {...register('full_name')}
              disabled={isLoading}
            />
            {errors.full_name && (
              <p className="text-sm text-destructive">{errors.full_name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="joao.silva@empresa.com"
              {...register('email')}
              disabled={isLoading || !!user}
            />
            {user && (
              <p className="text-xs text-muted-foreground">
                Email não pode ser alterado
              </p>
            )}
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {/* Papel/Role */}
          <div className="space-y-2">
            <Label htmlFor="role">
              Papel no Sistema <span className="text-destructive">*</span>
            </Label>
            <Select
              value={roleValue}
              onValueChange={(value) => setValue('role', value as any)}
              disabled={isLoading}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Selecione o papel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Admin</span>
                    <span className="text-xs text-muted-foreground">
                      Acesso total ao sistema
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="Gestor">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Gestor</span>
                    <span className="text-xs text-muted-foreground">
                      Gerencia equipes e processos
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="Colaborador">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Colaborador</span>
                    <span className="text-xs text-muted-foreground">
                      Acesso básico às funcionalidades
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role.message}</p>
            )}
          </div>

          {/* Departamento */}
          <div className="space-y-2">
            <Label htmlFor="department">Departamento</Label>
            <Input
              id="department"
              placeholder="Ex: Sustentabilidade, Qualidade"
              {...register('department')}
              disabled={isLoading}
            />
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              placeholder="(11) 99999-9999"
              {...register('phone')}
              disabled={isLoading}
            />
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {user ? 'Salvar Alterações' : 'Criar Usuário'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
