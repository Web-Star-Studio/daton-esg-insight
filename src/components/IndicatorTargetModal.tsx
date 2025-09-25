import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, Target, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateTarget, useIndicatorTargets } from '@/services/indicatorTargets';
import { useQualityIndicator } from '@/services/qualityIndicators';

const targetSchema = z.object({
  target_value: z.number({ required_error: 'Meta é obrigatória' }).min(0, 'Meta deve ser positiva'),
  upper_limit: z.number().optional(),
  lower_limit: z.number().optional(),
  critical_upper_limit: z.number().optional(),
  critical_lower_limit: z.number().optional(),
  valid_from: z.date({ required_error: 'Data de início é obrigatória' }),
  valid_until: z.date().optional(),
});

type TargetFormData = z.infer<typeof targetSchema>;

interface IndicatorTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicatorId: string;
}

export const IndicatorTargetModal: React.FC<IndicatorTargetModalProps> = ({
  isOpen,
  onClose,
  indicatorId,
}) => {
  const { data: indicator } = useQualityIndicator(indicatorId);
  const { data: targets } = useIndicatorTargets(indicatorId);
  const createTarget = useCreateTarget();

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<TargetFormData>({
    resolver: zodResolver(targetSchema),
    defaultValues: {
      valid_from: new Date(),
    }
  });

  const validFrom = watch('valid_from');
  const validUntil = watch('valid_until');
  const targetValue = watch('target_value');
  const upperLimit = watch('upper_limit');
  const lowerLimit = watch('lower_limit');
  const criticalUpperLimit = watch('critical_upper_limit');
  const criticalLowerLimit = watch('critical_lower_limit');

  const onSubmit = async (data: TargetFormData) => {
    try {
      await createTarget.mutateAsync({
        indicator_id: indicatorId,
        target_value: data.target_value,
        upper_limit: data.upper_limit,
        lower_limit: data.lower_limit,
        critical_upper_limit: data.critical_upper_limit,
        critical_lower_limit: data.critical_lower_limit,
        valid_from: format(data.valid_from, 'yyyy-MM-dd'),
        valid_until: data.valid_until ? format(data.valid_until, 'yyyy-MM-dd') : undefined,
      });

      reset();
      onClose();
    } catch (error) {
      console.error('Erro ao criar meta:', error);
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Definir Meta e Limites de Controle</DialogTitle>
          <DialogDescription>
            Configure metas e limites para: <strong>{indicator.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário de Nova Meta */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Nova Meta
                </CardTitle>
                <CardDescription>
                  Defina uma nova meta e seus limites de controle
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Meta Principal */}
                <div className="space-y-2">
                  <Label htmlFor="target_value">
                    Meta * ({indicator.measurement_unit})
                  </Label>
                  <Input
                    id="target_value"
                    type="number"
                    step="0.01"
                    {...register('target_value', { valueAsNumber: true })}
                    placeholder={`Valor da meta em ${indicator.measurement_unit}`}
                  />
                  {errors.target_value && (
                    <p className="text-sm text-destructive">{errors.target_value.message}</p>
                  )}
                </div>

                {/* Período de Validade */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data de Início *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !validFrom && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {validFrom ? (
                            format(validFrom, "PPP", { locale: ptBR })
                          ) : (
                            <span>Selecione a data</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={validFrom}
                          onSelect={(date) => setValue('valid_from', date || new Date())}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.valid_from && (
                      <p className="text-sm text-destructive">{errors.valid_from.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Data de Fim (opcional)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !validUntil && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {validUntil ? (
                            format(validUntil, "PPP", { locale: ptBR })
                          ) : (
                            <span>Indefinido</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={validUntil}
                          onSelect={(date) => setValue('valid_until', date)}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Limites de Alerta */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-warning" />
                    <Label className="text-base font-medium">Limites de Alerta</Label>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="upper_limit">Limite Superior</Label>
                      <Input
                        id="upper_limit"
                        type="number"
                        step="0.01"
                        {...register('upper_limit', { valueAsNumber: true })}
                        placeholder="Limite de atenção superior"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lower_limit">Limite Inferior</Label>
                      <Input
                        id="lower_limit"
                        type="number"
                        step="0.01"
                        {...register('lower_limit', { valueAsNumber: true })}
                        placeholder="Limite de atenção inferior"
                      />
                    </div>
                  </div>
                </div>

                {/* Limites Críticos */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-destructive" />
                    <Label className="text-base font-medium">Limites Críticos</Label>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="critical_upper_limit">Crítico Superior</Label>
                      <Input
                        id="critical_upper_limit"
                        type="number"
                        step="0.01"
                        {...register('critical_upper_limit', { valueAsNumber: true })}
                        placeholder="Limite crítico superior"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="critical_lower_limit">Crítico Inferior</Label>
                      <Input
                        id="critical_lower_limit"
                        type="number"
                        step="0.01"
                        {...register('critical_lower_limit', { valueAsNumber: true })}
                        placeholder="Limite crítico inferior"
                      />
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  Os limites de alerta disparam notificações de atenção, enquanto os limites críticos disparam alertas de ação imediata.
                </p>
              </CardContent>
            </Card>

            {/* Botões de Ação */}
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createTarget.isPending}>
                {createTarget.isPending ? 'Criando...' : 'Definir Meta'}
              </Button>
            </div>
          </form>

          {/* Histórico de Metas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Histórico de Metas</CardTitle>
              <CardDescription>
                Metas anteriores e atuais do indicador
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {targets?.map((target) => (
                  <div
                    key={target.id}
                    className={cn(
                      "p-4 border rounded-lg",
                      target.is_active && "border-primary bg-primary/5"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        <span className="font-medium">
                          Meta: {target.target_value} {indicator.measurement_unit}
                        </span>
                      </div>
                      {target.is_active && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                          Ativa
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>
                        Período: {format(new Date(target.valid_from), 'dd/MM/yyyy')} - {' '}
                        {target.valid_until ? format(new Date(target.valid_until), 'dd/MM/yyyy') : 'Indefinido'}
                      </div>
                      
                      {(target.upper_limit || target.lower_limit) && (
                        <div>
                          Limites de Alerta: {target.lower_limit || '∞'} ↔ {target.upper_limit || '∞'}
                        </div>
                      )}
                      
                      {(target.critical_upper_limit || target.critical_lower_limit) && (
                        <div>
                          Limites Críticos: {target.critical_lower_limit || '∞'} ↔ {target.critical_upper_limit || '∞'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {targets?.length === 0 && (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhuma meta definida</h3>
                    <p className="text-muted-foreground">
                      Defina a primeira meta para este indicador
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};