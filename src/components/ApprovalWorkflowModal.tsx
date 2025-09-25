import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  MessageSquare,
  Send 
} from "lucide-react";

interface ApprovalWorkflowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: string;
  entityId: string;
}

interface ApprovalStep {
  id: string;
  step_number: number;
  approver_user_id: string;
  status: string;
  approved_at?: string;
  comments?: string;
  profiles: {
    full_name: string;
  };
}

export function ApprovalWorkflowModal({ 
  open, 
  onOpenChange, 
  entityType,
  entityId 
}: ApprovalWorkflowModalProps) {
  const [comments, setComments] = useState("");
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject" | null>(null);
  const queryClient = useQueryClient();

  const { data: approvalData, isLoading } = useQuery({
    queryKey: ["approval-workflow", entityType, entityId],
    queryFn: async () => {
      const { data: approvalRequest, error: requestError } = await supabase
        .from("approval_requests")
        .select(`
          *,
          approval_steps(
            *,
            profiles:approver_user_id(full_name)
          )
        `)
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .single();

      if (requestError && requestError.code !== 'PGRST116') {
        throw requestError;
      }

      return approvalRequest;
    },
    enabled: open && !!entityId,
  });

  const handleApprovalAction = async (action: "approve" | "reject") => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Find current step for this user
      const currentStep = approvalData?.approval_steps?.find(
        (step: ApprovalStep) => step.approver_user_id === user.id && step.status === 'pending'
      );

      if (!currentStep) {
        toast.error("Você não tem permissão para aprovar este item");
        return;
      }

      // Update approval step
      const { error: stepError } = await supabase
        .from("approval_steps")
        .update({
          status: action === "approve" ? "approved" : "rejected",
          approved_at: new Date().toISOString(),
          comments: comments
        })
        .eq("id", currentStep.id);

      if (stepError) throw stepError;

      // Check if this was the final step
      const allSteps = approvalData?.approval_steps || [];
      const updatedSteps = allSteps.map((step: ApprovalStep) => 
        step.id === currentStep.id 
          ? { ...step, status: action === "approve" ? "approved" : "rejected" }
          : step
      );

      const allApproved = updatedSteps.every((step: ApprovalStep) => step.status === "approved");
      const anyRejected = updatedSteps.some((step: ApprovalStep) => step.status === "rejected");

      // Update approval request status
      let finalStatus = "pending";
      if (anyRejected) finalStatus = "rejected";
      else if (allApproved) finalStatus = "approved";

      const { error: requestError } = await supabase
        .from("approval_requests")
        .update({
          status: finalStatus,
          current_step: anyRejected ? -1 : (allApproved ? allSteps.length : currentStep.step_number)
        })
        .eq("id", approvalData.id);

      if (requestError) throw requestError;

      // If approved and it's a non-conformity, update the NC status
      if (finalStatus === "approved" && entityType === "non_conformity") {
        const { error: ncError } = await supabase
          .from("non_conformities")
          .update({
            approved_by_user_id: user.id,
            approval_date: new Date().toISOString(),
            status: "Aprovada"
          })
          .eq("id", entityId);

        if (ncError) throw ncError;
      }

      toast.success(
        action === "approve" 
          ? "Item aprovado com sucesso!" 
          : "Item rejeitado"
      );

      setComments("");
      setApprovalAction(null);
      queryClient.invalidateQueries({ queryKey: ["approval-workflow"] });
      queryClient.invalidateQueries({ queryKey: ["non-conformities"] });
      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao processar aprovação");
      console.error(error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="h-4 w-4" />;
      case "rejected": return <XCircle className="h-4 w-4" />;
      case "pending": return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Fluxo de Aprovação</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !approvalData ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhum fluxo de aprovação encontrado para este item
              </p>
            </div>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Status Atual</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusColor(approvalData.status)}>
                      {getStatusIcon(approvalData.status)}
                      <span className="ml-2">
                        {approvalData.status === "approved" && "Aprovado"}
                        {approvalData.status === "rejected" && "Rejeitado"}
                        {approvalData.status === "pending" && "Pendente"}
                      </span>
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Passo {approvalData.current_step} de {approvalData.approval_steps?.length || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Etapas de Aprovação</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {approvalData.approval_steps?.map((step: ApprovalStep) => (
                      <div 
                        key={step.id}
                        className="flex items-start justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                              <span className="text-sm font-medium">{step.step_number}</span>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{step.profiles.full_name}</span>
                            </div>
                            {step.comments && (
                              <div className="flex items-start gap-2 mt-1">
                                <MessageSquare className="h-3 w-3 text-muted-foreground mt-0.5" />
                                <span className="text-sm text-muted-foreground">
                                  {step.comments}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge className={getStatusColor(step.status)}>
                          {getStatusIcon(step.status)}
                          <span className="ml-1">
                            {step.status === "approved" && "Aprovado"}
                            {step.status === "rejected" && "Rejeitado"}
                            {step.status === "pending" && "Pendente"}
                          </span>
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Current user can approve/reject */}
              {approvalData.approval_steps?.some((step: ApprovalStep) => {
                const { data: { user } } = supabase.auth.getUser();
                return step.approver_user_id === user?.then(u => u.user?.id) && step.status === 'pending';
              }) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Sua Ação</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="comments">Comentários</Label>
                      <Textarea
                        id="comments"
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="Adicione seus comentários sobre a aprovação..."
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprovalAction("approve")}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aprovar
                      </Button>
                      <Button
                        onClick={() => handleApprovalAction("reject")}
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rejeitar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}