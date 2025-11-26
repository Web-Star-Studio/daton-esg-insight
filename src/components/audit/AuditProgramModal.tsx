import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { useAuditProgram } from "@/hooks/useAuditProgram";
import { AuditProgram } from "@/services/auditProgram";
import { useEffect } from "react";

interface AuditProgramModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program?: AuditProgram | null;
}

interface FormData {
  title: string;
  year: number;
  objectives: string;
  scope_description: string;
  start_date: string;
  end_date: string;
  resources_budget: number;
}

export function AuditProgramModal({ open, onOpenChange, program }: AuditProgramModalProps) {
  const { createProgram, updateProgram, isCreating, isUpdating } = useAuditProgram();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  useEffect(() => {
    if (program) {
      reset({
        title: program.title,
        year: program.year,
        objectives: program.objectives || '',
        scope_description: program.scope_description || '',
        start_date: program.start_date,
        end_date: program.end_date,
        resources_budget: program.resources_budget || 0,
      });
    } else {
      reset({
        title: '',
        year: new Date().getFullYear(),
        objectives: '',
        scope_description: '',
        start_date: '',
        end_date: '',
        resources_budget: 0,
      });
    }
  }, [program, reset, open]);

  const onSubmit = (data: FormData) => {
    if (program) {
      updateProgram({ id: program.id, updates: data });
    } else {
      createProgram(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {program ? 'Editar Programa de Auditoria' : 'Novo Programa de Auditoria'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Título do Programa *</Label>
              <Input
                id="title"
                {...register('title', { required: 'Título é obrigatório' })}
                placeholder="Programa de Auditoria 2024"
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Ano *</Label>
              <Input
                id="year"
                type="number"
                {...register('year', {
                  required: 'Ano é obrigatório',
                  valueAsNumber: true,
                })}
                placeholder="2024"
              />
              {errors.year && (
                <p className="text-sm text-destructive">{errors.year.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start_date">Data de Início *</Label>
              <Input
                id="start_date"
                type="date"
                {...register('start_date', { required: 'Data de início é obrigatória' })}
              />
              {errors.start_date && (
                <p className="text-sm text-destructive">{errors.start_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Data de Término *</Label>
              <Input
                id="end_date"
                type="date"
                {...register('end_date', { required: 'Data de término é obrigatória' })}
              />
              {errors.end_date && (
                <p className="text-sm text-destructive">{errors.end_date.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resources_budget">Orçamento de Recursos (R$)</Label>
            <Input
              id="resources_budget"
              type="number"
              step="0.01"
              {...register('resources_budget', { valueAsNumber: true })}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="objectives">Objetivos do Programa</Label>
            <Textarea
              id="objectives"
              {...register('objectives')}
              placeholder="Descreva os objetivos do programa de auditoria..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="scope_description">Descrição do Escopo</Label>
            <Textarea
              id="scope_description"
              {...register('scope_description')}
              placeholder="Descreva o escopo do programa de auditoria..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isCreating || isUpdating}>
              {program ? 'Atualizar' : 'Criar'} Programa
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
