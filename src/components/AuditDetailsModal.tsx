import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar, User, FileText, AlertTriangle } from "lucide-react";
import { auditService, type Audit, type AuditFinding } from "@/services/audit";
import { AuditFindingModal } from "@/components/AuditFindingModal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface AuditDetailsModalProps {
  audit: Audit;
  isOpen: boolean;
  onClose: () => void;
}

export function AuditDetailsModal({ audit, isOpen, onClose }: AuditDetailsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFindingModalOpen, setIsFindingModalOpen] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<AuditFinding | null>(null);

  const { data: findings, isLoading: findingsLoading } = useQuery({
    queryKey: ['audit-findings', audit.id],
    queryFn: () => auditService.getAuditFindings(audit.id),
    enabled: isOpen,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  const updateFindingMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      auditService.updateAuditFinding(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-findings', audit.id] });
      toast({
        title: "Achado atualizado",
        description: "O status do achado foi atualizado com sucesso."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar achado",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive"
      });
    }
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      "Aberta": "destructive",
      "Em Tratamento": "default",
      "Resolvida": "secondary"
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getSeverityBadge = (severity: string) => {
    const severityConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className: string }> = {
      "Crítica": { variant: "destructive", className: "bg-red-100 text-red-800 border-red-300" },
      "Maior": { variant: "default", className: "bg-orange-100 text-orange-800 border-orange-300" },
      "Menor": { variant: "secondary", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
      "Oportunidade": { variant: "outline", className: "bg-blue-100 text-blue-800 border-blue-300" }
    };
    
    const config = severityConfig[severity] || { variant: "outline" as const, className: "" };
    return <Badge variant={config.variant} className={config.className}>{severity}</Badge>;
  };

  const handleStatusChange = (findingId: string, newStatus: string) => {
    updateFindingMutation.mutate({
      id: findingId,
      data: { status: newStatus }
    });
  };

  const findingStats = {
    total: findings?.length || 0,
    open: findings?.filter(f => f.status === 'Aberta').length || 0,
    inProgress: findings?.filter(f => f.status === 'Em Tratamento').length || 0,
    resolved: findings?.filter(f => f.status === 'Resolvida').length || 0
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {audit.title}
          </DialogTitle>
          <DialogDescription>
            Detalhes da auditoria e gerenciamento de achados
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="findings">
              Achados ({findingStats.total})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Informações da Auditoria</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-sm font-medium">Tipo:</span>
                    <p className="text-sm text-muted-foreground">{audit.audit_type}</p>
                  </div>
                  {audit.auditor && (
                    <div>
                      <span className="text-sm font-medium">Auditor:</span>
                      <p className="text-sm text-muted-foreground">{audit.auditor}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium">Status:</span>
                    <div className="mt-1">
                      <Badge variant="outline">{audit.status}</Badge>
                    </div>
                  </div>
                  {audit.start_date && (
                    <div>
                      <span className="text-sm font-medium">Data de Início:</span>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(audit.start_date), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                  {audit.end_date && (
                    <div>
                      <span className="text-sm font-medium">Data de Término:</span>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(audit.end_date), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Estatísticas dos Achados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Total de Achados:</span>
                    <span className="font-medium">{findingStats.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Abertas:</span>
                    <Badge variant="destructive" className="text-xs">
                      {findingStats.open}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Em Tratamento:</span>
                    <Badge variant="default" className="text-xs">
                      {findingStats.inProgress}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Resolvidas:</span>
                    <Badge variant="secondary" className="text-xs">
                      {findingStats.resolved}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {audit.scope && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Escopo da Auditoria</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {audit.scope}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="findings" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium">Achados da Auditoria</h4>
                <p className="text-sm text-muted-foreground">
                  Gerencie não-conformidades e oportunidades de melhoria
                </p>
              </div>
              <Button onClick={() => setIsFindingModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Achado
              </Button>
            </div>

            {findingsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : findings?.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="text-center py-12">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                    <AlertTriangle className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="mt-2 text-lg font-medium">Nenhum achado encontrado</h3>
                  <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
                    Esta auditoria ainda não possui achados registrados. Comece adicionando o primeiro achado.
                  </p>
                  <div className="mt-6">
                    <Button onClick={() => setIsFindingModalOpen(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Adicionar Primeiro Achado
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {findings?.map((finding) => (
                  <Card key={finding.id} className="cursor-pointer hover:bg-muted/30 transition-colors border-l-4 border-l-transparent hover:border-l-primary/50">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            {getSeverityBadge(finding.severity)}
                            {getStatusBadge(finding.status)}
                            {finding.due_date && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                <Calendar className="h-3 w-3" />
                                Prazo: {format(new Date(finding.due_date), "dd/MM/yyyy", { locale: ptBR })}
                              </div>
                            )}
                          </div>
                          <h4 className="text-sm font-medium mb-2 line-clamp-2">{finding.description}</h4>
                          {finding.profiles?.full_name && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                              <User className="h-3 w-3" />
                              <span>Responsável: <strong>{finding.profiles.full_name}</strong></span>
                            </div>
                          )}
                          {finding.action_plan && (
                            <div className="bg-muted/50 p-3 rounded-md mt-3">
                              <p className="text-xs font-medium text-muted-foreground mb-1">Plano de Ação:</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">{finding.action_plan}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          {finding.status !== 'Resolvida' && (
                            <>
                              {finding.status === 'Aberta' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(finding.id, 'Em Tratamento');
                                  }}
                                  disabled={updateFindingMutation.isPending}
                                  className="text-xs"
                                >
                                  Iniciar Tratamento
                                </Button>
                              )}
                              {finding.status === 'Em Tratamento' && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(finding.id, 'Resolvida');
                                  }}
                                  disabled={updateFindingMutation.isPending}
                                  className="text-xs"
                                >
                                  Resolver
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedFinding(finding);
                                }}
                                className="text-xs"
                              >
                                Editar
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <AuditFindingModal
          auditId={audit.id}
          finding={selectedFinding}
          isOpen={isFindingModalOpen || !!selectedFinding}
          onClose={() => {
            setIsFindingModalOpen(false);
            setSelectedFinding(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['audit-findings', audit.id] });
            setIsFindingModalOpen(false);
            setSelectedFinding(null);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}