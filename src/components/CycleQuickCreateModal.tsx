import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useFormErrorValidation } from "@/hooks/useFormErrorValidation";
import { z } from "zod";

const cycleSchema = z.object({
  name: z.string().min(1, "Nome do ciclo é obrigatório"),
  evaluation_type: z.string().min(1, "Tipo de avaliação é obrigatório"),
  status: z.string().min(1, "Status é obrigatório"),
});

interface CycleQuickCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCycleCreated: (cycle: any) => void;
}

export function CycleQuickCreateModal({
  open,
  onOpenChange,
  onCycleCreated
}: CycleQuickCreateModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    evaluation_type: 'annual',
    status: 'active'
  });
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const { validate, hasFieldError, getFieldProps, renderLabel, clearErrors } = useFormErrorValidation(cycleSchema);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData & { start_date: string; end_date: string }) => {
        const { data: cycle, error } = await supabase
          .from('performance_evaluation_cycles')
          .insert({
            name: formData.name,
            evaluation_type: formData.evaluation_type,
            status: formData.status,
            start_date: format(startDate!, 'yyyy-MM-dd'),
            end_date: format(endDate!, 'yyyy-MM-dd'),
            company_id: '00000000-0000-0000-0000-000000000000' // Default company
          })
          .select()
          .single();

      if (error) throw error;
      return cycle;
    },
    onSuccess: (cycle) => {
      queryClient.invalidateQueries({ queryKey: ['evaluation-cycles'] });
      toast.success("Ciclo de avaliação criado com sucesso!");
      onCycleCreated(cycle);
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Erro ao criar ciclo:', error);
      toast.error("Erro ao criar ciclo de avaliação. Tente novamente.");
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      evaluation_type: 'annual',
      status: 'active'
    });
    setStartDate(undefined);
    setEndDate(undefined);
    clearErrors();
  };

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

    createMutation.mutate(cycleData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Criar Ciclo de Avaliação
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className={renderLabel('name', true).className}>
              {renderLabel('name', true).label("Nome do Ciclo")}
            </Label>
            <Input
              placeholder="Ex: Avaliação Anual 2024"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              {...getFieldProps('name')}
            />
            {hasFieldError('name') && (
              <p className="text-sm text-red-600">Nome do ciclo é obrigatório</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className={renderLabel('evaluation_type', true).className}>
                {renderLabel('evaluation_type', true).label("Tipo")}
              </Label>
              <Select
                value={formData.evaluation_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, evaluation_type: value }))}
              >
                <SelectTrigger {...getFieldProps('evaluation_type')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Anual</SelectItem>
                  <SelectItem value="semiannual">Semestral</SelectItem>
                  <SelectItem value="quarterly">Trimestral</SelectItem>
                  <SelectItem value="probation">Experiência</SelectItem>
                  <SelectItem value="special">Especial</SelectItem>
                </SelectContent>
              </Select>
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
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="planned">Planejado</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                </SelectContent>
              </Select>
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
                    {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
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
                    {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
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
              Criar Ciclo
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}