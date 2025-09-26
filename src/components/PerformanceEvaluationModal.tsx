import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
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
import { toast } from "@/hooks/use-toast";

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
      toast({
        title: "Sucesso",
        description: "Avaliação criada com sucesso!"
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Erro ao criar avaliação:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar avaliação. Tente novamente.",
        variant: "destructive"
      });
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
    
    if (!formData.employee_id || !formData.evaluator_id || !periodStart || !periodEnd) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee_id">Funcionário Avaliado *</Label>
              <Select
                value={formData.employee_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, employee_id: value }))}
                required
              >
                <SelectTrigger>
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
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="evaluator_id">Avaliador *</Label>
            <Select
              value={formData.evaluator_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, evaluator_id: value }))}
              required
            >
              <SelectTrigger>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Início do Período *</Label>
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
              <Label>Fim do Período *</Label>
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
              {createMutation.isPending ? 'Criando...' : 'Criar Avaliação'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}