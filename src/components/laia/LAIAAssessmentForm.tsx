import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useLAIASectors, useCreateLAIAAssessment } from "@/hooks/useLAIA";
import {
  TEMPORALITY_OPTIONS,
  OPERATIONAL_SITUATION_OPTIONS,
  INCIDENCE_OPTIONS,
  IMPACT_CLASS_OPTIONS,
  SCOPE_OPTIONS,
  SEVERITY_OPTIONS,
  FREQUENCY_PROBABILITY_OPTIONS,
  CONTROL_TYPES,
  LIFECYCLE_STAGES,
  calculateConsequenceScore,
  calculateFreqProbScore,
  calculateCategory,
  calculateSignificance,
  getCategoryColor,
  getSignificanceColor,
} from "@/types/laia";
import type { LAIAAssessmentFormData } from "@/types/laia";
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Loader2,
  AlertTriangle,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LAIAAssessmentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const STEPS = [
  { id: 1, title: "Identificação", description: "Setor, atividade e aspecto" },
  { id: 2, title: "Caracterização", description: "Temporalidade e situação" },
  { id: 3, title: "Importância", description: "Abrangência e severidade" },
  { id: 4, title: "Significância", description: "Filtros e enquadramento" },
  { id: 5, title: "Observações", description: "Controles e ciclo de vida" },
];

const defaultFormData: LAIAAssessmentFormData = {
  sector_id: "",
  activity_operation: "",
  environmental_aspect: "",
  environmental_impact: "",
  temporality: "atual",
  operational_situation: "normal",
  incidence: "direto",
  impact_class: "adverso",
  scope: "local",
  severity: "baixa",
  frequency_probability: "baixa",
  has_legal_requirements: false,
  has_stakeholder_demand: false,
  has_strategic_options: false,
  control_types: [],
  existing_controls: "",
  legislation_reference: "",
  has_lifecycle_control: false,
  lifecycle_stages: [],
  output_actions: "",
  notes: "",
};

export function LAIAAssessmentForm({ onSuccess, onCancel }: LAIAAssessmentFormProps) {
  const { toast } = useToast();
  const { data: sectors } = useLAIASectors();
  const createMutation = useCreateLAIAAssessment();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<LAIAAssessmentFormData>(defaultFormData);

  // Calculated values
  const consequenceScore = calculateConsequenceScore(formData.scope, formData.severity);
  const freqProbScore = calculateFreqProbScore(formData.frequency_probability);
  const totalScore = consequenceScore + freqProbScore;
  const category = calculateCategory(totalScore);
  const significance = calculateSignificance(
    category,
    formData.has_legal_requirements,
    formData.has_stakeholder_demand,
    formData.has_strategic_options
  );

  const progress = (currentStep / STEPS.length) * 100;

  const updateField = <K extends keyof LAIAAssessmentFormData>(
    field: K,
    value: LAIAAssessmentFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleControlType = (type: string) => {
    const current = formData.control_types;
    if (current.includes(type)) {
      updateField("control_types", current.filter((t) => t !== type));
    } else {
      updateField("control_types", [...current, type]);
    }
  };

  const toggleLifecycleStage = (stage: string) => {
    const current = formData.lifecycle_stages;
    if (current.includes(stage)) {
      updateField("lifecycle_stages", current.filter((s) => s !== stage));
    } else {
      updateField("lifecycle_stages", [...current, stage]);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return (
          formData.sector_id &&
          formData.activity_operation.trim() &&
          formData.environmental_aspect.trim() &&
          formData.environmental_impact.trim()
        );
      case 2:
        return (
          formData.temporality &&
          formData.operational_situation &&
          formData.incidence &&
          formData.impact_class
        );
      case 3:
        return formData.scope && formData.severity && formData.frequency_probability;
      case 4:
        return true; // Filters are optional
      case 5:
        return true; // Observations are optional
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      await createMutation.mutateAsync(formData);
      onSuccess?.();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "desprezivel": return "Desprezível";
      case "moderado": return "Moderado";
      case "critico": return "Crítico";
      default: return cat;
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Nova Avaliação LAIA</CardTitle>
        <CardDescription>
          Levantamento e Avaliação dos Aspectos e Impactos Ambientais
        </CardDescription>

        {/* Progress */}
        <div className="mt-4">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`flex flex-col items-center ${
                  step.id === currentStep
                    ? "text-primary"
                    : step.id < currentStep
                    ? "text-primary/60"
                    : "text-muted-foreground"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step.id < currentStep
                      ? "bg-primary text-primary-foreground"
                      : step.id === currentStep
                      ? "border-2 border-primary"
                      : "border-2 border-muted"
                  }`}
                >
                  {step.id < currentStep ? <Check className="h-4 w-4" /> : step.id}
                </div>
                <span className="text-xs mt-1 hidden sm:block">{step.title}</span>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step 1: Identification */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Identificação</h3>
            
            <div className="space-y-2">
              <Label htmlFor="sector">Setor *</Label>
              <Select
                value={formData.sector_id}
                onValueChange={(v) => updateField("sector_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o setor" />
                </SelectTrigger>
                <SelectContent>
                  {sectors?.filter(s => s.is_active).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity">Atividade/Operação *</Label>
              <Textarea
                id="activity"
                value={formData.activity_operation}
                onChange={(e) => updateField("activity_operation", e.target.value)}
                placeholder="Descreva a atividade, processo ou operação onde o aspecto ocorre"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aspect">Aspecto Ambiental *</Label>
              <Textarea
                id="aspect"
                value={formData.environmental_aspect}
                onChange={(e) => updateField("environmental_aspect", e.target.value)}
                placeholder="Ex: Geração de resíduos, consumo de água, emissões atmosféricas"
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Elemento da atividade que interage com o meio ambiente
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="impact">Impacto Ambiental *</Label>
              <Textarea
                id="impact"
                value={formData.environmental_impact}
                onChange={(e) => updateField("environmental_impact", e.target.value)}
                placeholder="Ex: Contaminação do solo, poluição hídrica, degradação da qualidade do ar"
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Modificação causada no meio ambiente em decorrência do aspecto
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Characterization */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Caracterização do Impacto</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Temporalidade *</Label>
                <Select
                  value={formData.temporality}
                  onValueChange={(v) => updateField("temporality", v as typeof formData.temporality)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPORALITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Indica se o impacto é de atividade passada, atual ou futura
                </p>
              </div>

              <div className="space-y-2">
                <Label>Situação Operacional *</Label>
                <Select
                  value={formData.operational_situation}
                  onValueChange={(v) => updateField("operational_situation", v as typeof formData.operational_situation)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATIONAL_SITUATION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Normal (rotina), Anormal (não planejada) ou Emergência
                </p>
              </div>

              <div className="space-y-2">
                <Label>Incidência *</Label>
                <Select
                  value={formData.incidence}
                  onValueChange={(v) => updateField("incidence", v as typeof formData.incidence)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INCIDENCE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Direto (sob controle) ou Indireto (sob influência)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Classe do Impacto *</Label>
                <Select
                  value={formData.impact_class}
                  onValueChange={(v) => updateField("impact_class", v as typeof formData.impact_class)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {IMPACT_CLASS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Define se o impacto é benéfico ou adverso ao meio ambiente
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Importance Verification */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Verificação de Importância</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Abrangência *</Label>
                <Select
                  value={formData.scope}
                  onValueChange={(v) => updateField("scope", v as typeof formData.scope)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCOPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Área atingida pelo impacto
                </p>
              </div>

              <div className="space-y-2">
                <Label>Severidade *</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(v) => updateField("severity", v as typeof formData.severity)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Gravidade dos efeitos ao meio ambiente
                </p>
              </div>

              <div className="space-y-2">
                <Label>
                  {formData.operational_situation === "emergencia" 
                    ? "Probabilidade *" 
                    : "Frequência *"}
                </Label>
                <Select
                  value={formData.frequency_probability}
                  onValueChange={(v) => updateField("frequency_probability", v as typeof formData.frequency_probability)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCY_PROBABILITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Scoring Preview */}
            <div className="rounded-lg border p-4 bg-muted/50">
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Cálculo Automático da Pontuação
              </h4>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-sm text-muted-foreground">Consequência</div>
                  <div className="text-2xl font-bold">{consequenceScore}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Freq./Prob.</div>
                  <div className="text-2xl font-bold">{freqProbScore}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total</div>
                  <div className="text-2xl font-bold">{totalScore}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Categoria</div>
                  <Badge className={`mt-1 ${getCategoryColor(category)}`}>
                    {getCategoryLabel(category)}
                  </Badge>
                </div>
              </div>

              <div className="mt-4 text-xs text-muted-foreground">
                <p>• Desprezível: &lt; 50 pontos | Moderado: 50-70 pontos | Crítico: &gt; 70 pontos</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Significance Assessment */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Avaliação de Significância</h3>

            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground mb-4">
                Marque os filtros aplicáveis a este aspecto/impacto. Se a categoria for "Moderado" 
                e algum filtro estiver marcado, o impacto será considerado Significativo.
              </p>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="legal"
                    checked={formData.has_legal_requirements}
                    onCheckedChange={(checked) => updateField("has_legal_requirements", !!checked)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="legal" className="font-medium cursor-pointer">
                      Requisitos Legais (RL)
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Existe legislação, norma ou regulamentação aplicável a este aspecto/impacto
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="stakeholder"
                    checked={formData.has_stakeholder_demand}
                    onCheckedChange={(checked) => updateField("has_stakeholder_demand", !!checked)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="stakeholder" className="font-medium cursor-pointer">
                      Demanda de Partes Interessadas (DPI)
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Clientes, comunidade ou outras partes interessadas demandam controle
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="strategic"
                    checked={formData.has_strategic_options}
                    onCheckedChange={(checked) => updateField("has_strategic_options", !!checked)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="strategic" className="font-medium cursor-pointer">
                      Opções Estratégicas (OE)
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      A organização define como prioridade estratégica o controle deste aspecto
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Significance Preview */}
            <div className="rounded-lg border p-4 bg-muted/50">
              <h4 className="font-medium mb-4">Enquadramento Final</h4>
              
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Categoria</div>
                  <Badge className={getCategoryColor(category)}>
                    {getCategoryLabel(category)}
                  </Badge>
                </div>
                <div className="text-2xl text-muted-foreground">→</div>
                <div>
                  <div className="text-sm text-muted-foreground">Significância</div>
                  <Badge className={getSignificanceColor(significance)}>
                    {significance === "significativo" ? "Significativo" : "Não Significativo"}
                  </Badge>
                </div>
              </div>

              {significance === "significativo" && (
                <div className="mt-4 flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4 mt-0.5" />
                  <span>
                    Este aspecto requer definição de controles, ações ou objetivos ambientais.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Additional Observations & Lifecycle */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Observações Adicionais</h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tipos de Controle</Label>
                <div className="flex flex-wrap gap-2">
                  {CONTROL_TYPES.map((type) => (
                    <Badge
                      key={type.value}
                      variant={formData.control_types.includes(type.value) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleControlType(type.value)}
                    >
                      {type.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="controls">Controles Existentes</Label>
                <Textarea
                  id="controls"
                  value={formData.existing_controls}
                  onChange={(e) => updateField("existing_controls", e.target.value)}
                  placeholder="Descreva os controles atualmente implementados..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="legislation">Referência Legal</Label>
                <Input
                  id="legislation"
                  value={formData.legislation_reference}
                  onChange={(e) => updateField("legislation_reference", e.target.value)}
                  placeholder="Ex: CONAMA 237/97, NBR 10004"
                />
              </div>
            </div>

            <Separator />

            <h3 className="text-lg font-medium">Perspectiva do Ciclo de Vida</h3>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="lifecycle"
                  checked={formData.has_lifecycle_control}
                  onCheckedChange={(checked) => updateField("has_lifecycle_control", !!checked)}
                />
                <Label htmlFor="lifecycle" className="cursor-pointer">
                  Existe controle ou influência sobre algum estágio do ciclo de vida
                </Label>
              </div>

              {formData.has_lifecycle_control && (
                <div className="space-y-2">
                  <Label>Estágios do Ciclo de Vida</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {LIFECYCLE_STAGES.map((stage) => (
                      <div key={stage} className="flex items-center space-x-2">
                        <Checkbox
                          id={stage}
                          checked={formData.lifecycle_stages.includes(stage)}
                          onCheckedChange={() => toggleLifecycleStage(stage)}
                        />
                        <Label htmlFor={stage} className="text-sm cursor-pointer">
                          {stage}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="actions">Saídas/Ações/Objetivos</Label>
                <Textarea
                  id="actions"
                  value={formData.output_actions}
                  onChange={(e) => updateField("output_actions", e.target.value)}
                  placeholder="Descreva planos, projetos ou objetivos ambientais definidos..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações Gerais</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  placeholder="Observações adicionais..."
                  rows={2}
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? onCancel : handleBack}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            {currentStep === 1 ? "Cancelar" : "Voltar"}
          </Button>

          {currentStep < STEPS.length ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Próximo
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Criar Avaliação
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
