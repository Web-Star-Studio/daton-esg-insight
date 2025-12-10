import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Building2,
  Truck,
  Trash2,
  Award,
  MapPin,
  Users,
  AlertCircle,
} from "lucide-react";
import {
  ACTIVITY_SECTORS,
  ACTIVITIES,
  WASTE_TYPES,
  CERTIFICATIONS,
  EMPLOYEE_RANGES,
  BRAZILIAN_STATES,
  ComplianceProfile,
  generateProfileTags,
} from "@/services/complianceProfiles";
import { useComplianceProfile, useUpsertComplianceProfile } from "@/hooks/useComplianceProfiles";
import { useCompany } from "@/contexts/CompanyContext";
import { cn } from "@/lib/utils";

interface ComplianceQuestionnaireWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  branchName: string;
}

type WizardStep = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
};

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'sectors',
    title: 'Setores de Atividade',
    description: 'Quais setores são relevantes para esta unidade?',
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    id: 'characteristics',
    title: 'Características',
    description: 'Quais características específicas a unidade possui?',
    icon: <AlertCircle className="h-5 w-5" />,
  },
  {
    id: 'activities',
    title: 'Atividades',
    description: 'Quais atividades são realizadas nesta unidade?',
    icon: <Truck className="h-5 w-5" />,
  },
  {
    id: 'waste',
    title: 'Resíduos',
    description: 'Quais tipos de resíduos são gerados?',
    icon: <Trash2 className="h-5 w-5" />,
  },
  {
    id: 'location',
    title: 'Localização',
    description: 'Em quais estados a unidade opera?',
    icon: <MapPin className="h-5 w-5" />,
  },
  {
    id: 'company_info',
    title: 'Informações da Unidade',
    description: 'Informações complementares',
    icon: <Users className="h-5 w-5" />,
  },
  {
    id: 'certifications',
    title: 'Certificações',
    description: 'Quais certificações a unidade possui?',
    icon: <Award className="h-5 w-5" />,
  },
];

export const ComplianceQuestionnaireWizard: React.FC<ComplianceQuestionnaireWizardProps> = ({
  open,
  onOpenChange,
  branchId,
  branchName,
}) => {
  const { selectedCompany } = useCompany();
  const { data: existingProfile, isLoading } = useComplianceProfile(branchId);
  const upsertMutation = useUpsertComplianceProfile();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<ComplianceProfile>>({
    activity_sectors: [],
    has_fleet: false,
    has_hazardous_materials: false,
    has_environmental_license: false,
    has_wastewater_treatment: false,
    has_air_emissions: false,
    has_solid_waste: false,
    activities: [],
    waste_types: [],
    operating_states: [],
    certifications: [],
    employee_count_range: null,
  });

  // Load existing profile data
  useEffect(() => {
    if (existingProfile) {
      setFormData({
        activity_sectors: existingProfile.activity_sectors || [],
        has_fleet: existingProfile.has_fleet || false,
        has_hazardous_materials: existingProfile.has_hazardous_materials || false,
        has_environmental_license: existingProfile.has_environmental_license || false,
        has_wastewater_treatment: existingProfile.has_wastewater_treatment || false,
        has_air_emissions: existingProfile.has_air_emissions || false,
        has_solid_waste: existingProfile.has_solid_waste || false,
        activities: existingProfile.activities || [],
        waste_types: existingProfile.waste_types || [],
        operating_states: existingProfile.operating_states || [],
        certifications: existingProfile.certifications || [],
        employee_count_range: existingProfile.employee_count_range,
      });
    }
  }, [existingProfile]);

  const progress = ((currentStep + 1) / WIZARD_STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCompany) return;
    
    await upsertMutation.mutateAsync({
      ...formData,
      branch_id: branchId,
      company_id: selectedCompany.id,
    });
    
    onOpenChange(false);
    setCurrentStep(0);
  };

  const toggleArrayItem = (array: string[], item: string): string[] => {
    return array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  const updateFormData = <K extends keyof typeof formData>(
    key: K,
    value: (typeof formData)[K]
  ) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const generatedTags = generateProfileTags(formData);

  const renderStepContent = () => {
    const step = WIZARD_STEPS[currentStep];

    switch (step.id) {
      case 'sectors':
        return (
          <div className="grid grid-cols-2 gap-3">
            {ACTIVITY_SECTORS.map(sector => (
              <Card
                key={sector.id}
                className={cn(
                  "cursor-pointer transition-all hover:border-primary",
                  formData.activity_sectors?.includes(sector.id) && "border-primary bg-primary/5"
                )}
                onClick={() => updateFormData(
                  'activity_sectors',
                  toggleArrayItem(formData.activity_sectors || [], sector.id)
                )}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <span className="text-2xl">{sector.icon}</span>
                  <span className="font-medium">{sector.label}</span>
                  {formData.activity_sectors?.includes(sector.id) && (
                    <Check className="h-4 w-4 text-primary ml-auto" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 'characteristics':
        return (
          <div className="space-y-4">
            {[
              { key: 'has_fleet', label: 'Possui frota própria de veículos' },
              { key: 'has_hazardous_materials', label: 'Manipula ou armazena materiais perigosos' },
              { key: 'has_environmental_license', label: 'Possui licenciamento ambiental' },
              { key: 'has_wastewater_treatment', label: 'Possui tratamento de efluentes' },
              { key: 'has_air_emissions', label: 'Gera emissões atmosféricas' },
              { key: 'has_solid_waste', label: 'Gera resíduos sólidos' },
            ].map(item => (
              <div key={item.key} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <Checkbox
                  id={item.key}
                  checked={formData[item.key as keyof typeof formData] as boolean}
                  onCheckedChange={(checked) => 
                    updateFormData(item.key as keyof typeof formData, checked as boolean)
                  }
                />
                <Label htmlFor={item.key} className="cursor-pointer flex-1">
                  {item.label}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'activities':
        return (
          <ScrollArea className="h-[400px] pr-4">
            <div className="grid grid-cols-2 gap-2">
              {ACTIVITIES.map(activity => (
                <div
                  key={activity.id}
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    formData.activities?.includes(activity.id)
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  )}
                  onClick={() => updateFormData(
                    'activities',
                    toggleArrayItem(formData.activities || [], activity.id)
                  )}
                >
                  <Checkbox
                    checked={formData.activities?.includes(activity.id)}
                    onCheckedChange={() => updateFormData(
                      'activities',
                      toggleArrayItem(formData.activities || [], activity.id)
                    )}
                  />
                  <span className="text-sm">{activity.label}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        );

      case 'waste':
        return (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {WASTE_TYPES.map(waste => (
                <div
                  key={waste.id}
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    formData.waste_types?.includes(waste.id)
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  )}
                  onClick={() => updateFormData(
                    'waste_types',
                    toggleArrayItem(formData.waste_types || [], waste.id)
                  )}
                >
                  <Checkbox
                    checked={formData.waste_types?.includes(waste.id)}
                    onCheckedChange={() => updateFormData(
                      'waste_types',
                      toggleArrayItem(formData.waste_types || [], waste.id)
                    )}
                  />
                  <span className="text-sm">{waste.label}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        );

      case 'location':
        return (
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Selecione os estados onde esta unidade opera ou tem responsabilidades legais
            </p>
            <div className="grid grid-cols-5 gap-2">
              {BRAZILIAN_STATES.map(state => (
                <div
                  key={state}
                  className={cn(
                    "flex items-center justify-center p-2 rounded-lg border cursor-pointer transition-colors text-center font-medium",
                    formData.operating_states?.includes(state)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:bg-muted/50"
                  )}
                  onClick={() => updateFormData(
                    'operating_states',
                    toggleArrayItem(formData.operating_states || [], state)
                  )}
                >
                  {state}
                </div>
              ))}
            </div>
          </div>
        );

      case 'company_info':
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium">Faixa de funcionários</Label>
              <RadioGroup
                value={formData.employee_count_range || ''}
                onValueChange={(value) => updateFormData('employee_count_range', value)}
                className="mt-3 space-y-2"
              >
                {EMPLOYEE_RANGES.map(range => (
                  <div key={range.id} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                    <RadioGroupItem value={range.id} id={range.id} />
                    <Label htmlFor={range.id} className="cursor-pointer flex-1">
                      {range.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        );

      case 'certifications':
        return (
          <div className="space-y-2">
            {CERTIFICATIONS.map(cert => (
              <div
                key={cert.id}
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors",
                  formData.certifications?.includes(cert.id)
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                )}
                onClick={() => updateFormData(
                  'certifications',
                  toggleArrayItem(formData.certifications || [], cert.id)
                )}
              >
                <Checkbox
                  checked={formData.certifications?.includes(cert.id)}
                  onCheckedChange={() => updateFormData(
                    'certifications',
                    toggleArrayItem(formData.certifications || [], cert.id)
                  )}
                />
                <Award className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{cert.label}</span>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {WIZARD_STEPS[currentStep].icon}
            {WIZARD_STEPS[currentStep].title}
          </DialogTitle>
          <DialogDescription>
            {WIZARD_STEPS[currentStep].description} - <strong>{branchName}</strong>
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Etapa {currentStep + 1} de {WIZARD_STEPS.length}</span>
            <span>{Math.round(progress)}% concluído</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="flex gap-1 justify-center">
          {WIZARD_STEPS.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "w-8 h-1 rounded-full transition-colors",
                index <= currentStep ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto py-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            renderStepContent()
          )}
        </div>

        {/* Generated Tags Preview */}
        {generatedTags.length > 0 && currentStep === WIZARD_STEPS.length - 1 && (
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-2">Tags geradas para filtro inteligente:</p>
            <div className="flex flex-wrap gap-1">
              {generatedTags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between border-t pt-4">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>

          {currentStep === WIZARD_STEPS.length - 1 ? (
            <Button 
              onClick={handleSubmit}
              disabled={upsertMutation.isPending}
            >
              {upsertMutation.isPending ? (
                <>Salvando...</>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Concluir
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Próximo
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
