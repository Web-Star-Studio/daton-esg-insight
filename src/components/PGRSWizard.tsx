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
  baseline_value: string;
  target_value: string;
  unit: string;
  deadline: string;
  responsible_user_id: string;
}

interface WizardData {
  plan: {
    plan_name: string;
    responsible_user_id?: string;
  };
  sources: WizardSource[];
  procedures: WizardProcedure[];
  goals: WizardGoal[];
}

const sourceTypes = [
  'Restaurante',
  'Escritório',
  'Produção',
  'Laboratório',
  'Almoxarifado',
  'Manutenção',
  'Limpeza',
  'Outros'
];

const hazardClasses = [
  'Classe I - Perigosos',
  'Classe II A - Não Inertes',
  'Classe II B - Inertes'
];

const procedureTypes = [
  { value: 'segregation', label: 'Segregação na Fonte' },
  { value: 'internal_storage', label: 'Armazenamento Interno' },
  { value: 'external_storage', label: 'Armazenamento Externo' },
  { value: 'collection', label: 'Coleta Interna' },
  { value: 'transport', label: 'Transporte Externo' }
];

const goalTypes = [
  { value: 'reduction', label: 'Redução de Geração' },
  { value: 'recycling', label: 'Aumento da Reciclagem' },
  { value: 'reuse', label: 'Aumento da Reutilização' },
  { value: 'cost_reduction', label: 'Redução de Custos' }
];

export function PGRSWizard({ open, onOpenChange, onSuccess }: PGRSWizardProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState('plan');
  const [isLoading, setIsLoading] = useState(false);
  const [wizardData, setWizardData] = useState<WizardData>({
    plan: { plan_name: '' },
    sources: [],
    procedures: [],
    goals: []
  });

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
                estimated_quantity_monthly: '0',
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
        baseline_value: '0',
        target_value: '0',
        unit: 'kg',
        deadline: '',
        responsible_user_id: ''
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

    setIsLoading(true);
    try {
      // Create PGRS Plan
      const plan = await createPGRSPlan(wizardData.plan);

      // Create Sources and Waste Types
      for (const sourceData of wizardData.sources) {
        const { waste_types, ...sourceInfo } = sourceData;
        const source = await createWasteSource({
          ...sourceInfo,
          pgrs_plan_id: plan.id
        });

        // Create waste types for this source
        for (const wasteType of waste_types) {
          await createWasteType({
            ...wasteType,
            source_id: source.id
          });
        }
      }

      // Create Procedures
      for (const procedure of wizardData.procedures) {
        await createProcedure({
          ...procedure,
          pgrs_plan_id: plan.id
        });
      }

      // Create Goals
      for (const goal of wizardData.goals) {
        await createPGRSGoal({
          ...goal,
          pgrs_plan_id: plan.id
        });
      }

      toast({
        title: "Sucesso",
        description: "Plano PGRS criado com sucesso!",
        variant: "default"
      });

      onSuccess?.();
      onOpenChange(false);
      
      // Reset wizard data
      setWizardData({
        plan: { plan_name: '' },
        sources: [],
        procedures: [],
        goals: []
      });
      setCurrentStep('plan');

    } catch (error) {
      toast({
        title: "Erro",
        description: `Erro ao criar PGRS: ${error}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Assistente de Criação do PGRS
          </DialogTitle>
        </DialogHeader>

        <Tabs value={currentStep} onValueChange={setCurrentStep}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="plan">1. Plano</TabsTrigger>
            <TabsTrigger value="sources">2. Fontes</TabsTrigger>
            <TabsTrigger value="procedures">3. Procedimentos</TabsTrigger>
            <TabsTrigger value="goals">4. Metas</TabsTrigger>
          </TabsList>

          <TabsContent value="plan" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Plano PGRS</CardTitle>
                <CardDescription>
                  Defina as informações básicas do seu Plano de Gerenciamento de Resíduos Sólidos
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
                    placeholder="Ex: PGRS - Unidade São Paulo 2024"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sources" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Fontes Geradoras de Resíduos</h3>
                <p className="text-sm text-muted-foreground">
                  Identifique as áreas onde são gerados resíduos e os tipos produzidos
                </p>
              </div>
              <Button onClick={addSource} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Fonte
              </Button>
            </div>

            {wizardData.sources.map((source, sourceIndex) => (
              <Card key={sourceIndex}>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-base">Fonte Geradora {sourceIndex + 1}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSource(sourceIndex)}
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
                        placeholder="Ex: Restaurante Principal"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo</Label>
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

                  <div className="grid grid-cols-2 gap-4">
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
                        placeholder="Ex: Térreo - Ala Sul"
                      />
                    </div>
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
                      placeholder="Descreva as atividades realizadas nesta área"
                    />
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">Tipos de Resíduos</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addWasteType(sourceIndex)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Tipo
                      </Button>
                    </div>

                    {source.waste_types.map((wasteType, typeIndex) => (
                      <div key={typeIndex} className="border rounded p-3 mb-3 bg-muted/30">
                        <div className="flex justify-between items-start mb-3">
                          <h5 className="font-medium text-sm">Resíduo {typeIndex + 1}</h5>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeWasteType(sourceIndex, typeIndex)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Nome do Resíduo</Label>
                            <Input
                              size="sm"
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
                              placeholder="Ex: Restos de Comida"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Classe</Label>
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
                                {hazardClasses.map(hazardClass => (
                                  <SelectItem key={hazardClass} value={hazardClass}>
                                    {hazardClass}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Código IBAMA</Label>
                            <Input
                              size="sm"
                              value={wasteType.ibama_code}
                              onChange={(e) => setWizardData(prev => ({
                                ...prev,
                                sources: prev.sources.map((s, i) => 
                                  i === sourceIndex ? {
                                    ...s,
                                    waste_types: s.waste_types.map((wt, j) =>
                                      j === typeIndex ? { ...wt, ibama_code: e.target.value } : wt
                                    )
                                  } : s
                                )
                              }))}
                              placeholder="Ex: A001"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Quantidade/Mês</Label>
                            <Input
                              size="sm"
                              type="number"
                              value={wasteType.estimated_quantity_monthly.toString()}
                              onChange={(e) => setWizardData(prev => ({
                                ...prev,
                                sources: prev.sources.map((s, i) => 
                                  i === sourceIndex ? {
                                    ...s,
                                    waste_types: s.waste_types.map((wt, j) =>
                                      j === typeIndex ? { ...wt, estimated_quantity_monthly: parseFloat(e.target.value) || 0 } : wt
                                    )
                                  } : s
                                )
                              }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Unidade</Label>
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
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="kg">kg</SelectItem>
                                <SelectItem value="toneladas">toneladas</SelectItem>
                                <SelectItem value="litros">litros</SelectItem>
                                <SelectItem value="m³">m³</SelectItem>
                                <SelectItem value="unidades">unidades</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="procedures" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Procedimentos Operacionais</h3>
                <p className="text-sm text-muted-foreground">
                  Descreva os procedimentos para manejo dos resíduos
                </p>
              </div>
              <Button onClick={addProcedure} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Procedimento
              </Button>
            </div>

            {wizardData.procedures.map((procedure, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-start justify-between">
                  <CardTitle className="text-base">Procedimento {index + 1}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeProcedure(index)}
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
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
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
                        placeholder="Ex: Segregação na fonte de papéis"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Descrição do Procedimento</Label>
                    <Textarea
                      value={procedure.description}
                      onChange={(e) => setWizardData(prev => ({
                        ...prev,
                        procedures: prev.procedures.map((p, i) => 
                          i === index ? { ...p, description: e.target.value } : p
                        )
                      }))}
                      placeholder="Descreva detalhadamente como o procedimento deve ser executado..."
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Responsável</Label>
                      <Input
                        value={procedure.responsible_role}
                        onChange={(e) => setWizardData(prev => ({
                          ...prev,
                          procedures: prev.procedures.map((p, i) => 
                            i === index ? { ...p, responsible_role: e.target.value } : p
                          )
                        }))}
                        placeholder="Ex: Equipe de Limpeza"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Frequência</Label>
                      <Input
                        value={procedure.frequency}
                        onChange={(e) => setWizardData(prev => ({
                          ...prev,
                          procedures: prev.procedures.map((p, i) => 
                            i === index ? { ...p, frequency: e.target.value } : p
                          )
                        }))}
                        placeholder="Ex: Diária"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="goals" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Metas e Objetivos</h3>
                <p className="text-sm text-muted-foreground">
                  Defina metas quantitativas para o gerenciamento dos resíduos
                </p>
              </div>
              <Button onClick={addGoal} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Meta
              </Button>
            </div>

            {wizardData.goals.map((goal, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-start justify-between">
                  <CardTitle className="text-base">Meta {index + 1}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeGoal(index)}
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
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
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
                      <Label>Valor Baseline</Label>
                      <Input
                        type="number"
                        value={goal.baseline_value.toString()}
                        onChange={(e) => setWizardData(prev => ({
                          ...prev,
                          goals: prev.goals.map((g, i) => 
                            i === index ? { ...g, baseline_value: parseFloat(e.target.value) || 0 } : g
                          )
                        }))}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Valor Meta</Label>
                      <Input
                        type="number"
                        value={goal.target_value.toString()}
                        onChange={(e) => setWizardData(prev => ({
                          ...prev,
                          goals: prev.goals.map((g, i) => 
                            i === index ? { ...g, target_value: parseFloat(e.target.value) || 0 } : g
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
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="toneladas">toneladas</SelectItem>
                          <SelectItem value="%">%</SelectItem>
                          <SelectItem value="R$">R$</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="pt-4 border-t">
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Criando PGRS...' : 'Criar Plano PGRS'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}