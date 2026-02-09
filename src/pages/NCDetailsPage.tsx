import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, CheckCircle, PartyPopper } from "lucide-react";
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
import { closeNonConformity } from "@/services/nonConformityGateway";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function NCDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeStage, setActiveStage] = useState<number | null>(null);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
  const { data: nc, isLoading, error } = useNonConformity(id || "");
  const advanceStageMutation = useAdvanceNCStage();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !nc) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-muted-foreground">Não conformidade não encontrada</p>
        <Button variant="outline" onClick={() => navigate("/nao-conformidades")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
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

  // Check if all stages are completed
  const allStagesCompleted = completedStages.length === 6;
  const isNCClosed = nc.status === "closed";

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

  const handleCloseNC = async () => {
    setIsClosing(true);
    try {
      await closeNonConformity(nc.id);

      toast({
        title: "NC Encerrada com Sucesso!",
        description: "A não conformidade foi concluída e encerrada.",
      });

      queryClient.invalidateQueries({ queryKey: ["non-conformity", nc.id] });
      queryClient.invalidateQueries({ queryKey: ["non-conformities"] });
      setShowCloseDialog(false);
    } catch (error) {
      console.error("Error closing NC:", error);
      toast({
        title: "Erro ao encerrar NC",
        description: "Não foi possível encerrar a não conformidade.",
        variant: "destructive",
      });
    } finally {
      setIsClosing(false);
    }
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
            onReopen={() => {
              toast({
                title: "NC Reaberta",
                description: "A não conformidade foi marcada como ineficaz e reaberta para nova análise.",
              });
              navigate("/nao-conformidades");
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full w-full space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
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

        {/* Close NC Button - only show when all stages completed and NC not yet closed */}
        {allStagesCompleted && !isNCClosed && (
          <Button 
            onClick={() => setShowCloseDialog(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Concluir NC
          </Button>
        )}

        {/* NC Closed Badge */}
        {isNCClosed && (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
            <PartyPopper className="h-5 w-5" />
            <span className="font-medium">NC Encerrada</span>
          </div>
        )}
      </div>

      {/* Stage Wizard */}
      <Card>
        <CardContent className="py-6 px-8">
          <NCStageWizard 
            currentStage={currentStage}
            onStageClick={handleStageClick}
            completedStages={completedStages}
          />
        </CardContent>
      </Card>

      {/* Stage Content */}
      <div className="min-h-[500px] pb-8">
        {renderStageContent()}
      </div>

      {/* Close NC Confirmation Dialog */}
      <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <PartyPopper className="h-5 w-5 text-green-600" />
              Concluir Não Conformidade
            </AlertDialogTitle>
            <AlertDialogDescription>
              Todas as etapas foram concluídas com sucesso! Deseja encerrar esta não conformidade?
              <br /><br />
              <strong>NC:</strong> {nc.nc_number} - {nc.title}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClosing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCloseNC}
              disabled={isClosing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isClosing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Encerrando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar Encerramento
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
