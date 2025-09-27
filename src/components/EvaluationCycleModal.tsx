import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  createEvaluationCycle,
  updateEvaluationCycle,
  type EvaluationCycle 
} from "@/services/employeePerformance";
import { toast } from "sonner";
import { useFormErrorValidation } from "@/hooks/useFormErrorValidation";
import { z } from "zod";

const cycleSchema = z.object({
  name: z.string().min(1, "Nome do ciclo é obrigatório"),
  evaluation_type: z.string().min(1, "Tipo de avaliação é obrigatório"),
  status: z.string().min(1, "Status é obrigatório"),
});

interface EvaluationCycleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cycleToEdit?: EvaluationCycle | null;
}

export function EvaluationCycleModal({ 
  open, 
  onOpenChange, 
  cycleToEdit 
}: EvaluationCycleModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    evaluation_type: 'annual',
    status: 'active'
  });

  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const isEditing = !!cycleToEdit;
  const { validate, hasFieldError, getFieldProps, renderLabel, clearErrors } = useFormErrorValidation(cycleSchema);

  // Create/Update mutation
  const createMutation = useMutation({
    mutationFn: createEvaluationCycle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluation-cycles'] });
      toast.success("Ciclo de avaliação criado com sucesso!");
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Erro ao criar ciclo:', error);
      toast.error("Erro ao criar ciclo de avaliação. Tente novamente.");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<EvaluationCycle> }) => 
      updateEvaluationCycle(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluation-cycles'] });
      toast.success("Ciclo de avaliação atualizado com sucesso!");
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Erro ao atualizar ciclo:', error);
      toast.error("Erro ao atualizar ciclo de avaliação. Tente novamente.");
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      evaluation_type: 'annual',
      status: 'active'
    });
    setStartDate(undefined);
    setEndDate(undefined);
    clearErrors();
  };

  useEffect(() => {
    if (open && cycleToEdit) {
      setFormData({
        name: cycleToEdit.name,
        description: cycleToEdit.description || '',
        evaluation_type: cycleToEdit.evaluation_type,
        status: cycleToEdit.status
      });
      setStartDate(new Date(cycleToEdit.start_date));
      setEndDate(new Date(cycleToEdit.end_date));
    } else if (open && !cycleToEdit) {
      resetForm();
    }
  }, [open, cycleToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validate(formData);
    if (!validation.isValid) return;
    
    if (!startDate || !endDate) {
      toast.error("Selecione as datas de início e fim");
      return;
    }

    if (startDate >= endDate) {
      toast.error("A data de início deve ser anterior à data de fim");
      return;
    }

    const cycleData = {
      ...formData,
      start_date: format(startDate, 'yyyy-MM-dd'),
      end_date: format(endDate, 'yyyy-MM-dd')
    };

    if (isEditing && cycleToEdit) {
      updateMutation.mutate({ 
        id: cycleToEdit.id, 
        updates: cycleData 
      });
    } else {
      createMutation.mutate(cycleData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Ciclo de Avaliação' : 'Novo Ciclo de Avaliação'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label className={renderLabel('name', true).className}>
              {renderLabel('name', true).label("Nome do Ciclo")}
            </Label>
            <Input
              id="name"
              placeholder="Ex: Avaliação Anual 2024"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              {...getFieldProps('name')}
            />
            {hasFieldError('name') && (
              <p className="text-sm text-red-600">Nome do ciclo é obrigatório</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva o objetivo e escopo deste ciclo de avaliação..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className={renderLabel('evaluation_type', true).className}>
                {renderLabel('evaluation_type', true).label("Tipo de Avaliação")}
              </Label>
              <Select
                value={formData.evaluation_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, evaluation_type: value }))}
              >
                <SelectTrigger {...getFieldProps('evaluation_type')}>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Anual</SelectItem>
                  <SelectItem value="semiannual">Semestral</SelectItem>
                  <SelectItem value="quarterly">Trimestral</SelectItem>
                  <SelectItem value="probation">Experiência</SelectItem>
                  <SelectItem value="special">Especial</SelectItem>
                </SelectContent>
              </Select>
              {hasFieldError('evaluation_type') && (
                <p className="text-sm text-red-600">Tipo de avaliação é obrigatório</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className={renderLabel('status', true).className}>
                {renderLabel('status', true).label("Status")}
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger {...getFieldProps('status')}>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="planned">Planejado</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              {hasFieldError('status') && (
                <p className="text-sm text-red-600">Status é obrigatório</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Início <span className="text-red-500">*</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data de Fim <span className="text-red-500">*</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
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
              disabled={isPending}
            >
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isPending ? 'Salvando...' : (isEditing ? 'Atualizar Ciclo' : 'Criar Ciclo')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}