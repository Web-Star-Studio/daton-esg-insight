import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCreateSuccessionPlan } from "@/services/careerDevelopment";
import { useEmployees } from "@/services/employeeService";
import { useAuth } from "@/contexts/AuthContext";

const successionPlanSchema = z.object({
  position_title: z.string().trim().min(1, "Cargo/posição é obrigatório").max(200, "Título muito longo"),
  department: z.string().min(1, "Departamento é obrigatório"),
  current_holder_id: z.string().uuid("ID do ocupante inválido").nullable().optional(),
  critical_level: z.string().min(1, "Nível crítico é obrigatório"),
  expected_retirement_date: z.string().nullable().optional(),
  company_id: z.string().uuid("ID da empresa inválido"),
  created_by_user_id: z.string().uuid("ID do usuário inválido"),
});

type SuccessionPlanFormData = z.infer<typeof successionPlanSchema>;

interface SuccessionPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SuccessionPlanModal = ({ isOpen, onClose, onSuccess }: SuccessionPlanModalProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const createSuccessionPlan = useCreateSuccessionPlan();
  const { data: employees } = useEmployees();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    trigger,
  } = useForm<SuccessionPlanFormData>({
    resolver: zodResolver(successionPlanSchema),
    defaultValues: {
      position_title: "",
      department: "",
      critical_level: "",
      current_holder_id: null,
      expected_retirement_date: null,
      company_id: user?.company?.id || "",
      created_by_user_id: user?.id || "",
    },
  });

  const onSubmit = async (data: SuccessionPlanFormData) => {
    try {
      // Normalizar dados
      const normalizedData = {
        ...data,
        current_holder_id: data.current_holder_id || null,
        expected_retirement_date: data.expected_retirement_date?.trim() || null,
      };
      
      console.log("Enviando plano de sucessão:", normalizedData);
      await createSuccessionPlan.mutateAsync(normalizedData);
      
      toast({
        title: "Sucesso!",
        description: "Plano de sucessão criado com sucesso.",
      });
      reset();
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao criar plano:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar plano de sucessão. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Plano de Sucessão</DialogTitle>
          <DialogDescription>
            Crie um plano de sucessão para identificar e preparar candidatos para posições críticas
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="position_title">Cargo/Posição *</Label>
              <Input
                id="position_title"
                {...register("position_title")}
                placeholder="Ex: Diretor de Operações"
              />
              {errors.position_title && (
                <p className="text-sm text-destructive mt-1">{errors.position_title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="department">Departamento *</Label>
              <Select
                onValueChange={(value) => {
                  setValue("department", value);
                  trigger("department");
                }}
                value={watch("department")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                  <SelectItem value="Recursos Humanos">Recursos Humanos</SelectItem>
                  <SelectItem value="Financeiro">Financeiro</SelectItem>
                  <SelectItem value="Operações">Operações</SelectItem>
                  <SelectItem value="Comercial">Comercial</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Atendimento">Atendimento</SelectItem>
                  <SelectItem value="Administrativo">Administrativo</SelectItem>
                </SelectContent>
              </Select>
              {errors.department && (
                <p className="text-sm text-destructive mt-1">{errors.department.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="critical_level">Nível Crítico *</Label>
              <Select
                onValueChange={(value) => {
                  setValue("critical_level", value);
                  trigger("critical_level");
                }}
                value={watch("critical_level")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o nível crítico" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alto">Alto - Impacto crítico no negócio</SelectItem>
                  <SelectItem value="Médio">Médio - Impacto moderado</SelectItem>
                  <SelectItem value="Baixo">Baixo - Impacto reduzido</SelectItem>
                </SelectContent>
              </Select>
              {errors.critical_level && (
                <p className="text-sm text-destructive mt-1">{errors.critical_level.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="current_holder_id">Ocupante Atual (Opcional)</Label>
              <Select
                onValueChange={(value) => {
                  setValue("current_holder_id", value === "none" ? null : value);
                  trigger("current_holder_id");
                }}
                value={watch("current_holder_id") || "none"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ocupante atual" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum (posição vaga)</SelectItem>
                  {employees?.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.full_name} - {emp.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.current_holder_id && (
                <p className="text-sm text-destructive mt-1">{errors.current_holder_id.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="expected_retirement_date">Data Prevista de Desocupação (Opcional)</Label>
              <Input
                id="expected_retirement_date"
                type="date"
                {...register("expected_retirement_date")}
              />
              {errors.expected_retirement_date && (
                <p className="text-sm text-destructive mt-1">{errors.expected_retirement_date.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createSuccessionPlan.isPending}>
              {createSuccessionPlan.isPending ? "Criando..." : "Criar Plano"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
