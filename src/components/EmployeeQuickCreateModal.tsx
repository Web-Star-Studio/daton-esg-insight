import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useFormErrorValidation } from "@/hooks/useFormErrorValidation";
import { z } from "zod";
import { getUserAndCompany } from "@/utils/auth";
import { supabase } from "@/integrations/supabase/client";
import { formatCPF, validateCPF } from "@/utils/formValidation";

const employeeSchema = z.object({
  cpf: z.string().min(14, "CPF é obrigatório").refine(val => validateCPF(val), "CPF inválido"),
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
    cpf: '',
    full_name: '',
    position: '',
    department: '',
    email: '',
    employment_type: 'CLT',
    status: 'Ativo'
  });

  const { validate, hasFieldError, getFieldProps, renderLabel, clearErrors } = useFormErrorValidation(employeeSchema);

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
          employee_code: null,
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
      } else if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('cpf')) {
        toast.error("CPF já cadastrado", {
          description: "Este CPF já está vinculado a outro funcionário.",
        });
      } else {
        toast.error("Erro ao criar funcionário. Tente novamente.");
      }
    }
  });

  const resetForm = () => {
    setFormData({
      cpf: '',
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
    
    const validation = validate(formData);
    if (!validation.isValid) return;

    createMutation.mutate(formData);
  };

  const isPending = createMutation.isPending;

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
              <Label className={renderLabel('cpf', true).className}>
                {renderLabel('cpf', true).label("CPF")}
              </Label>
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChange={(e) => setFormData(prev => ({ ...prev, cpf: formatCPF(e.target.value) }))}
                maxLength={14}
                {...getFieldProps('cpf')}
              />
              {hasFieldError('cpf') && (
                <p className="text-sm text-red-600">CPF é obrigatório e deve ser válido</p>
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
              disabled={isPending}
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
