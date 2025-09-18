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
  'Área Externa',
  'Outras'
];

const hazardClasses = [
  'Classe I - Perigosos',
  'Classe II-A - Não Inertes',
  'Classe II-B - Inertes'
];

const procedureTypes = [
  'Segregação',
  'Acondicionamento',
  'Transporte Interno',
  'Armazenamento Temporário',
  'Destinação Final'
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
    plan: { plan_name: '', responsible_user_id: '' },
    sources: [],
    procedures: [],
    goals: []
  });

  const [isLoading, setIsLoading] = useState(false);

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
        unit: '',
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

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Create Plan
      const plan = await createPGRSPlan({
        plan_name: wizardData.plan.plan_name,
        responsible_user_id: wizardData.plan.responsible_user_id,
        version: '1.0',
        status: 'Em desenvolvimento'
      });

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
            source_id: source.id,
            waste_name: wasteType.waste_name,
            hazard_class: wasteType.hazard_class,
            ibama_code: wasteType.ibama_code,
            composition: wasteType.composition,
            estimated_quantity_monthly: parseFloat(wasteType.estimated_quantity_monthly) || 0,
            unit: wasteType.unit
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
          pgrs_plan_id: plan.id,
          goal_type: goal.goal_type,
          baseline_value: parseFloat(goal.baseline_value) || 0,
          target_value: parseFloat(goal.target_value) || 0,
          unit: goal.unit,
          deadline: goal.deadline,
          responsible_user_id: goal.responsible_user_id
        });
      }

      toast({
        title: "Sucesso",
        description: "Plano PGRS criado com sucesso!",
        variant: "default"
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar plano PGRS",
        variant: "destructive"
      });
      console.error('Error creating PGRS plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assistente para Criação de Plano PGRS</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="plan" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="plan">Plano</TabsTrigger>
            <TabsTrigger value="sources">Fontes Geradoras</TabsTrigger>
            <TabsTrigger value="procedures">Procedimentos</TabsTrigger>
            <TabsTrigger value="goals">Metas</TabsTrigger>
          </TabsList>

          {/* Plan Tab */}
          <TabsContent value="plan" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Informações do Plano
                </CardTitle>
                <CardDescription>
                  Defina as informações básicas do Plano de Gerenciamento de Resíduos Sólidos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome do Plano</Label>
                  <Input
                    value={wizardData.plan.plan_name}
                    onChange={(e) => setWizardData(prev => ({
                      ...prev,
                      plan: { ...prev.plan, plan_name: e.target.value }
                    }))}
                    placeholder="Ex: PGRS - Empresa ABC 2024"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Responsável pelo Plano</Label>
                  <Input
                    value={wizardData.plan.responsible_user_id || ''}
                    onChange={(e) => setWizardData(prev => ({
                      ...prev,
                      plan: { ...prev.plan, responsible_user_id: e.target.value }
                    }))}
                    placeholder="ID do usuário responsável"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sources Tab */}
          <TabsContent value="sources" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Fontes Geradoras de Resíduos</h3>
                <p className="text-sm text-muted-foreground">
                  Cadastre as áreas e tipos de resíduos gerados
                </p>
              </div>
              <Button onClick={addSource}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Fonte
              </Button>
            </div>

            {wizardData.sources.map((source, sourceIndex) => (
              <Card key={sourceIndex}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">Fonte Geradora {sourceIndex + 1}</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSource(sourceIndex)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
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
                        placeholder="Ex: Refeitório Principal"
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
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
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
                        placeholder="Ex: 1º Andar - Ala Norte"
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
                        placeholder="Descrição da fonte geradora"
                        className="min-h-[60px]"
                      />
                    </div>
                  </div>

                  {/* Waste Types */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-medium">Tipos de Resíduos</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addWasteType(sourceIndex)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Tipo de Resíduo
                      </Button>
                    </div>

                    {source.waste_types.map((wasteType, typeIndex) => (
                      <div key={typeIndex} className="border rounded-lg p-3 bg-muted/30">
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-sm font-medium">Resíduo {typeIndex + 1}</span>
                          <Button
                            type="button"
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
                              type="number"
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
                                <SelectValue placeholder="Unidade" />
                              </SelectTrigger>
                              <SelectContent>
                                {units.map(unit => (
                                  <SelectItem key={unit} value={unit}>
                                    {unit}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Composição</Label>
                          <Textarea
                            value={wasteType.composition}
                            onChange={(e) => setWizardData(prev => ({
                              ...prev,
                              sources: prev.sources.map((s, i) => 
                                i === sourceIndex ? {
                                  ...s,
                                  waste_types: s.waste_types.map((wt, j) =>
                                    j === typeIndex ? { ...wt, composition: e.target.value } : wt
                                  )
                                } : s
                              )
                            }))}
                            placeholder="Descreva a composição do resíduo"
                            className="min-h-[50px]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Procedures Tab */}
          <TabsContent value="procedures" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Procedimentos de Manejo</h3>
                <p className="text-sm text-muted-foreground">
                  Defina os procedimentos para cada etapa do manejo dos resíduos
                </p>
              </div>
              <Button onClick={addProcedure}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Procedimento
              </Button>
            </div>

            {wizardData.procedures.map((procedure, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-medium">Procedimento {index + 1}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProcedure(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
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
                            <SelectItem key={type} value={type}>
                              {type}
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
                        placeholder="Título do procedimento"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
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
                        className="min-h-[100px]"
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
                          placeholder="Ex: Encarregado de limpeza"
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
                          placeholder="Ex: Diária, Semanal"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Detalhes da Infraestrutura</Label>
                      <Textarea
                        value={procedure.infrastructure_details}
                        onChange={(e) => setWizardData(prev => ({
                          ...prev,
                          procedures: prev.procedures.map((p, i) => 
                            i === index ? { ...p, infrastructure_details: e.target.value } : p
                          )
                        }))}
                        placeholder="Descreva a infraestrutura necessária"
                        className="min-h-[80px]"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Metas e Objetivos</h3>
                <p className="text-sm text-muted-foreground">
                  Estabeleça metas quantitativas para o plano
                </p>
              </div>
              <Button onClick={addGoal}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Meta
              </Button>
            </div>

            {wizardData.goals.map((goal, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Meta {index + 1}
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeGoal(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Valor Baseline</Label>
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
                      <Label>Valor Meta</Label>
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
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
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
                            <SelectItem key={type} value={type}>
                              {type}
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

                  <div className="mt-4">
                    <div className="space-y-2">
                      <Label>Responsável</Label>
                      <Input
                        value={goal.responsible_user_id}
                        onChange={(e) => setWizardData(prev => ({
                          ...prev,
                          goals: prev.goals.map((g, i) => 
                            i === index ? { ...g, responsible_user_id: e.target.value } : g
                          )
                        }))}
                        placeholder="ID do usuário responsável"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Salvando...' : 'Salvar Plano PGRS'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}