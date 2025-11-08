import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, FileText, Target, ClipboardList, Save } from "lucide-react";
import { 
  createPGRSPlan, 
  createWasteSource, 
  createWasteType, 
  createProcedure, 
  createPGRSGoal,
  CreatePGRSPlanData,
  CreateWasteSourceData,
  CreateWasteTypeData,
  CreatePGRSProcedureData,
  CreatePGRSGoalData
} from "@/services/pgrs";

interface PGRSWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface WizardWasteType {
  waste_name: string;
  hazard_class: string;
  ibama_code: string;
  composition: string;
  estimated_quantity_monthly: string;
  unit: string;
}

interface WizardSource {
  source_name: string;
  source_type: string;
  location: string;
  description: string;
  waste_types: WizardWasteType[];
}

interface WizardProcedure {
  procedure_type: string;
  title: string;
  description: string;
  infrastructure_details: string;
  responsible_role: string;
  frequency: string;
}

interface WizardGoal {
  goal_type: string;
  target_value: string;
  unit: string;
  deadline: string;
  baseline_value: string;
}

interface WizardData {
  plan: CreatePGRSPlanData;
  sources: WizardSource[];
  procedures: WizardProcedure[];
  goals: WizardGoal[];
}

const wasteClasses = ['I - Perigoso', 'II A - Não Perigoso', 'II B - Inerte'];
const sourceTypes = ['Produção', 'Administrativo', 'Manutenção', 'Limpeza', 'Outros'];
const procedureTypes = [
  'Identificação e Classificação',
  'Acondicionamento',
  'Coleta Interna',
  'Armazenamento Temporário',
  'Transporte Externo',
  'Tratamento',
  'Disposição Final'
];
const goalTypes = [
  'Redução de Resíduos',
  'Aumento de Reciclagem',
  'Redução de Custos',
  'Treinamento'
];
const units = ['kg', 'ton', 'L', 'm³', '%'];

export default function PGRSWizard({ open, onOpenChange, onSuccess }: PGRSWizardProps) {
  const { toast } = useToast();
  
  const [wizardData, setWizardData] = useState<WizardData>({
    plan: { plan_name: '' },
    sources: [],
    procedures: [],
    goals: []
  });
  
  const [currentStep, setCurrentStep] = useState('plan');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addSource = () => {
    setWizardData(prev => ({
      ...prev,
      sources: [...prev.sources, {
        source_name: '',
        source_type: '',
        location: '',
        description: '',
        waste_types: []
      }]
    }));
  };

  const removeSource = (index: number) => {
    setWizardData(prev => ({
      ...prev,
      sources: prev.sources.filter((_, i) => i !== index)
    }));
  };

  const addWasteType = (sourceIndex: number) => {
    setWizardData(prev => ({
      ...prev,
      sources: prev.sources.map((source, i) => 
        i === sourceIndex 
          ? {
              ...source,
              waste_types: [...source.waste_types, {
                waste_name: '',
                hazard_class: '',
                ibama_code: '',
                composition: '',
                estimated_quantity_monthly: '',
                unit: 'kg'
              }]
            }
          : source
      )
    }));
  };

  const removeWasteType = (sourceIndex: number, typeIndex: number) => {
    setWizardData(prev => ({
      ...prev,
      sources: prev.sources.map((source, i) => 
        i === sourceIndex 
          ? {
              ...source,
              waste_types: source.waste_types.filter((_, j) => j !== typeIndex)
            }
          : source
      )
    }));
  };

  const addProcedure = () => {
    setWizardData(prev => ({
      ...prev,
      procedures: [...prev.procedures, {
        procedure_type: '',
        title: '',
        description: '',
        infrastructure_details: '',
        responsible_role: '',
        frequency: ''
      }]
    }));
  };

  const removeProcedure = (index: number) => {
    setWizardData(prev => ({
      ...prev,
      procedures: prev.procedures.filter((_, i) => i !== index)
    }));
  };

  const addGoal = () => {
    setWizardData(prev => ({
      ...prev,
      goals: [...prev.goals, {
        goal_type: '',
        target_value: '',
        unit: '',
        deadline: '',
        baseline_value: ''
      }]
    }));
  };

  const removeGoal = (index: number) => {
    setWizardData(prev => ({
      ...prev,
      goals: prev.goals.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!wizardData.plan.plan_name) {
      toast({
        title: "Erro",
        description: "Nome do plano é obrigatório",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create PGRS Plan
      const plan = await createPGRSPlan({
        ...wizardData.plan,
        status: 'Ativo'
      });
      
      // Create sources and their waste types
      for (const sourceData of wizardData.sources) {
        const source = await createWasteSource({
          pgrs_plan_id: plan.id,
          source_name: sourceData.source_name,
          source_type: sourceData.source_type,
          location: sourceData.location,
          description: sourceData.description
        });

        // Create waste types for this source
        for (const wasteTypeData of sourceData.waste_types) {
          await createWasteType({
            source_id: source.id,
            waste_name: wasteTypeData.waste_name,
            hazard_class: wasteTypeData.hazard_class,
            ibama_code: wasteTypeData.ibama_code,
            composition: wasteTypeData.composition,
            estimated_quantity_monthly: parseFloat(wasteTypeData.estimated_quantity_monthly) || 0,
            unit: wasteTypeData.unit
          });
        }
      }

      // Create procedures
      for (const procedureData of wizardData.procedures) {
        await createProcedure({
          pgrs_plan_id: plan.id,
          procedure_type: procedureData.procedure_type,
          title: procedureData.title,
          description: procedureData.description,
          infrastructure_details: procedureData.infrastructure_details,
          responsible_role: procedureData.responsible_role,
          frequency: procedureData.frequency
        });
      }

      // Create goals
      for (const goalData of wizardData.goals) {
        await createPGRSGoal({
          pgrs_plan_id: plan.id,
          goal_type: goalData.goal_type,
          target_value: parseFloat(goalData.target_value) || 0,
          unit: goalData.unit,
          deadline: goalData.deadline,
          baseline_value: parseFloat(goalData.baseline_value) || 0,
          current_value: parseFloat(goalData.baseline_value) || 0,
          status: 'Em Andamento'
        });
      }

      toast({
        title: "Sucesso",
        description: "Plano PGRS criado com sucesso",
        variant: "default"
      });
      
      onSuccess?.();
      onOpenChange(false);
      
      // Reset form
      setWizardData({
        plan: { plan_name: '' },
        sources: [],
        procedures: [],
        goals: []
      });
      setCurrentStep('plan');
      
    } catch (error) {
      console.error('Error creating PGRS plan:', error);
      toast({
        title: "Erro",
        description: `Erro ao criar plano PGRS: ${error}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Assistente de Criação do PGRS
          </DialogTitle>
        </DialogHeader>

        <Tabs value={currentStep} onValueChange={setCurrentStep} className="flex-1">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="plan">Plano</TabsTrigger>
            <TabsTrigger value="sources">Fontes Geradoras</TabsTrigger>
            <TabsTrigger value="procedures">Procedimentos</TabsTrigger>
            <TabsTrigger value="goals">Metas</TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto max-h-[60vh] mt-4">
            <TabsContent value="plan" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Básicas do Plano</CardTitle>
                  <CardDescription>
                    Defina as informações principais do seu PGRS
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="plan_name">Nome do Plano *</Label>
                    <Input
                      id="plan_name"
                      value={wizardData.plan.plan_name}
                      onChange={(e) => setWizardData(prev => ({
                        ...prev,
                        plan: { ...prev.plan, plan_name: e.target.value }
                      }))}
                      placeholder="Ex: PGRS - Unidade Industrial 2024"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sources" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Fontes Geradoras</h3>
                  <p className="text-sm text-muted-foreground">
                    Identifique as fontes de geração de resíduos
                  </p>
                </div>
                <Button onClick={addSource} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Fonte
                </Button>
              </div>

              {wizardData.sources.map((source, sourceIndex) => (
                <Card key={sourceIndex}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base">Fonte {sourceIndex + 1}</CardTitle>
                    <Button
                      onClick={() => removeSource(sourceIndex)}
                      variant="ghost"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nome da Fonte</Label>
                        <Input
                          value={source.source_name}
                          onChange={(e) => setWizardData(prev => ({
                            ...prev,
                            sources: prev.sources.map((s, i) => 
                              i === sourceIndex ? { ...s, source_name: e.target.value } : s
                            )
                          }))}
                          placeholder="Ex: Linha de Produção A"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tipo de Fonte</Label>
                        <Select
                          value={source.source_type}
                          onValueChange={(value) => setWizardData(prev => ({
                            ...prev,
                            sources: prev.sources.map((s, i) => 
                              i === sourceIndex ? { ...s, source_type: value } : s
                            )
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {sourceTypes.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Localização</Label>
                      <Input
                        value={source.location}
                        onChange={(e) => setWizardData(prev => ({
                          ...prev,
                          sources: prev.sources.map((s, i) => 
                            i === sourceIndex ? { ...s, location: e.target.value } : s
                          )
                        }))}
                        placeholder="Ex: Galpão 2, Setor B"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Textarea
                        value={source.description}
                        onChange={(e) => setWizardData(prev => ({
                          ...prev,
                          sources: prev.sources.map((s, i) => 
                            i === sourceIndex ? { ...s, description: e.target.value } : s
                          )
                        }))}
                        placeholder="Descreva a fonte geradora"
                      />
                    </div>

                    {/* Waste Types for this source */}
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">Tipos de Resíduos</Label>
                        <Button
                          onClick={() => addWasteType(sourceIndex)}
                          variant="outline"
                          size="sm"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Adicionar Resíduo
                        </Button>
                      </div>

                      {source.waste_types.map((wasteType, typeIndex) => (
                        <Card key={typeIndex} className="mb-2">
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between">
                              <div className="grid grid-cols-3 gap-2 flex-1">
                                <Input
                                  placeholder="Nome do resíduo"
                                  value={wasteType.waste_name}
                                  onChange={(e) => setWizardData(prev => ({
                                    ...prev,
                                    sources: prev.sources.map((s, i) => 
                                      i === sourceIndex ? {
                                        ...s,
                                        waste_types: s.waste_types.map((wt, j) => 
                                          j === typeIndex ? { ...wt, waste_name: e.target.value } : wt
                                        )
                                      } : s
                                    )
                                  }))}
                                />
                                <Select
                                  value={wasteType.hazard_class}
                                  onValueChange={(value) => setWizardData(prev => ({
                                    ...prev,
                                    sources: prev.sources.map((s, i) => 
                                      i === sourceIndex ? {
                                        ...s,
                                        waste_types: s.waste_types.map((wt, j) => 
                                          j === typeIndex ? { ...wt, hazard_class: value } : wt
                                        )
                                      } : s
                                    )
                                  }))}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Classe" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {wasteClasses.map(cls => (
                                      <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <div className="flex gap-1">
                                  <Input
                                    placeholder="Qtd"
                                    value={wasteType.estimated_quantity_monthly}
                                    onChange={(e) => setWizardData(prev => ({
                                      ...prev,
                                      sources: prev.sources.map((s, i) => 
                                        i === sourceIndex ? {
                                          ...s,
                                          waste_types: s.waste_types.map((wt, j) => 
                                            j === typeIndex ? { ...wt, estimated_quantity_monthly: e.target.value } : wt
                                          )
                                        } : s
                                      )
                                    }))}
                                  />
                                  <Select
                                    value={wasteType.unit}
                                    onValueChange={(value) => setWizardData(prev => ({
                                      ...prev,
                                      sources: prev.sources.map((s, i) => 
                                        i === sourceIndex ? {
                                          ...s,
                                          waste_types: s.waste_types.map((wt, j) => 
                                            j === typeIndex ? { ...wt, unit: value } : wt
                                          )
                                        } : s
                                      )
                                    }))}
                                  >
                                    <SelectTrigger className="w-16">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {units.map(unit => (
                                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <Button
                                onClick={() => removeWasteType(sourceIndex, typeIndex)}
                                variant="ghost"
                                size="sm"
                                className="ml-2"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="procedures" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Procedimentos Operacionais</h3>
                  <p className="text-sm text-muted-foreground">
                    Defina os procedimentos para manejo dos resíduos
                  </p>
                </div>
                <Button onClick={addProcedure} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Procedimento
                </Button>
              </div>

              {wizardData.procedures.map((procedure, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base">Procedimento {index + 1}</CardTitle>
                    <Button
                      onClick={() => removeProcedure(index)}
                      variant="ghost"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo de Procedimento</Label>
                        <Select
                          value={procedure.procedure_type}
                          onValueChange={(value) => setWizardData(prev => ({
                            ...prev,
                            procedures: prev.procedures.map((p, i) => 
                              i === index ? { ...p, procedure_type: value } : p
                            )
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {procedureTypes.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Título</Label>
                        <Input
                          value={procedure.title}
                          onChange={(e) => setWizardData(prev => ({
                            ...prev,
                            procedures: prev.procedures.map((p, i) => 
                              i === index ? { ...p, title: e.target.value } : p
                            )
                          }))}
                          placeholder="Título do procedimento"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Textarea
                        value={procedure.description}
                        onChange={(e) => setWizardData(prev => ({
                          ...prev,
                          procedures: prev.procedures.map((p, i) => 
                            i === index ? { ...p, description: e.target.value } : p
                          )
                        }))}
                        placeholder="Descreva o procedimento detalhadamente"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="goals" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Metas do PGRS</h3>
                  <p className="text-sm text-muted-foreground">
                    Estabeleça metas quantitativas para o plano
                  </p>
                </div>
                <Button onClick={addGoal} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Meta
                </Button>
              </div>

              {wizardData.goals.map((goal, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base">Meta {index + 1}</CardTitle>
                    <Button
                      onClick={() => removeGoal(index)}
                      variant="ghost"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo de Meta</Label>
                        <Select
                          value={goal.goal_type}
                          onValueChange={(value) => setWizardData(prev => ({
                            ...prev,
                            goals: prev.goals.map((g, i) => 
                              i === index ? { ...g, goal_type: value } : g
                            )
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {goalTypes.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Prazo</Label>
                        <Input
                          type="date"
                          value={goal.deadline}
                          onChange={(e) => setWizardData(prev => ({
                            ...prev,
                            goals: prev.goals.map((g, i) => 
                              i === index ? { ...g, deadline: e.target.value } : g
                            )
                          }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Valor Base</Label>
                        <Input
                          type="number"
                          value={goal.baseline_value}
                          onChange={(e) => setWizardData(prev => ({
                            ...prev,
                            goals: prev.goals.map((g, i) => 
                              i === index ? { ...g, baseline_value: e.target.value } : g
                            )
                          }))}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Meta</Label>
                        <Input
                          type="number"
                          value={goal.target_value}
                          onChange={(e) => setWizardData(prev => ({
                            ...prev,
                            goals: prev.goals.map((g, i) => 
                              i === index ? { ...g, target_value: e.target.value } : g
                            )
                          }))}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Unidade</Label>
                        <Select
                          value={goal.unit}
                          onValueChange={(value) => setWizardData(prev => ({
                            ...prev,
                            goals: prev.goals.map((g, i) => 
                              i === index ? { ...g, unit: value } : g
                            )
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Unidade" />
                          </SelectTrigger>
                          <SelectContent>
                            {units.map(unit => (
                              <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <div className="flex gap-2">
              {currentStep !== 'plan' && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const steps = ['plan', 'sources', 'procedures', 'goals'];
                    const currentIndex = steps.indexOf(currentStep);
                    if (currentIndex > 0) {
                      setCurrentStep(steps[currentIndex - 1]);
                    }
                  }}
                >
                  Anterior
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              {currentStep !== 'goals' ? (
                <Button
                  onClick={() => {
                    const steps = ['plan', 'sources', 'procedures', 'goals'];
                    const currentIndex = steps.indexOf(currentStep);
                    if (currentIndex < steps.length - 1) {
                      setCurrentStep(steps[currentIndex + 1]);
                    }
                  }}
                >
                  Próximo
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Criando...' : 'Criar PGRS'}
                </Button>
              )}
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}