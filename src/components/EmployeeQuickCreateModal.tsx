import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Check, X, Wand2, AlertCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useFormErrorValidation } from "@/hooks/useFormErrorValidation";
import { z } from "zod";
import { getUserAndCompany } from "@/utils/auth";
import { supabase } from "@/integrations/supabase/client";
import { useEmployeeCodeValidation } from "@/hooks/useEmployeeCodeValidation";
import { generateNextEmployeeCode } from "@/services/employeeCodeGenerator";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const employeeSchema = z.object({
  employee_code: z.string().min(1, "Código do funcionário é obrigatório"),
  full_name: z.string().min(1, "Nome completo é obrigatório"),
  position: z.string().min(1, "Cargo é obrigatório"),
  department: z.string().min(1, "Departamento é obrigatório"),
  email: z.string().email("E-mail inválido").optional().or(z.literal('')),
});

interface EmployeeQuickCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmployeeCreated?: (employee: any) => void;
}

export function EmployeeQuickCreateModal({ 
  open, 
  onOpenChange, 
  onEmployeeCreated 
}: EmployeeQuickCreateModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    employee_code: '',
    full_name: '',
    position: '',
    department: '',
    email: '',
    employment_type: 'CLT',
    status: 'Ativo'
  });
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  const { validate, hasFieldError, getFieldProps, renderLabel, clearErrors } = useFormErrorValidation(employeeSchema);
  const codeValidation = useEmployeeCodeValidation(formData.employee_code, companyId);

  // Get company_id when modal opens
  useEffect(() => {
    const fetchCompanyId = async () => {
      try {
        const userWithCompany = await getUserAndCompany();
        setCompanyId(userWithCompany?.company_id || null);
      } catch (error) {
        console.error('Error fetching company:', error);
      }
    };

    if (open) {
      fetchCompanyId();
    }
  }, [open]);

  const createMutation = useMutation({
    mutationFn: async (employeeData: any) => {
      const userWithCompany = await getUserAndCompany();
      if (!userWithCompany?.company_id) {
        throw new Error('Usuário não autenticado ou empresa não encontrada');
      }

      const { data, error } = await supabase
        .from('employees')
        .insert([{
          ...employeeData,
          company_id: userWithCompany.company_id,
          hire_date: new Date().toISOString().split('T')[0]
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (newEmployee) => {
      queryClient.invalidateQueries({ queryKey: ['employees-for-evaluation'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success("Funcionário criado com sucesso!");
      onEmployeeCreated?.(newEmployee);
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error('Erro ao criar funcionário:', error);
      if (error.message?.includes('não autenticado')) {
        toast.error("Erro de autenticação. Faça login novamente.");
      } else if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('employee_code')) {
        toast.error("Código já existe", {
          description: codeValidation.suggestedCode 
            ? `Tente usar: ${codeValidation.suggestedCode}` 
            : "Use um código diferente ou gere automaticamente.",
        });
      } else {
        toast.error("Erro ao criar funcionário. Tente novamente.");
      }
    }
  });

  const resetForm = () => {
    setFormData({
      employee_code: '',
      full_name: '',
      position: '',
      department: '',
      email: '',
      employment_type: 'CLT',
      status: 'Ativo'
    });
    clearErrors();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if code is available
    if (codeValidation.exists) {
      toast.error("Código já existe", {
        description: codeValidation.suggestedCode 
          ? `Use: ${codeValidation.suggestedCode}` 
          : "Escolha outro código ou gere automaticamente.",
      });
      return;
    }

    const validation = validate(formData);
    if (!validation.isValid) return;

    createMutation.mutate(formData);
  };

  const handleGenerateCode = async () => {
    if (!companyId) {
      toast.error("Erro ao gerar código. Reabra o modal.");
      return;
    }

    setIsGeneratingCode(true);
    try {
      const newCode = await generateNextEmployeeCode(companyId);
      setFormData(prev => ({ ...prev, employee_code: newCode }));
      toast.success(`Código gerado: ${newCode}`);
    } catch (error) {
      console.error('Error generating code:', error);
      toast.error("Erro ao gerar código automaticamente.");
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleUseSuggestedCode = () => {
    if (codeValidation.suggestedCode) {
      setFormData(prev => ({ ...prev, employee_code: codeValidation.suggestedCode! }));
    }
  };

  const isPending = createMutation.isPending;
  const isCodeValid = !codeValidation.exists && formData.employee_code.length > 0;
  const canSubmit = isCodeValid && !codeValidation.isChecking && !isPending;

  const departments = [
    'Administração', 'Recursos Humanos', 'Financeiro', 'Vendas', 
    'Marketing', 'TI', 'Produção', 'Qualidade', 'Logística'
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo Funcionário</DialogTitle>
          <DialogDescription>
            Preencha os dados para cadastrar um novo funcionário
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className={renderLabel('employee_code', true).className}>
                  {renderLabel('employee_code', true).label("Código do Funcionário")}
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateCode}
                        disabled={isGeneratingCode}
                        className="h-7 px-2"
                      >
                        {isGeneratingCode ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Wand2 className="h-3 w-3" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Gerar código automaticamente</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="relative">
                <Input
                  id="employee_code"
                  placeholder="Ex: EMP001"
                  value={formData.employee_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, employee_code: e.target.value }))}
                  className={
                    formData.employee_code.length > 0
                      ? codeValidation.exists
                        ? "border-red-500 pr-8"
                        : "border-green-500 pr-8"
                      : ""
                  }
                  {...getFieldProps('employee_code')}
                />
                {formData.employee_code.length > 0 && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    {codeValidation.isChecking ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : codeValidation.exists ? (
                      <X className="h-4 w-4 text-red-500" />
                    ) : (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                )}
              </div>
              {hasFieldError('employee_code') && (
                <p className="text-sm text-red-600">Código do funcionário é obrigatório</p>
              )}
              {formData.employee_code.length > 0 && !codeValidation.isChecking && (
                <div className="flex items-center gap-2">
                  {codeValidation.exists ? (
                    <>
                      <Badge variant="destructive" className="text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Código já existe
                      </Badge>
                      {codeValidation.suggestedCode && (
                        <Button
                          type="button"
                          variant="link"
                          size="sm"
                          onClick={handleUseSuggestedCode}
                          className="h-auto p-0 text-xs"
                        >
                          Usar: {codeValidation.suggestedCode}
                        </Button>
                      )}
                    </>
                  ) : (
                    <Badge variant="default" className="text-xs bg-green-500">
                      <Check className="h-3 w-3 mr-1" />
                      Disponível
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className={renderLabel('full_name', true).className}>
                {renderLabel('full_name', true).label("Nome Completo")}
              </Label>
              <Input
                id="full_name"
                placeholder="Nome completo do funcionário"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                {...getFieldProps('full_name')}
              />
              {hasFieldError('full_name') && (
                <p className="text-sm text-red-600">Nome completo é obrigatório</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@empresa.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employment_type">Tipo de Contrato</Label>
              <Select 
                value={formData.employment_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, employment_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLT">CLT</SelectItem>
                  <SelectItem value="PJ">PJ</SelectItem>
                  <SelectItem value="Estágio">Estágio</SelectItem>
                  <SelectItem value="Terceirizado">Terceirizado</SelectItem>
                  <SelectItem value="Temporário">Temporário</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className={renderLabel('department', true).className}>
                {renderLabel('department', true).label("Departamento")}
              </Label>
              <Select
                value={formData.department}
                onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
              >
                <SelectTrigger {...getFieldProps('department')}>
                  <SelectValue placeholder="Selecione o departamento" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasFieldError('department') && (
                <p className="text-sm text-red-600">Departamento é obrigatório</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className={renderLabel('position', true).className}>
                {renderLabel('position', true).label("Cargo")}
              </Label>
              <Input
                id="position"
                placeholder="Ex: Analista de Sistemas"
                value={formData.position}
                onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                {...getFieldProps('position')}
              />
              {hasFieldError('position') && (
                <p className="text-sm text-red-600">Cargo é obrigatório</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
                <SelectItem value="Afastado">Afastado</SelectItem>
                <SelectItem value="Demitido">Demitido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
            >
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isPending ? 'Criando...' : 'Criar Funcionário'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}