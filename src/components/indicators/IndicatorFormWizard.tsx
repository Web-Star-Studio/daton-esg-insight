import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Check, AlertCircle } from "lucide-react";
import { FormulaEditor } from "./FormulaEditor";
import { useCreateIndicator } from "@/services/indicatorManagement";
import { useToast } from "@/hooks/use-toast";

interface IndicatorGroup {
  id: string;
  name: string;
}

interface IndicatorFormWizardProps {
  onClose: () => void;
  groups: IndicatorGroup[];
  editData?: any;
}

const STEPS = [
  { id: 1, title: "Geral", description: "Informações básicas" },
  { id: 2, title: "Análise", description: "Configuração de análise" },
  { id: 3, title: "Fonte de Dados", description: "Origem dos valores" },
  { id: 4, title: "Meta", description: "Definição de metas" },
];

const UNITS = [
  { value: "percentage", label: "%" },
  { value: "number", label: "Número" },
  { value: "currency", label: "R$" },
  { value: "days", label: "Dias" },
  { value: "hours", label: "Horas" },
  { value: "units", label: "Unidades" },
];

const FREQUENCIES = [
  { value: "monthly", label: "Mensal" },
  { value: "quarterly", label: "Trimestral" },
  { value: "semiannual", label: "Semestral" },
  { value: "annual", label: "Anual" },
];

const DIRECTIONS = [
  { value: "higher_better", label: "Maior é melhor" },
  { value: "lower_better", label: "Menor é melhor" },
  { value: "target_exact", label: "Meta exata" },
];

const DATA_SOURCES = [
  { value: "manual", label: "Coleta Manual" },
  { value: "formula", label: "Fórmula/Cálculo" },
  { value: "indicator", label: "Outro Indicador" },
];

export function IndicatorFormWizard({ onClose, groups, editData }: IndicatorFormWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1 - General
    code: editData?.code || "",
    name: editData?.name || "",
    description: editData?.description || "",
    group_id: editData?.group_id || "",
    unit: editData?.unit || "percentage",
    frequency: editData?.frequency || "monthly",
    location: editData?.location || "",
    direction: editData?.direction || "higher_better",
    icon: editData?.icon || "",
    
    // Step 2 - Analysis
    analysis_user_id: editData?.analysis_user_id || "",
    auto_analysis: editData?.auto_analysis || false,
    analysis_instructions: editData?.analysis_instructions || "",
    suggested_actions: editData?.suggested_actions || "",
    
    // Step 3 - Data Source
    data_source_type: editData?.data_source_type || "manual",
    formula: editData?.formula || "",
    source_indicator_id: editData?.source_indicator_id || "",
    
    // Step 4 - Target
    target_value: editData?.target_value || "",
    tolerance_value: editData?.tolerance_value || "",
    target_by_period: editData?.target_by_period || false,
    period_targets: editData?.period_targets || {},
  });

  const { toast } = useToast();
  const createIndicator = useCreateIndicator();

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(prev => prev + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    try {
      await createIndicator.mutateAsync({
        code: formData.code,
        name: formData.name,
        description: formData.description,
        group_id: formData.group_id || undefined,
        measurement_unit: formData.unit,
        frequency: formData.frequency as any,
        location: formData.location,
        direction: formData.direction as any,
        icon: formData.icon,
        analysis_user_id: formData.analysis_user_id || undefined,
        auto_analysis: formData.auto_analysis,
        analysis_instructions: formData.analysis_instructions,
        suggested_actions: formData.suggested_actions,
        data_source: formData.data_source_type,
        calculation_formula: formData.formula,
        target_value: formData.target_value ? Number(formData.target_value) : undefined,
        tolerance_value: formData.tolerance_value ? Number(formData.tolerance_value) : undefined,
      });
      
      toast({
        title: "Indicador criado",
        description: "O indicador foi criado com sucesso.",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o indicador.",
        variant: "destructive",
      });
    }
  };

  const progress = (currentStep / 4) * 100;

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle>
          {editData ? "Editar Indicador" : "Novo Indicador"}
        </DialogTitle>
      </DialogHeader>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          {STEPS.map(step => (
            <div 
              key={step.id}
              className={`flex items-center gap-2 ${currentStep >= step.id ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep > step.id ? 'bg-primary text-primary-foreground' :
                currentStep === step.id ? 'bg-primary text-primary-foreground' : 
                'bg-muted text-muted-foreground'
              }`}>
                {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
              </div>
              <span className="hidden sm:inline">{step.title}</span>
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Content */}
      <div className="min-h-[300px]">
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código *</Label>
                <Input
                  id="code"
                  placeholder="Ex: IND-001"
                  value={formData.code}
                  onChange={e => updateFormData("code", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="group">Grupo</Label>
                <Select value={formData.group_id} onValueChange={v => updateFormData("group_id", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map(g => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Indicador *</Label>
              <Input
                id="name"
                placeholder="Ex: Taxa de Satisfação do Cliente"
                value={formData.name}
                onChange={e => updateFormData("name", e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva o objetivo e como o indicador é medido..."
                value={formData.description}
                onChange={e => updateFormData("description", e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unidade *</Label>
                <Select value={formData.unit} onValueChange={v => updateFormData("unit", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map(u => (
                      <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Frequência *</Label>
                <Select value={formData.frequency} onValueChange={v => updateFormData("frequency", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map(f => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Filial/Localização</Label>
                <Input
                  id="location"
                  placeholder="Ex: Matriz, Filial SP"
                  value={formData.location}
                  onChange={e => updateFormData("location", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Direção do Indicador *</Label>
                <Select value={formData.direction} onValueChange={v => updateFormData("direction", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIRECTIONS.map(d => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label>Análise Automática</Label>
                <p className="text-sm text-muted-foreground">
                  Gerar análise automática ao coletar dados
                </p>
              </div>
              <Switch
                checked={formData.auto_analysis}
                onCheckedChange={v => updateFormData("auto_analysis", v)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="analysis_instructions">Instruções para Análise</Label>
              <Textarea
                id="analysis_instructions"
                placeholder="Instruções sobre como analisar os resultados deste indicador..."
                value={formData.analysis_instructions}
                onChange={e => updateFormData("analysis_instructions", e.target.value)}
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="suggested_actions">Ações Sugeridas</Label>
              <Textarea
                id="suggested_actions"
                placeholder="Ações recomendadas quando o indicador estiver fora da meta..."
                value={formData.suggested_actions}
                onChange={e => updateFormData("suggested_actions", e.target.value)}
                rows={4}
              />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Fonte de Dados *</Label>
              <Select value={formData.data_source_type} onValueChange={v => updateFormData("data_source_type", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATA_SOURCES.map(ds => (
                    <SelectItem key={ds.value} value={ds.value}>{ds.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {formData.data_source_type === "manual" && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Coleta Manual</p>
                    <p className="text-sm text-muted-foreground">
                      Os valores serão inseridos manualmente na tela de coleta.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {formData.data_source_type === "formula" && (
              <div className="space-y-2">
                <Label>Fórmula de Cálculo</Label>
                <FormulaEditor
                  value={formData.formula}
                  onChange={v => updateFormData("formula", v)}
                />
              </div>
            )}
            
            {formData.data_source_type === "indicator" && (
              <div className="space-y-2">
                <Label>Indicador Fonte</Label>
                <Select 
                  value={formData.source_indicator_id} 
                  onValueChange={v => updateFormData("source_indicator_id", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o indicador..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="placeholder">Nenhum indicador disponível</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target_value">Meta *</Label>
                <Input
                  id="target_value"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 95"
                  value={formData.target_value}
                  onChange={e => updateFormData("target_value", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tolerance_value">Tolerância (%)</Label>
                <Input
                  id="tolerance_value"
                  type="number"
                  step="0.01"
                  placeholder="Ex: 5"
                  value={formData.tolerance_value}
                  onChange={e => updateFormData("tolerance_value", e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label>Metas por Período</Label>
                <p className="text-sm text-muted-foreground">
                  Definir metas diferentes para cada mês
                </p>
              </div>
              <Switch
                checked={formData.target_by_period}
                onCheckedChange={v => updateFormData("target_by_period", v)}
              />
            </div>
            
            {formData.target_by_period && (
              <div className="grid grid-cols-4 gap-3">
                {["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"].map((month, idx) => (
                  <div key={month} className="space-y-1">
                    <Label className="text-xs">{month}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      className="h-8 text-sm"
                      value={formData.period_targets[idx + 1] || ""}
                      onChange={e => updateFormData("period_targets", {
                        ...formData.period_targets,
                        [idx + 1]: e.target.value
                      })}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t">
        <Button 
          variant="outline" 
          onClick={handlePrev}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>
        
        {currentStep < 4 ? (
          <Button onClick={handleNext}>
            Próximo
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit}
            disabled={createIndicator.isPending}
          >
            {createIndicator.isPending ? "Salvando..." : "Salvar Indicador"}
            <Check className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
