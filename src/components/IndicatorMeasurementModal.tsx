import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateMeasurement, useQualityIndicator } from '@/services/qualityIndicators';

const measurementSchema = z.object({
  measurement_date: z.date({
    message: 'Data da medição é obrigatória'
  }),
  measured_value: z.number({
    message: 'Valor medido é obrigatório'
  }),
  measurement_period_start: z.date().optional(),
  measurement_period_end: z.date().optional(),
  data_source_reference: z.string()
    .trim()
    .max(255, 'Referência deve ter no máximo 255 caracteres')
    .optional(),
  notes: z.string()
    .trim()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .optional(),
}).refine(
  data => !data.measurement_period_start || !data.measurement_period_end || 
    data.measurement_period_end >= data.measurement_period_start,
  {
    message: 'Data final deve ser posterior à data inicial',
    path: ['measurement_period_end']
  }
);

type MeasurementFormData = z.infer<typeof measurementSchema>;

interface IndicatorMeasurementModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicatorId: string;
}

export const IndicatorMeasurementModal: React.FC<IndicatorMeasurementModalProps> = ({
  isOpen,
  onClose,
  indicatorId,
}) => {
  const { data: indicator } = useQualityIndicator(indicatorId);
  const createMeasurement = useCreateMeasurement();

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<MeasurementFormData>({
    resolver: zodResolver(measurementSchema),
    defaultValues: {
      measurement_date: new Date(),
    }
  });

  const measurementDate = watch('measurement_date');
  const periodStart = watch('measurement_period_start');
  const periodEnd = watch('measurement_period_end');

  const onSubmit = async (data: MeasurementFormData) => {
    try {
      // Sanitizar dados
      const sanitizedData = {
        indicator_id: indicatorId,
        measurement_date: format(data.measurement_date, 'yyyy-MM-dd'),
        measured_value: data.measured_value,
        measurement_period_start: data.measurement_period_start 
          ? format(data.measurement_period_start, 'yyyy-MM-dd') 
          : undefined,
        measurement_period_end: data.measurement_period_end 
          ? format(data.measurement_period_end, 'yyyy-MM-dd') 
          : undefined,
        data_source_reference: data.data_source_reference?.trim() || null,
        notes: data.notes?.trim() || null,
        status: 'valid' as const,
      };
      
      await createMeasurement.mutateAsync(sanitizedData);

      reset();
      onClose();
    } catch (error: any) {
      console.error('Erro ao registrar medição:', error);
      // O erro já é tratado pelo useCreateMeasurement com toast
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!indicator) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar Medição</DialogTitle>
          <DialogDescription>
            Registre uma nova medição para: <strong>{indicator.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Informações do Indicador */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Categoria:</span> {indicator.category}
              </div>
              <div>
                <span className="font-medium">Unidade:</span> {indicator.measurement_unit}
              </div>
              <div>
                <span className="font-medium">Frequência:</span> {indicator.frequency}
              </div>
              <div>
                <span className="font-medium">Tipo:</span> {indicator.measurement_type}
              </div>
            </div>
          </div>

          {/* Data da Medição */}
          <div className="space-y-2">
            <Label>Data da Medição *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !measurementDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {measurementDate ? (
                    format(measurementDate, "PPP", { locale: ptBR })
                  ) : (
                    <span>Selecione a data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={measurementDate}
                  onSelect={(date) => setValue('measurement_date', date || new Date())}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            {errors.measurement_date && (
              <p className="text-sm text-destructive">{errors.measurement_date.message}</p>
            )}
          </div>

          {/* Valor Medido */}
          <div className="space-y-2">
            <Label htmlFor="measured_value">Valor Medido * ({indicator.measurement_unit})</Label>
            <Input
              id="measured_value"
              type="number"
              step="0.01"
              {...register('measured_value', { valueAsNumber: true })}
              placeholder={`Valor em ${indicator.measurement_unit}`}
            />
            {errors.measured_value && (
              <p className="text-sm text-destructive">{errors.measured_value.message}</p>
            )}
          </div>

          {/* Período de Medição (opcional) */}
          {indicator.frequency !== 'daily' && (
            <div className="space-y-4">
              <Label>Período de Medição (opcional)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Início do Período</Label>
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
                        {periodStart ? (
                          format(periodStart, "PPP", { locale: ptBR })
                        ) : (
                          <span>Data inicial</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={periodStart}
                        onSelect={(date) => setValue('measurement_period_start', date)}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Fim do Período</Label>
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
                        {periodEnd ? (
                          format(periodEnd, "PPP", { locale: ptBR })
                        ) : (
                          <span>Data final</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={periodEnd}
                        onSelect={(date) => setValue('measurement_period_end', date)}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          )}

          {/* Fonte dos Dados */}
          <div className="space-y-2">
            <Label htmlFor="data_source_reference">Referência da Fonte de Dados</Label>
            <Input
              id="data_source_reference"
              {...register('data_source_reference')}
              placeholder="Ex: Relatório #123, Planilha 2024-01"
            />
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Observações sobre a medição, contexto, condições especiais..."
              rows={3}
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMeasurement.isPending}>
              {createMeasurement.isPending ? 'Registrando...' : 'Registrar Medição'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};