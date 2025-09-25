import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Plus, X, HelpCircle, Users, Settings, Wrench, Factory, ChevronDown } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const rootCauseSchema = z.object({
  deviation_description: z.string().min(1, 'Descrição do desvio é obrigatória'),
  five_whys: z.array(
    z.object({
      why: z.string().min(1, 'Pergunta é obrigatória'),
      answer: z.string().min(1, 'Resposta é obrigatória'),
    })
  ).min(1, 'Pelo menos um "Por quê?" deve ser preenchido'),
  ishikawa_causes: z.object({
    method: z.array(z.string()).optional(),
    machine: z.array(z.string()).optional(),
    material: z.array(z.string()).optional(),
    manpower: z.array(z.string()).optional(),
    measurement: z.array(z.string()).optional(),
    environment: z.array(z.string()).optional(),
  }),
  root_cause_identified: z.string().min(1, 'Causa raiz identificada é obrigatória'),
  corrective_actions: z.array(
    z.object({
      action: z.string().min(1, 'Ação é obrigatória'),
      responsible: z.string().min(1, 'Responsável é obrigatório'),
      deadline: z.string().min(1, 'Prazo é obrigatório'),
      priority: z.enum(['low', 'medium', 'high', 'critical']),
    })
  ),
  preventive_actions: z.array(
    z.object({
      action: z.string().min(1, 'Ação é obrigatória'),
      responsible: z.string().min(1, 'Responsável é obrigatório'),
      deadline: z.string().min(1, 'Prazo é obrigatório'),
      priority: z.enum(['low', 'medium', 'high', 'critical']),
    })
  ),
});

type RootCauseFormData = z.infer<typeof rootCauseSchema>;

interface RootCauseAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicatorId: string;
  measurementId?: string;
  deviationDescription?: string;
}

const ISHIKAWA_CATEGORIES = [
  { key: 'method', label: 'Método', icon: Settings, color: 'bg-blue-100 text-blue-800' },
  { key: 'machine', label: 'Máquina', icon: Factory, color: 'bg-gray-100 text-gray-800' },
  { key: 'material', label: 'Material', icon: Wrench, color: 'bg-green-100 text-green-800' },
  { key: 'manpower', label: 'Mão de Obra', icon: Users, color: 'bg-purple-100 text-purple-800' },
  { key: 'measurement', label: 'Medição', icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-800' },
  { key: 'environment', label: 'Meio Ambiente', icon: HelpCircle, color: 'bg-red-100 text-red-800' },
];

const PRIORITY_COLORS = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const PRIORITY_LABELS = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  critical: 'Crítica',
};

export const RootCauseAnalysisModal: React.FC<RootCauseAnalysisModalProps> = ({
  isOpen,
  onClose,
  indicatorId,
  measurementId,
  deviationDescription = '',
}) => {
  const [newCause, setNewCause] = useState<{ [key: string]: string }>({});

  const { register, handleSubmit, control, watch, setValue, formState: { errors }, reset } = useForm<RootCauseFormData>({
    resolver: zodResolver(rootCauseSchema),
    defaultValues: {
      deviation_description: deviationDescription,
      five_whys: [{ why: 'Por que o desvio ocorreu?', answer: '' }],
      ishikawa_causes: {
        method: [],
        machine: [],
        material: [],
        manpower: [],
        measurement: [],
        environment: [],
      },
      corrective_actions: [],
      preventive_actions: [],
    }
  });

  const { fields: whyFields, append: appendWhy, remove: removeWhy } = useFieldArray({
    control,
    name: 'five_whys',
  });

  const { fields: correctiveFields, append: appendCorrective, remove: removeCorrective } = useFieldArray({
    control,
    name: 'corrective_actions',
  });

  const { fields: preventiveFields, append: appendPreventive, remove: removePreventive } = useFieldArray({
    control,
    name: 'preventive_actions',
  });

  const ishikawaCauses = watch('ishikawa_causes');

  const addCauseToCategory = (category: string) => {
    const cause = newCause[category];
    if (!cause?.trim()) return;

    const currentCauses = ishikawaCauses[category as keyof typeof ishikawaCauses] || [];
    const updatedCauses = [...currentCauses, cause.trim()];
    
    setValue('ishikawa_causes', {
      ...ishikawaCauses,
      [category]: updatedCauses
    });
    
    setNewCause({ ...newCause, [category]: '' });
  };

  const removeCauseFromCategory = (category: string, index: number) => {
    const currentCauses = ishikawaCauses[category as keyof typeof ishikawaCauses] || [];
    const updatedCauses = currentCauses.filter((_, i) => i !== index);
    
    setValue('ishikawa_causes', {
      ...ishikawaCauses,
      [category]: updatedCauses
    });
  };

  const onSubmit = async (data: RootCauseFormData) => {
    try {
      console.log('Análise de Causa Raiz:', data);
      // TODO: Integrar com API para salvar análise
      reset();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar análise:', error);
    }
  };

  const handleClose = () => {
    reset();
    setNewCause({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Análise de Causa Raiz</DialogTitle>
          <DialogDescription>
            Utilize os métodos 5 Porquês e Diagrama de Ishikawa para identificar a causa raiz do desvio
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Descrição do Desvio */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Descrição do Desvio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="deviation_description">Descreva o desvio identificado *</Label>
                <Textarea
                  id="deviation_description"
                  {...register('deviation_description')}
                  placeholder="Descreva detalhadamente o desvio observado no indicador..."
                  rows={3}
                />
                {errors.deviation_description && (
                  <p className="text-sm text-destructive">{errors.deviation_description.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="five-whys" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="five-whys">5 Porquês</TabsTrigger>
              <TabsTrigger value="ishikawa">Ishikawa</TabsTrigger>
              <TabsTrigger value="root-cause">Causa Raiz</TabsTrigger>
              <TabsTrigger value="actions">Planos de Ação</TabsTrigger>
            </TabsList>

            {/* 5 Porquês */}
            <TabsContent value="five-whys">
              <Card>
                <CardHeader>
                  <CardTitle>Método dos 5 Porquês</CardTitle>
                  <CardDescription>
                    Faça perguntas sucessivas "Por quê?" para chegar à causa raiz
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {whyFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                      <div className="space-y-2">
                        <Label>Por quê? #{index + 1}</Label>
                        <Input
                          {...register(`five_whys.${index}.why`)}
                          placeholder="Formule a pergunta..."
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Resposta</Label>
                          {index > 0 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeWhy(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <Textarea
                          {...register(`five_whys.${index}.answer`)}
                          placeholder="Responda baseado em fatos e evidências..."
                          rows={2}
                        />
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => appendWhy({ why: `Por que ${whyFields[whyFields.length - 1]?.answer || 'isso aconteceu'}?`, answer: '' })}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Próximo "Por quê?"
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Diagrama de Ishikawa */}
            <TabsContent value="ishikawa">
              <Card>
                <CardHeader>
                  <CardTitle>Diagrama de Ishikawa (Espinha de Peixe)</CardTitle>
                  <CardDescription>
                    Categorize as possíveis causas do problema nos 6Ms
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ISHIKAWA_CATEGORIES.map((category) => {
                      const Icon = category.icon;
                      const causes = ishikawaCauses[category.key as keyof typeof ishikawaCauses] || [];

                      return (
                        <Card key={category.key}>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {category.label}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {/* Causas existentes */}
                            <div className="space-y-2">
                              {causes.map((cause, index) => (
                                <div key={index} className="flex items-center justify-between text-sm">
                                  <span className="flex-1">{cause}</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeCauseFromCategory(category.key, index)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>

                            {/* Adicionar nova causa */}
                            <div className="flex gap-2">
                              <Input
                                value={newCause[category.key] || ''}
                                onChange={(e) => setNewCause({ ...newCause, [category.key]: e.target.value })}
                                placeholder="Nova causa..."
                                className="text-sm"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addCauseToCategory(category.key);
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addCauseToCategory(category.key)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Causa Raiz Identificada */}
            <TabsContent value="root-cause">
              <Card>
                <CardHeader>
                  <CardTitle>Causa Raiz Identificada</CardTitle>
                  <CardDescription>
                    Com base nas análises anteriores, identifique a causa raiz principal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="root_cause_identified">Causa Raiz Principal *</Label>
                    <Textarea
                      id="root_cause_identified"
                      {...register('root_cause_identified')}
                      placeholder="Descreva a causa raiz identificada após as análises..."
                      rows={4}
                    />
                    {errors.root_cause_identified && (
                      <p className="text-sm text-destructive">{errors.root_cause_identified.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Planos de Ação */}
            <TabsContent value="actions">
              <div className="space-y-6">
                {/* Ações Corretivas */}
                <Card>
                  <CardHeader>
                    <CardTitle>Ações Corretivas</CardTitle>
                    <CardDescription>
                      Ações para eliminar a causa raiz identificada
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {correctiveFields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                        <div className="space-y-2">
                          <Label>Ação</Label>
                          <Textarea
                            {...register(`corrective_actions.${index}.action`)}
                            placeholder="Descreva a ação..."
                            rows={2}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Responsável</Label>
                          <Input
                            {...register(`corrective_actions.${index}.responsible`)}
                            placeholder="Nome do responsável"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Prazo</Label>
                          <Input
                            type="date"
                            {...register(`corrective_actions.${index}.deadline`)}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Prioridade</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeCorrective(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <select
                            {...register(`corrective_actions.${index}.priority`)}
                            className="w-full px-3 py-2 border rounded-md"
                          >
                            <option value="low">Baixa</option>
                            <option value="medium">Média</option>
                            <option value="high">Alta</option>
                            <option value="critical">Crítica</option>
                          </select>
                        </div>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => appendCorrective({ action: '', responsible: '', deadline: '', priority: 'medium' })}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Ação Corretiva
                    </Button>
                  </CardContent>
                </Card>

                {/* Ações Preventivas */}
                <Card>
                  <CardHeader>
                    <CardTitle>Ações Preventivas</CardTitle>
                    <CardDescription>
                      Ações para prevenir a recorrência do problema
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {preventiveFields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                        <div className="space-y-2">
                          <Label>Ação</Label>
                          <Textarea
                            {...register(`preventive_actions.${index}.action`)}
                            placeholder="Descreva a ação..."
                            rows={2}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Responsável</Label>
                          <Input
                            {...register(`preventive_actions.${index}.responsible`)}
                            placeholder="Nome do responsável"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Prazo</Label>
                          <Input
                            type="date"
                            {...register(`preventive_actions.${index}.deadline`)}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Prioridade</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removePreventive(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <select
                            {...register(`preventive_actions.${index}.priority`)}
                            className="w-full px-3 py-2 border rounded-md"
                          >
                            <option value="low">Baixa</option>
                            <option value="medium">Média</option>
                            <option value="high">Alta</option>
                            <option value="critical">Crítica</option>
                          </select>
                        </div>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => appendPreventive({ action: '', responsible: '', deadline: '', priority: 'medium' })}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Ação Preventiva
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Botões de Ação */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Salvar Análise
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};