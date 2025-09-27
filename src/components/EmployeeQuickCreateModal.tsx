import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useFormErrorValidation } from "@/hooks/useFormErrorValidation";
import { z } from "zod";

const employeeSchema = z.object({
  full_name: z.string().min(1, "Nome completo é obrigatório"),
  position: z.string().min(1, "Cargo é obrigatório"),
  department: z.string().min(1, "Departamento é obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
});

interface EmployeeQuickCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmployeeCreated: (employee: any) => void;
}

export function EmployeeQuickCreateModal({
  open,
  onOpenChange,
  onEmployeeCreated
}: EmployeeQuickCreateModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    full_name: '',
    position: '',
    department: '',
    email: ''
  });

  const { validate, hasFieldError, getFieldProps, renderLabel, clearErrors } = useFormErrorValidation(employeeSchema);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
        const { data: employee, error } = await supabase
          .from('employees')
          .insert({
            full_name: formData.full_name,
            position: formData.position,
            department: formData.department,
            status: 'Ativo',
            email: formData.email || null,
            employee_code: `EMP-${Date.now()}`,
            hire_date: new Date().toISOString().split('T')[0],
            company_id: '00000000-0000-0000-0000-000000000000' // Default company
          })
          .select()
          .single();

      if (error) throw error;
      return employee;
    },
    onSuccess: (employee) => {
      queryClient.invalidateQueries({ queryKey: ['employees-for-evaluation'] });
      toast.success("Funcionário criado com sucesso!");
      onEmployeeCreated(employee);
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Erro ao criar funcionário:', error);
      toast.error("Erro ao criar funcionário. Tente novamente.");
    }
  });

  const resetForm = () => {
    setFormData({
      full_name: '',
      position: '',
      department: '',
      email: ''
    });
    clearErrors();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validate(formData);
    if (!validation.isValid) return;

    createMutation.mutate(formData);
  };

  const departments = [
    'Administração', 'Recursos Humanos', 'Financeiro', 'Vendas', 
    'Marketing', 'TI', 'Produção', 'Qualidade', 'Logística'
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Criar Funcionário Rapidamente
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome Completo <span className="text-red-500">*</span></Label>
            <Input
              placeholder="Digite o nome completo"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              {...getFieldProps('full_name')}
            />
            {hasFieldError('full_name') && (
              <p className="text-sm text-red-600">Nome completo é obrigatório</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Cargo <span className="text-red-500">*</span></Label>
            <Input
              placeholder="Ex: Analista, Gerente, Coordenador"
              value={formData.position}
              onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
              {...getFieldProps('position')}
            />
            {hasFieldError('position') && (
              <p className="text-sm text-red-600">Cargo é obrigatório</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Departamento <span className="text-red-500">*</span></Label>
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
            <Label>Email (Opcional)</Label>
            <Input
              type="email"
              placeholder="email@empresa.com"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              {...getFieldProps('email')}
            />
            {hasFieldError('email') && (
              <p className="text-sm text-red-600">Email inválido</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Funcionário
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}