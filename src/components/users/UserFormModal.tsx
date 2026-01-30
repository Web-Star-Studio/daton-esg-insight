import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserProfile } from "@/hooks/data/useUserManagement";
import { Loader2, Mail, UserPlus, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { logFormSubmission, logFormValidation, createPerformanceLogger } from '@/utils/formLogging';

// System roles with correct values
const SYSTEM_ROLES = [
  { value: 'admin', label: 'Administrador', description: 'Acesso total à empresa, gerencia usuários' },
  { value: 'manager', label: 'Gestor', description: 'Gerencia equipes e processos' },
  { value: 'analyst', label: 'Analista', description: 'Acesso a análises e relatórios avançados' },
  { value: 'operator', label: 'Operador', description: 'Cadastro e entrada de dados' },
  { value: 'viewer', label: 'Visualizador', description: 'Apenas visualização (leitura)' },
  { value: 'auditor', label: 'Auditor', description: 'Acesso de auditoria e logs' },
] as const;

const userFormSchema = z.object({
  full_name: z.string()
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z.string()
    .email("Email inválido")
    .max(255, "Email deve ter no máximo 255 caracteres"),
  username: z.string()
    .optional()
    .refine((val) => !val || /^[a-zA-Z0-9_-]{3,30}$/.test(val), {
      message: "Username deve ter 3-30 caracteres (letras, números, _ e -)"
    }),
  role: z.enum(['admin', 'manager', 'analyst', 'operator', 'viewer', 'auditor']),
  department: z.string().optional(),
  phone: z.string().optional(),
  is_active: z.boolean().optional(),
});

type UserFormData = z.infer<typeof userFormSchema>;

interface UserFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserProfile | null;
  onSave: (data: Partial<UserProfile>) => void;
  isLoading?: boolean;
  onResendInvite?: (user: UserProfile) => void;
  isResending?: boolean;
  checkEmailUnique?: (email: string, excludeId?: string) => Promise<boolean>;
  checkUsernameUnique?: (username: string, excludeId?: string) => Promise<boolean>;
}

export function UserFormModal({ 
  open, 
  onOpenChange, 
  user, 
  onSave, 
  isLoading, 
  onResendInvite, 
  isResending,
  checkEmailUnique,
  checkUsernameUnique,
}: UserFormModalProps) {
  const isEditing = !!user;
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
    getValues,
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      full_name: '',
      email: '',
      username: '',
      role: 'viewer',
      department: '',
      phone: '',
      is_active: true,
    },
  });

  // Reset form when modal opens or user changes
  useEffect(() => {
    if (open) {
      setEmailStatus('idle');
      setUsernameStatus('idle');
      setEmailError(null);
      setUsernameError(null);
      
      if (user) {
        reset({
          full_name: user.full_name || '',
          email: user.email || '',
          username: user.username || '',
          role: (user.role as UserFormData['role']) || 'viewer',
          department: user.department || '',
          phone: user.phone || '',
          is_active: user.is_active !== false,
        });
      } else {
        reset({
          full_name: '',
          email: '',
          username: '',
          role: 'viewer',
          department: '',
          phone: '',
          is_active: true,
        });
      }
    }
  }, [user, open, reset]);

  const roleValue = watch('role');
  const isActiveValue = watch('is_active');

  // Check email uniqueness on blur
  const handleEmailBlur = async () => {
    if (!checkEmailUnique) return;
    
    const email = getValues('email');
    if (!email || errors.email) return;
    
    setEmailStatus('checking');
    setEmailError(null);
    
    try {
      const isUnique = await checkEmailUnique(email, user?.id);
      if (isUnique) {
        setEmailStatus('valid');
      } else {
        setEmailStatus('invalid');
        setEmailError('Este email já está em uso');
      }
    } catch {
      setEmailStatus('idle');
    }
  };

  // Check username uniqueness on blur
  const handleUsernameBlur = async () => {
    if (!checkUsernameUnique) return;
    
    const username = getValues('username');
    if (!username) {
      setUsernameStatus('idle');
      return;
    }
    
    if (errors.username) return;
    
    setUsernameStatus('checking');
    setUsernameError(null);
    
    try {
      const isUnique = await checkUsernameUnique(username, user?.id);
      if (isUnique) {
        setUsernameStatus('valid');
      } else {
        setUsernameStatus('invalid');
        setUsernameError('Este username já está em uso');
      }
    } catch {
      setUsernameStatus('idle');
    }
  };

  const onSubmit = (data: UserFormData) => {
    // Prevent submission if email/username validation failed
    if (emailStatus === 'invalid' || usernameStatus === 'invalid') {
      return;
    }
    
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

  const getValidationIcon = (status: 'idle' | 'checking' | 'valid' | 'invalid') => {
    switch (status) {
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'invalid':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? (
              <>
                <UserPlus className="h-5 w-5" />
                Editar Usuário
              </>
            ) : (
              <>
                <Mail className="h-5 w-5" />
                Convidar Novo Usuário
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Atualize as informações do usuário abaixo.' 
              : 'Preencha os dados para enviar um convite por email. O usuário receberá um link para definir sua senha.'}
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
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="joao.silva@empresa.com"
                {...register('email')}
                onBlur={handleEmailBlur}
                disabled={isLoading || isEditing}
                className="pr-8"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                {getValidationIcon(emailStatus)}
              </div>
            </div>
            {isEditing && (
              <p className="text-xs text-muted-foreground">
                Email não pode ser alterado
              </p>
            )}
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
            {emailError && (
              <p className="text-sm text-destructive">{emailError}</p>
            )}
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <Input
                id="username"
                placeholder="joao.silva"
                {...register('username')}
                onBlur={handleUsernameBlur}
                disabled={isLoading}
                className="pr-8"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                {getValidationIcon(usernameStatus)}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Opcional. Apenas letras, números, _ e - (3-30 caracteres)
            </p>
            {errors.username && (
              <p className="text-sm text-destructive">{errors.username.message}</p>
            )}
            {usernameError && (
              <p className="text-sm text-destructive">{usernameError}</p>
            )}
          </div>

          {/* Papel/Role */}
          <div className="space-y-2">
            <Label htmlFor="role">
              Papel no Sistema <span className="text-destructive">*</span>
            </Label>
            <Select
              value={roleValue}
              onValueChange={(value) => setValue('role', value as UserFormData['role'])}
              disabled={isLoading}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Selecione o papel" />
              </SelectTrigger>
              <SelectContent>
                {SYSTEM_ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{role.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {role.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role.message}</p>
            )}
          </div>

          {/* Status (apenas em edição) */}
          {isEditing && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="is_active">Status do Usuário</Label>
                <p className="text-xs text-muted-foreground">
                  {isActiveValue ? 'Usuário ativo e pode acessar o sistema' : 'Usuário desativado'}
                </p>
              </div>
              <Switch
                id="is_active"
                checked={isActiveValue}
                onCheckedChange={(checked) => setValue('is_active', checked)}
                disabled={isLoading}
              />
            </div>
          )}

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

          {/* Info box for new users */}
          {!isEditing && (
            <div className="bg-muted/50 border rounded-lg p-3 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Um email de convite será enviado para o usuário definir sua senha.
              </p>
            </div>
          )}

          {/* Ações */}
          <div className="flex justify-between pt-4">
            <div>
              {isEditing && onResendInvite && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onResendInvite(user!)}
                  disabled={isLoading || isResending}
                >
                  {isResending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Reenviar Convite
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || emailStatus === 'invalid' || usernameStatus === 'invalid'}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Salvar Alterações' : 'Enviar Convite'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
