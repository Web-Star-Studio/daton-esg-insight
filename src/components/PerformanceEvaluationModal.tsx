import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  createPerformanceEvaluation, 
  getEmployeesForEvaluation, 
  getEvaluationCycles,
  type PerformanceEvaluation 
} from "@/services/employeePerformance";
import { toast } from "sonner";
import { EmployeeQuickCreateModal } from "./EmployeeQuickCreateModal";
import { CycleQuickCreateModal } from "./CycleQuickCreateModal";
import { useFormErrorValidation } from "@/hooks/useFormErrorValidation";
import { z } from "zod";

const evaluationSchema = z.object({
  employee_id: z.string().min(1, "Funcionário é obrigatório"),
  evaluator_id: z.string().min(1, "Avaliador é obrigatório"),
});

interface PerformanceEvaluationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evaluationToEdit?: PerformanceEvaluation | null;
}

export function PerformanceEvaluationModal({ 
  open, 
  onOpenChange, 
  evaluationToEdit 
}: PerformanceEvaluationModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    cycle_id: '',
    employee_id: '',
    evaluator_id: '',
    period_start: '',
    period_end: '',
    comments: ''
  });

  const [periodStart, setPeriodStart] = useState<Date | undefined>();
  const [periodEnd, setPeriodEnd] = useState<Date | undefined>();
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);

  const { validate, hasFieldError, getFieldProps, renderLabel, clearErrors } = useFormErrorValidation(evaluationSchema);

  // Fetch employees and cycles
  const { data: employees = [] } = useQuery({
    queryKey: ['employees-for-evaluation'],
    queryFn: getEmployeesForEvaluation,
    enabled: open
  });

  const { data: cycles = [] } = useQuery({
    queryKey: ['evaluation-cycles'],
    queryFn: getEvaluationCycles,
    enabled: open
  });

  // Create/Update mutation
  const createMutation = useMutation({
    mutationFn: createPerformanceEvaluation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance-evaluations'] });
      toast.success("Avaliação criada com sucesso!");
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Erro ao criar avaliação:', error);
      toast.error("Erro ao criar avaliação. Tente novamente.");
    }
  });

  const resetForm = () => {
    setFormData({
      cycle_id: '',
      employee_id: '',
      evaluator_id: '',
      period_start: '',
      period_end: '',
      comments: ''
    });
    setPeriodStart(undefined);
    setPeriodEnd(undefined);
    clearErrors();
  };

  useEffect(() => {
    if (open && evaluationToEdit) {
      setFormData({
        cycle_id: evaluationToEdit.cycle_id || '',
        employee_id: evaluationToEdit.employee_id,
        evaluator_id: evaluationToEdit.evaluator_id,
        period_start: evaluationToEdit.period_start,
        period_end: evaluationToEdit.period_end,
        comments: evaluationToEdit.comments || ''
      });
      setPeriodStart(new Date(evaluationToEdit.period_start));
      setPeriodEnd(new Date(evaluationToEdit.period_end));
    }
  }, [open, evaluationToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validate(formData);
    if (!validation.isValid) return;
    
    if (!periodStart || !periodEnd) {
      toast.error("Selecione as datas de início e fim do período");
      return;
    }

    if (periodStart >= periodEnd) {
      toast.error("A data de início deve ser anterior à data de fim");
      return;
    }

    const evaluationData = {
      ...formData,
      period_start: format(periodStart, 'yyyy-MM-dd'),
      period_end: format(periodEnd, 'yyyy-MM-dd'),
      status: 'pending',
      self_evaluation_completed: false,
      manager_evaluation_completed: false,
      final_review_completed: false
    };

    createMutation.mutate(evaluationData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {evaluationToEdit ? 'Editar Avaliação' : 'Nova Avaliação de Desempenho'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cycle_id">Ciclo de Avaliação</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.cycle_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, cycle_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um ciclo (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {cycles.map((cycle) => (
                      <SelectItem key={cycle.id} value={cycle.id}>
                        {cycle.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsCycleModalOpen(true)}
                  title="Criar novo ciclo"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{renderLabel('employee_id', true)("Funcionário Avaliado")}</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.employee_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, employee_id: value }))}
                >
                  <SelectTrigger {...getFieldProps('employee_id')}>
                    <SelectValue placeholder="Selecione o funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.full_name} - {employee.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsEmployeeModalOpen(true)}
                  title="Criar novo funcionário"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {hasFieldError('employee_id') && (
                <p className="text-sm text-red-600">Funcionário é obrigatório</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>{renderLabel('evaluator_id', true)("Avaliador")}</Label>
            <Select
              value={formData.evaluator_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, evaluator_id: value }))}
            >
              <SelectTrigger {...getFieldProps('evaluator_id')}>
                <SelectValue placeholder="Selecione o avaliador" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.full_name} - {employee.position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFieldError('evaluator_id') && (
              <p className="text-sm text-red-600">Avaliador é obrigatório</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Início do Período <span className="text-red-500">*</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !periodStart && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {periodStart ? format(periodStart, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={periodStart}
                    onSelect={setPeriodStart}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Fim do Período <span className="text-red-500">*</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !periodEnd && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {periodEnd ? format(periodEnd, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={periodEnd}
                    onSelect={setPeriodEnd}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments">Comentários Iniciais</Label>
            <Textarea
              id="comments"
              placeholder="Adicione comentários sobre o período de avaliação..."
              value={formData.comments}
              onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3">
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
              {createMutation.isPending ? 'Criando...' : 'Criar Avaliação'}
            </Button>
          </div>
        </form>

        {/* Quick Create Modals */}
        <EmployeeQuickCreateModal
          open={isEmployeeModalOpen}
          onOpenChange={setIsEmployeeModalOpen}
          onEmployeeCreated={(employee) => {
            setFormData(prev => ({ ...prev, employee_id: employee.id }));
          }}
        />

        <CycleQuickCreateModal
          open={isCycleModalOpen}
          onOpenChange={setIsCycleModalOpen}
          onCycleCreated={(cycle) => {
            setFormData(prev => ({ ...prev, cycle_id: cycle.id }));
          }}
        />
      </DialogContent>
    </Dialog>
  );
}