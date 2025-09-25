import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateIndicator } from '@/services/qualityIndicators';
import { useEmployeesAsOptions } from '@/services/employees';

const indicatorSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  description: z.string().optional(),
  category: z.string().min(1, 'Categoria é obrigatória'),
  measurement_unit: z.string().min(1, 'Unidade de medida é obrigatória'),
  measurement_type: z.enum(['manual', 'automatic', 'calculated']),
  calculation_formula: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly']),
  responsible_user_id: z.string().optional(),
  data_source: z.string().optional(),
  collection_method: z.string().optional(),
  target_value: z.number().min(0, 'Meta deve ser positiva'),
  upper_limit: z.number().optional(),
  lower_limit: z.number().optional(),
  critical_upper_limit: z.number().optional(),
  critical_lower_limit: z.number().optional(),
});

type IndicatorFormData = z.infer<typeof indicatorSchema>;

interface IndicatorCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  'Qualidade do Produto',
  'Satisfação do Cliente',
  'Processos Internos',
  'Produtividade',
  'Eficiência',
  'Conformidade',
  'Segurança',
  'Meio Ambiente',
  'Financeiro',
  'Outros'
];

const MEASUREMENT_UNITS = [
  '%', // Percentual
  'unidades',
  'horas',
  'dias',
  'kg',
  'litros',
  'peças',
  'defeitos',
  'reclamações',
  'índice',
  'pontos',
  'reais',
  'tempo',
  'outros'
];

export const IndicatorCreationModal: React.FC<IndicatorCreationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { data: employeeOptions } = useEmployeesAsOptions();
  const createIndicator = useCreateIndicator();

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<IndicatorFormData>({
    resolver: zodResolver(indicatorSchema),
    defaultValues: {
      measurement_type: 'manual',
      frequency: 'monthly',
    }
  });

  const measurementType = watch('measurement_type');

  const onSubmit = async (data: IndicatorFormData) => {
    try {
      // Separar dados do indicador e da meta
      const { target_value, upper_limit, lower_limit, critical_upper_limit, critical_lower_limit, ...indicatorData } = data;
      
      // Criar o indicador primeiro
      const indicator = await createIndicator.mutateAsync({
        ...indicatorData,
        is_active: true,
        created_by_user_id: '' // será preenchido pelo serviço
      });
      
      // TODO: Criar a meta do indicador
      // Isso seria feito em um serviço separado para targets
      
      reset();
      onClose();
    } catch (error) {
      console.error('Erro ao criar indicador:', error);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Indicador de Qualidade</DialogTitle>
          <DialogDescription>
            Configure um novo indicador para monitoramento da qualidade conforme ISO 9001
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Básicas</CardTitle>
              <CardDescription>
                Defina as características principais do indicador
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Indicador *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="Ex: Taxa de Defeitos por Milhão"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <Select onValueChange={(value) => setValue('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-destructive">{errors.category.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Descreva o objetivo e importância deste indicador"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="measurement_unit">Unidade de Medida *</Label>
                  <Select onValueChange={(value) => setValue('measurement_unit', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {MEASUREMENT_UNITS.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.measurement_unit && (
                    <p className="text-sm text-destructive">{errors.measurement_unit.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="measurement_type">Tipo de Medição *</Label>
                  <Select onValueChange={(value) => setValue('measurement_type', value as 'manual' | 'automatic' | 'calculated')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de medição" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="automatic">Automática</SelectItem>
                      <SelectItem value="calculated">Calculada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequência *</Label>
                  <Select onValueChange={(value) => setValue('frequency', value as 'daily' | 'weekly' | 'monthly' | 'quarterly')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Frequência de coleta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diária</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {measurementType === 'calculated' && (
                <div className="space-y-2">
                  <Label htmlFor="calculation_formula">Fórmula de Cálculo</Label>
                  <Input
                    id="calculation_formula"
                    {...register('calculation_formula')}
                    placeholder="Ex: (Defeitos / Total Produzido) * 1000000"
                  />
                  <p className="text-sm text-muted-foreground">
                    Defina a fórmula para cálculo automático do indicador
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Responsabilidade e Fonte de Dados */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Responsabilidade e Dados</CardTitle>
              <CardDescription>
                Configure quem é responsável e como os dados são coletados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="responsible_user_id">Responsável</Label>
                  <Select onValueChange={(value) => setValue('responsible_user_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o responsável" />
                    </SelectTrigger>
                    <SelectContent>
                      {employeeOptions?.map((employee) => (
                        <SelectItem key={employee.value} value={employee.value}>
                          {employee.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_source">Fonte dos Dados</Label>
                  <Input
                    id="data_source"
                    {...register('data_source')}
                    placeholder="Ex: Sistema ERP, Planilha de Controle"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="collection_method">Método de Coleta</Label>
                <Textarea
                  id="collection_method"
                  {...register('collection_method')}
                  placeholder="Descreva como os dados devem ser coletados"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Metas e Limites */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Metas e Limites de Controle</CardTitle>
              <CardDescription>
                Defina a meta e os limites para alertas automáticos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="target_value">Meta *</Label>
                  <Input
                    id="target_value"
                    type="number"
                    step="0.01"
                    {...register('target_value', { valueAsNumber: true })}
                    placeholder="Valor da meta"
                  />
                  {errors.target_value && (
                    <p className="text-sm text-destructive">{errors.target_value.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="upper_limit">Limite Superior de Alerta</Label>
                  <Input
                    id="upper_limit"
                    type="number"
                    step="0.01"
                    {...register('upper_limit', { valueAsNumber: true })}
                    placeholder="Limite de atenção superior"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lower_limit">Limite Inferior de Alerta</Label>
                  <Input
                    id="lower_limit"
                    type="number"
                    step="0.01"
                    {...register('lower_limit', { valueAsNumber: true })}
                    placeholder="Limite de atenção inferior"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="critical_upper_limit">Limite Crítico Superior</Label>
                  <Input
                    id="critical_upper_limit"
                    type="number"
                    step="0.01"
                    {...register('critical_upper_limit', { valueAsNumber: true })}
                    placeholder="Limite crítico superior"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="critical_lower_limit">Limite Crítico Inferior</Label>
                  <Input
                    id="critical_lower_limit"
                    type="number"
                    step="0.01"
                    {...register('critical_lower_limit', { valueAsNumber: true })}
                    placeholder="Limite crítico inferior"
                  />
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
            <Button type="submit" disabled={createIndicator.isPending}>
              {createIndicator.isPending ? 'Criando...' : 'Criar Indicador'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};