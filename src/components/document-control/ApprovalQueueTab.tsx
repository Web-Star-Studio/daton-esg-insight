import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, Clock, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { documentApprovalsService } from "@/services/gedDocuments";
import { EnhancedLoading } from "@/components/ui/enhanced-loading";

export const ApprovalQueueTab = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [actionDialog, setActionDialog] = useState<{
    approvalId: string;
    action: "aprovado" | "rejeitado";
    documentName: string;
  } | null>(null);
  const [actionNotes, setActionNotes] = useState("");

  const { data: pendingApprovals = [], isLoading } = useQuery({
    queryKey: ["document-pending-approvals"],
    queryFn: () => documentApprovalsService.getPendingApprovals(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: "aprovado" | "rejeitado"; notes?: string }) =>
      documentApprovalsService.updateApprovalStatus(id, status, undefined, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["document-pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["document-master-list"] });
      toast({
        title: variables.status === "aprovado" ? "Documento aprovado" : "Documento rejeitado",
        description: "O status foi atualizado com sucesso.",
      });
      setActionDialog(null);
      setActionNotes("");
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const handleAction = () => {
    if (!actionDialog) return;
    if (actionDialog.action === "rejeitado" && !actionNotes.trim()) {
      toast({ title: "Motivo obrigatório", description: "Informe o motivo da rejeição.", variant: "destructive" });
      return;
    }
    updateMutation.mutate({
      id: actionDialog.approvalId,
      status: actionDialog.action,
      notes: actionNotes.trim() || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <EnhancedLoading size="lg" text="Carregando aprovações pendentes..." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Aprovações Pendentes
          </CardTitle>
          <CardDescription>
            Documentos aguardando sua aprovação ou revisão.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingApprovals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma aprovação pendente no momento.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Documento</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead>Data Submissão</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingApprovals.map((approval: any) => (
                    <TableRow key={approval.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>{approval.documents?.file_name || "Documento"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {approval.documents?.document_type || "interno"}
                        </Badge>
                      </TableCell>
                      <TableCell>Etapa {approval.current_step || 1}</TableCell>
                      <TableCell>
                        {new Date(approval.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            className="gap-1"
                            onClick={() =>
                              setActionDialog({
                                approvalId: approval.id,
                                action: "aprovado",
                                documentName: approval.documents?.file_name || "Documento",
                              })
                            }
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="gap-1"
                            onClick={() =>
                              setActionDialog({
                                approvalId: approval.id,
                                action: "rejeitado",
                                documentName: approval.documents?.file_name || "Documento",
                              })
                            }
                          >
                            <XCircle className="h-3.5 w-3.5" /> Rejeitar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!actionDialog} onOpenChange={() => { setActionDialog(null); setActionNotes(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.action === "aprovado" ? "Aprovar Documento" : "Rejeitar Documento"}
            </DialogTitle>
            <DialogDescription>
              Documento: {actionDialog?.documentName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>
              {actionDialog?.action === "aprovado" ? "Observações (opcional)" : "Motivo da rejeição *"}
            </Label>
            <Textarea
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              rows={4}
              placeholder={
                actionDialog?.action === "aprovado"
                  ? "Comentários sobre a aprovação..."
                  : "Descreva o motivo da rejeição..."
              }
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setActionDialog(null); setActionNotes(""); }}>
              Cancelar
            </Button>
            <Button
              variant={actionDialog?.action === "rejeitado" ? "destructive" : "default"}
              disabled={updateMutation.isPending}
              onClick={handleAction}
            >
              {updateMutation.isPending ? "Processando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
