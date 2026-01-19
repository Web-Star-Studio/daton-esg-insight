import { Check, FileText, Zap, Search, ClipboardList, Play, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface NCStageWizardProps {
  currentStage: number;
  onStageClick?: (stage: number) => void;
  completedStages?: number[];
}

const stages = [
  { number: 1, label: "Registro", icon: FileText, description: "Registro da NC" },
  { number: 2, label: "Ação Imediata", icon: Zap, description: "Contenção do problema" },
  { number: 3, label: "Análise de Causa", icon: Search, description: "Identificar causa raiz" },
  { number: 4, label: "Planejamento", icon: ClipboardList, description: "Plano de ação 5W2H" },
  { number: 5, label: "Implementação", icon: Play, description: "Execução das ações" },
  { number: 6, label: "Eficácia", icon: CheckCircle2, description: "Verificar resultados" },
];

export function NCStageWizard({ currentStage, onStageClick, completedStages = [] }: NCStageWizardProps) {
  const getStageStatus = (stageNumber: number) => {
    if (completedStages.includes(stageNumber)) return "completed";
    if (stageNumber === currentStage) return "current";
    if (stageNumber < currentStage) return "completed";
    return "pending";
  };

  return (
    <div className="w-full py-4">
      <div className="flex items-start justify-between px-2">
        {stages.map((stage, index) => {
          const status = getStageStatus(stage.number);
          const Icon = stage.icon;
          const isClickable = onStageClick && (status === "completed" || status === "current");
          const isLast = index === stages.length - 1;

          return (
            <div key={stage.number} className="flex items-start flex-1">
              {/* Stage item */}
              <div
                className={cn(
                  "flex flex-col items-center relative z-10 flex-1",
                  isClickable && "cursor-pointer group"
                )}
                onClick={() => isClickable && onStageClick?.(stage.number)}
              >
                {/* Stage circle */}
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 shrink-0",
                    status === "completed" && "bg-primary border-primary text-primary-foreground",
                    status === "current" && "bg-primary/10 border-primary text-primary ring-4 ring-primary/20",
                    status === "pending" && "bg-muted border-muted-foreground/30 text-muted-foreground",
                    isClickable && "group-hover:scale-110"
                  )}
                >
                  {status === "completed" ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>

                {/* Stage number badge */}
                <span
                  className={cn(
                    "absolute top-0 right-1/4 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center",
                    status === "completed" && "bg-green-500 text-white",
                    status === "current" && "bg-primary text-primary-foreground",
                    status === "pending" && "bg-muted-foreground/20 text-muted-foreground"
                  )}
                >
                  {stage.number}
                </span>

                {/* Stage label */}
                <div className="text-center mt-2">
                  <p
                    className={cn(
                      "text-[11px] font-medium transition-colors leading-tight",
                      status === "current" && "text-primary",
                      status === "completed" && "text-foreground",
                      status === "pending" && "text-muted-foreground"
                    )}
                  >
                    {stage.label}
                  </p>
                  <p className="text-[9px] text-muted-foreground hidden md:block mt-0.5 leading-tight max-w-[80px] mx-auto">
                    {stage.description}
                  </p>
                </div>
              </div>

              {/* Connection line */}
              {!isLast && (
                <div className="flex items-center h-12 -mx-1">
                  <div 
                    className={cn(
                      "w-4 h-0.5 transition-colors duration-300",
                      status === "completed" ? "bg-primary" : "bg-muted"
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
