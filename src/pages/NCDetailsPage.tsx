import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { 
  NCStageWizard,
  NCStage2ImmediateAction,
  NCStage3CauseAnalysis,
  NCStage4Planning,
  NCStage5Implementation,
  NCStage6Effectiveness
} from "@/components/non-conformity";
import { NCStage1Details } from "@/components/non-conformity/NCStage1Details";
import { useNonConformity, useAdvanceNCStage } from "@/hooks/useNonConformity";

export default function NCDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeStage, setActiveStage] = useState<number | null>(null);
  
  const { data: nc, isLoading, error } = useNonConformity(id || "");
  const advanceStageMutation = useAdvanceNCStage();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error || !nc) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <p className="text-muted-foreground">Não conformidade não encontrada</p>
          <Button variant="outline" onClick={() => navigate("/nao-conformidades")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </MainLayout>
    );
  }

  const currentStage = nc.current_stage || 1;
  const displayStage = activeStage || currentStage;

  // Determine completed stages
  const completedStages: number[] = [];
  if (nc.stage_1_completed_at) completedStages.push(1);
  if (nc.stage_2_completed_at) completedStages.push(2);
  if (nc.stage_3_completed_at) completedStages.push(3);
  if (nc.stage_4_completed_at) completedStages.push(4);
  if (nc.stage_5_completed_at) completedStages.push(5);
  if (nc.stage_6_completed_at) completedStages.push(6);

  const handleStageClick = (stage: number) => {
    if (stage <= currentStage || completedStages.includes(stage)) {
      setActiveStage(stage);
    }
  };

  const handleAdvanceStage = () => {
    advanceStageMutation.mutate(
      { id: nc.id, currentStage },
      {
        onSuccess: () => {
          setActiveStage(null); // Reset to show new current stage
        }
      }
    );
  };

  const renderStageContent = () => {
    switch (displayStage) {
      case 1:
        return (
          <NCStage1Details 
            nc={nc} 
            onComplete={handleAdvanceStage}
            isLoading={advanceStageMutation.isPending}
          />
        );
      case 2:
        return (
          <NCStage2ImmediateAction 
            ncId={nc.id} 
            onComplete={handleAdvanceStage}
          />
        );
      case 3:
        return (
          <NCStage3CauseAnalysis 
            ncId={nc.id} 
            onComplete={handleAdvanceStage}
          />
        );
      case 4:
        return (
          <NCStage4Planning 
            ncId={nc.id} 
            onComplete={handleAdvanceStage}
          />
        );
      case 5:
        return (
          <NCStage5Implementation 
            ncId={nc.id} 
            onComplete={handleAdvanceStage}
          />
        );
      case 6:
        return (
          <NCStage6Effectiveness 
            ncId={nc.id}
            onComplete={handleAdvanceStage}
          />
        );
      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/nao-conformidades")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Gerenciar NC</h1>
            <p className="text-muted-foreground text-sm">
              {nc.nc_number} - {nc.title}
            </p>
          </div>
        </div>

        {/* Stage Wizard */}
        <Card>
          <CardContent className="py-4">
            <NCStageWizard 
              currentStage={currentStage}
              onStageClick={handleStageClick}
              completedStages={completedStages}
            />
          </CardContent>
        </Card>

        {/* Stage Content */}
        <div className="min-h-[400px]">
          {renderStageContent()}
        </div>
      </div>
    </MainLayout>
  );
}
