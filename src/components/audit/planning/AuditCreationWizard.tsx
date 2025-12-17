import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight, FileText, Users, Settings, ClipboardCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WizardStepGeneral } from "./WizardStepGeneral";
import { WizardStepStandards } from "./WizardStepStandards";
import { WizardStepSessions } from "./WizardStepSessions";
import { WizardStepReview } from "./WizardStepReview";
import { useCreateAudit } from "./useCreateAudit";

interface AuditCreationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface AuditFormData {
  // Step 1: General
  title: string;
  description?: string;
  category_id?: string;
  template_id?: string;
  target_entity?: string;
  target_entity_type?: string;
  start_date?: string;
  end_date?: string;
  lead_auditor_id?: string;
  // Step 2: Standards
  standard_ids: string[];
  // Step 3: Sessions
  sessions: SessionFormData[];
}

export interface SessionFormData {
  id?: string;
  name: string;
  description?: string;
  session_date?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  item_ids: string[];
}

const steps = [
  { id: 1, title: "Dados Gerais", icon: FileText },
  { id: 2, title: "Normas", icon: Settings },
  { id: 3, title: "Sessões", icon: Users },
  { id: 4, title: "Revisão", icon: ClipboardCheck },
];

export function AuditCreationWizard({ open, onOpenChange }: AuditCreationWizardProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<AuditFormData>({
    title: "",
    standard_ids: [],
    sessions: [],
  });

  const { createFullAudit, isCreating } = useCreateAudit();

  const updateFormData = (data: Partial<AuditFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setFormData({
      title: "",
      standard_ids: [],
      sessions: [],
    });
    onOpenChange(false);
  };

  const handleCreate = async () => {
    const result = await createFullAudit(formData);
    if (result) {
      handleClose();
      navigate(`/auditoria?audit=${result.id}`);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.title.trim().length > 0;
      case 2:
        return formData.standard_ids.length > 0;
      case 3:
        return true; // Sessions are optional
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Nova Auditoria</DialogTitle>
          <DialogDescription>
            Configure os detalhes da auditoria em {steps.length} passos
          </DialogDescription>
        </DialogHeader>

        {/* Steps indicator */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors",
                  currentStep === step.id && "bg-primary text-primary-foreground",
                  currentStep > step.id && "bg-primary/20 text-primary",
                  currentStep < step.id && "bg-muted text-muted-foreground"
                )}
              >
                {currentStep > step.id ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <step.icon className="h-4 w-4" />
                )}
                <span className="text-sm font-medium hidden sm:inline">{step.title}</span>
                <span className="text-sm font-medium sm:hidden">{step.id}</span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "w-8 md:w-16 h-0.5 mx-2",
                    currentStep > step.id ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto py-4 px-1">
          {currentStep === 1 && (
            <WizardStepGeneral formData={formData} onUpdate={updateFormData} />
          )}
          {currentStep === 2 && (
            <WizardStepStandards formData={formData} onUpdate={updateFormData} />
          )}
          {currentStep === 3 && (
            <WizardStepSessions formData={formData} onUpdate={updateFormData} />
          )}
          {currentStep === 4 && (
            <WizardStepReview formData={formData} onEditStep={setCurrentStep} />
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>

          <div className="text-sm text-muted-foreground">
            Passo {currentStep} de {steps.length}
          </div>

          {currentStep < steps.length ? (
            <Button onClick={nextStep} disabled={!canProceed()}>
              Próximo
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={isCreating || !canProceed()}>
              {isCreating ? "Criando..." : "Criar Auditoria"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
