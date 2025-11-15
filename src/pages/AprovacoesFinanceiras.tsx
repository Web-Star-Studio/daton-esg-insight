import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { approvalWorkflowsService, ApprovalRequest } from '@/services/approvalWorkflows';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X, Clock, FileText } from 'lucide-react';
import { unifiedToast } from '@/utils/unifiedToast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AprovacoesFinanceiras() {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [comments, setComments] = useState('');

  const { data: pendingRequests = [], isLoading } = useQuery({
    queryKey: ['approval-requests-pending'],
    queryFn: () => approvalWorkflowsService.getPendingRequests(),
  });

  const approveMutation = useMutation({
    mutationFn: ({ requestId, stepNumber }: { requestId: string; stepNumber: number }) =>
      approvalWorkflowsService.approveRequest(requestId, stepNumber, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-requests-pending'] });
      setSelectedRequest(null);
      setComments('');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ requestId, stepNumber }: { requestId: string; stepNumber: number }) =>
      approvalWorkflowsService.rejectRequest(requestId, stepNumber, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-requests-pending'] });
      setSelectedRequest(null);
      setComments('');
    },
  });

  const handleApprove = (request: ApprovalRequest) => {
    if (!comments.trim()) {
      unifiedToast.warning('Adicione um comentário para aprovar');
      return;
    }
    approveMutation.mutate({ requestId: request.id, stepNumber: request.current_step || 1 });
  };

  const handleReject = (request: ApprovalRequest) => {
    if (!comments.trim()) {
      unifiedToast.error('Adicione um comentário explicando a rejeição');
      return;
    }
    rejectMutation.mutate({ requestId: request.id, stepNumber: request.current_step || 1 });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'Pendente': 'outline',
      'Em Análise': 'secondary',
      'Aprovado': 'default',
      'Rejeitado': 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const getEntityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'accounts_payable': 'Conta a Pagar',
      'accounts_receivable': 'Conta a Receber',
      'accounting_entry': 'Lançamento Contábil',
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Aprovações Financeiras</h1>
        <p className="text-muted-foreground">Gerencie solicitações de aprovação pendentes</p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">
            <Clock className="mr-2 h-4 w-4" />
            Pendentes ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            <FileText className="mr-2 h-4 w-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                <Check className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Nenhuma aprovação pendente</p>
                <p className="text-sm text-muted-foreground">
                  Todas as solicitações foram processadas
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pendingRequests.map((request) => (
                <Card key={request.id} className={selectedRequest?.id === request.id ? 'border-primary' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          {getEntityTypeLabel(request.entity_type)}
                        </CardTitle>
                        <CardDescription>
                          Solicitado em {format(new Date(request.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </CardDescription>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      <div>ID da Entidade: {request.entity_id}</div>
                      <div>Etapa: {request.current_step}</div>
                    </div>

                    {selectedRequest?.id === request.id && (
                      <div className="space-y-4 border-t pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="comments">Comentários *</Label>
                          <Textarea
                            id="comments"
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            placeholder="Adicione seus comentários sobre a aprovação/rejeição"
                            rows={3}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(null);
                              setComments('');
                            }}
                          >
                            Cancelar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleReject(request)}
                            disabled={rejectMutation.isPending}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Rejeitar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(request)}
                            disabled={approveMutation.isPending}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Aprovar
                          </Button>
                        </div>
                      </div>
                    )}

                    {selectedRequest?.id !== request.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setSelectedRequest(request)}
                      >
                        Revisar
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Histórico em desenvolvimento</p>
              <p className="text-sm text-muted-foreground">
                Em breve você poderá visualizar o histórico completo de aprovações
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
