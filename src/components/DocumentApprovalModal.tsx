import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentApprovalsService, approvalWorkflowsService } from '@/services/gedDocuments';
import { CheckCircle2, XCircle, Clock, FileText, AlertCircle, User, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface DocumentApprovalModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  documentId?: string;
  documentName?: string;
  onApprovalComplete?: () => void;
}

export const DocumentApprovalModal: React.FC<DocumentApprovalModalProps> = ({
  isOpen,
  onOpenChange,
  documentId,
  documentName,
  onApprovalComplete
}) => {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const queryClient = useQueryClient();

  const { data: workflows } = useQuery({
    queryKey: ['approval-workflows'],
    queryFn: () => approvalWorkflowsService.getWorkflows(),
  });

  const { data: approvals, isLoading } = useQuery({
    queryKey: ['document-approvals', documentId],
    queryFn: () => documentId ? documentApprovalsService.getApprovals(documentId) : [],
    enabled: !!documentId,
  });

  const { data: pendingApprovals } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: () => documentApprovalsService.getPendingApprovals(),
    enabled: !documentId, // Only fetch if not viewing specific document
  });

  const createApprovalMutation = useMutation({
    mutationFn: (data: { documentId: string; workflowId?: string }) =>
      documentApprovalsService.createApproval({
        document_id: data.documentId,
        workflow_id: data.workflowId,
        current_step: 1,
        status: 'em_aprovacao'
      }),
    onSuccess: () => {
      toast.success('Processo de aprovação iniciado');
      queryClient.invalidateQueries({ queryKey: ['document-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      onApprovalComplete?.();
    },
    onError: () => {
      toast.error('Erro ao iniciar processo de aprovação');
    }
  });

  const updateApprovalMutation = useMutation({
    mutationFn: (data: {
      id: string;
      status: 'aprovado' | 'rejeitado';
      notes?: string;
      userId?: string;
    }) =>
      documentApprovalsService.updateApprovalStatus(
        data.id,
        data.status,
        data.userId,
        data.notes
      ),
    onSuccess: (_, variables) => {
      toast.success(
        variables.status === 'aprovado'
          ? 'Documento aprovado com sucesso'
          : 'Documento rejeitado'
      );
      queryClient.invalidateQueries({ queryKey: ['document-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      onApprovalComplete?.();
    },
    onError: () => {
      toast.error('Erro ao processar aprovação');
    }
  });

  const handleStartApproval = () => {
    if (!documentId) return;

    createApprovalMutation.mutate({
      documentId,
      workflowId: selectedWorkflowId || undefined
    });
  };

  const handleApprove = (approvalId: string) => {
    updateApprovalMutation.mutate({
      id: approvalId,
      status: 'aprovado',
      notes: approvalNotes,
      userId: 'current-user' // TODO: Get current user ID
    });
    setApprovalNotes('');
  };

  const handleReject = (approvalId: string) => {
    if (!rejectionReason.trim()) {
      toast.error('Por favor, informe o motivo da rejeição');
      return;
    }

    updateApprovalMutation.mutate({
      id: approvalId,
      status: 'rejeitado',
      notes: rejectionReason,
      userId: 'current-user' // TODO: Get current user ID
    });
    setRejectionReason('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'em_aprovacao':
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />Em Aprovação</Badge>;
      case 'aprovado':
        return <Badge variant="default" className="gap-1 bg-green-500"><CheckCircle2 className="h-3 w-3" />Aprovado</Badge>;
      case 'rejeitado':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Rejeitado</Badge>;
      case 'rascunho':
        return <Badge variant="secondary" className="gap-1">Rascunho</Badge>;
      case 'obsoleto':
        return <Badge variant="outline" className="gap-1 text-muted-foreground">Obsoleto</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const currentApproval = approvals?.find(a => a.status === 'em_aprovacao');
  const hasActiveApproval = !!currentApproval;
  const displayApprovals = documentId ? approvals : pendingApprovals;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {documentId 
              ? `Aprovação - ${documentName}`
              : 'Aprovações Pendentes'
            }
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Start New Approval Section - Only show for specific document */}
            {documentId && !hasActiveApproval && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Iniciar Processo de Aprovação</CardTitle>
                  <CardDescription>
                    Configure o fluxo de aprovação para este documento
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="workflow">Fluxo de Aprovação (Opcional)</Label>
                    <Select value={selectedWorkflowId} onValueChange={setSelectedWorkflowId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um fluxo ou deixe em branco para aprovação simples" />
                      </SelectTrigger>
                      <SelectContent>
                        {workflows?.map(workflow => (
                          <SelectItem key={workflow.id} value={workflow.id}>
                            {workflow.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={handleStartApproval}
                    disabled={createApprovalMutation.isPending}
                    className="gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Enviar para Aprovação
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Active Approval Section */}
            {hasActiveApproval && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    Aprovação Pendente
                  </CardTitle>
                  <CardDescription>
                    Este documento está aguardando aprovação
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      {getStatusBadge(currentApproval.status)}
                      <p className="text-sm text-muted-foreground mt-1">
                        Iniciado em {new Date(currentApproval.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Etapa Atual</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {currentApproval.current_step}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="approval-notes">Observações da Aprovação</Label>
                      <Textarea
                        id="approval-notes"
                        value={approvalNotes}
                        onChange={(e) => setApprovalNotes(e.target.value)}
                        placeholder="Adicione observações sobre a aprovação (opcional)"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="rejection-reason">Motivo da Rejeição</Label>
                      <Textarea
                        id="rejection-reason"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Descreva o motivo da rejeição (obrigatório para rejeitar)"
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={() => handleApprove(currentApproval.id)}
                        disabled={updateApprovalMutation.isPending}
                        className="gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Aprovar Documento
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleReject(currentApproval.id)}
                        disabled={updateApprovalMutation.isPending || !rejectionReason.trim()}
                        className="gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Rejeitar Documento
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Approval History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {documentId ? 'Histórico de Aprovações' : 'Todas as Aprovações Pendentes'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">Carregando aprovações...</div>
                  </div>
                ) : !displayApprovals?.length ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {documentId 
                        ? 'Nenhuma aprovação encontrada para este documento'
                        : 'Nenhuma aprovação pendente'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {displayApprovals.map((approval: any) => (
                      <Card key={approval.id} className="transition-all hover:shadow-sm">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              {!documentId && (
                                <div>
                                  <p className="font-medium text-sm">
                                    {approval.documents?.file_name || 'Documento sem nome'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Tipo: {approval.documents?.document_type || 'N/A'}
                                  </p>
                                </div>
                              )}
                              {getStatusBadge(approval.status)}
                            </div>
                            <div className="text-right text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDistanceToNow(new Date(approval.created_at), {
                                  addSuffix: true,
                                  locale: ptBR
                                })}
                              </div>
                            </div>
                          </div>

                          {approval.approval_notes && (
                            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                              <p className="text-sm font-medium text-green-800">Observações:</p>
                              <p className="text-sm text-green-700">{approval.approval_notes}</p>
                            </div>
                          )}

                          {approval.rejection_reason && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                              <p className="text-sm font-medium text-red-800">Motivo da Rejeição:</p>
                              <p className="text-sm text-red-700">{approval.rejection_reason}</p>
                            </div>
                          )}

                          {approval.approver_user_id && (
                            <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                              <User className="h-4 w-4" />
                              Processado por: {approval.approver_user_id}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};