import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  applyDocumentDisposition,
  getNamedDocumentGroups,
  getPendingDocumentDispositions,
  runBackupHealthCheck,
  type DispositionAction,
} from "@/services/documentCompliance";
import { supabase } from "@/integrations/supabase/client";
import { Database, ShieldCheck, Trash2 } from "lucide-react";

export const DocumentComplianceOperationsTab = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [lastBackupCheck, setLastBackupCheck] = useState<Awaited<
    ReturnType<typeof runBackupHealthCheck>
  > | null>(null);
  const [isDispositionDialogOpen, setIsDispositionDialogOpen] = useState(false);
  const [pendingDisposition, setPendingDisposition] = useState<{
    documentId: string;
    action: DispositionAction;
    documentName: string;
  } | null>(null);
  const [pendingDispositionReason, setPendingDispositionReason] = useState(
    "Conforme política de retenção ISO 9001 item 7.5",
  );

  const namedGroups = getNamedDocumentGroups();

  const { data: pendingDispositions = [], isLoading: isLoadingDispositions } = useQuery({
    queryKey: ["document-compliance", "pending-dispositions"],
    queryFn: getPendingDocumentDispositions,
  });

  const backupCheckMutation = useMutation({
    mutationFn: runBackupHealthCheck,
    onSuccess: (result) => {
      setLastBackupCheck(result);
      toast({
        title: "Health check executado",
        description:
          result.overallStatus === "healthy"
            ? "Todos os checks de backup/saúde foram concluídos com sucesso."
            : "Foram encontrados pontos de atenção no health check.",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const dispositionMutation = useMutation({
    mutationFn: ({ documentId, action, reason }: { documentId: string; action: DispositionAction; reason: string }) =>
      applyDocumentDisposition(documentId, action, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-compliance", "pending-dispositions"] });
      queryClient.invalidateQueries({ queryKey: ["regulatory-documents"] });
      toast({ title: "Disposição aplicada", description: "A ação foi registrada na trilha de auditoria." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const auditCleanupMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await (supabase as any).rpc("cleanup_document_audit_trail", {
        retention_years: 3,
      });

      if (error) {
        throw new Error(error.message);
      }

      return Number(data || 0);
    },
    onSuccess: (removedRows) => {
      toast({
        title: "Retenção de trilha aplicada",
        description: `${removedRows} registro(s) com mais de 3 anos foram removidos.`,
      });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const handleDisposition = (documentId: string, action: DispositionAction, documentName: string) => {
    setPendingDisposition({ documentId, action, documentName });
    setPendingDispositionReason("Conforme política de retenção ISO 9001 item 7.5");
    setIsDispositionDialogOpen(true);
  };

  const confirmDisposition = () => {
    if (!pendingDisposition) return;

    const reason = pendingDispositionReason.trim();
    if (!reason) {
      toast({
        title: "Motivo obrigatório",
        description: "A ação de disposição exige justificativa registrada.",
        variant: "destructive",
      });
      return;
    }

    dispositionMutation.mutate(
      {
        documentId: pendingDisposition.documentId,
        action: pendingDisposition.action,
        reason,
      },
      {
        onSuccess: () => {
          setIsDispositionDialogOpen(false);
          setPendingDisposition(null);
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Backup e Saúde da Plataforma
          </CardTitle>
          <CardDescription>
            Monitoramento operacional para evidência de backup/proteção e registro de anomalias.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => backupCheckMutation.mutate()}
              disabled={backupCheckMutation.isPending}
            >
              {backupCheckMutation.isPending ? "Executando..." : "Executar health check"}
            </Button>
            <Button
              variant="outline"
              onClick={() => auditCleanupMutation.mutate()}
              disabled={auditCleanupMutation.isPending}
            >
              {auditCleanupMutation.isPending
                ? "Aplicando retenção..."
                : "Aplicar retenção da trilha (3+ anos)"}
            </Button>
          </div>

          {lastBackupCheck && (
            <div className="space-y-2">
              <Badge
                variant="outline"
                className={
                  lastBackupCheck.overallStatus === "healthy"
                    ? "border-green-500 text-green-700"
                    : lastBackupCheck.overallStatus === "warning"
                      ? "border-yellow-500 text-yellow-700"
                      : "border-red-500 text-red-700"
                }
              >
                Status geral: {lastBackupCheck.overallStatus}
              </Badge>
              <div className="rounded-lg border p-3 space-y-2">
                {lastBackupCheck.checks.map((check) => (
                  <div key={check.key} className="flex items-center justify-between gap-3 text-sm">
                    <span>{check.label}</span>
                    <span className="text-muted-foreground">{check.details}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Disposição por Retenção
          </CardTitle>
          <CardDescription>
            Documentos vencidos por retenção com ações formais de arquivamento ou destruição lógica.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingDispositions ? (
            <div className="text-muted-foreground">Carregando documentos pendentes de disposição...</div>
          ) : pendingDispositions.length === 0 ? (
            <div className="text-muted-foreground">Nenhum documento pendente de disposição no momento.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Documento</TableHead>
                    <TableHead>Retenção</TableHead>
                    <TableHead>Data Limite</TableHead>
                    <TableHead>Dias em atraso</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingDispositions.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>{doc.file_name}</TableCell>
                      <TableCell>{doc.retention_period}</TableCell>
                      <TableCell>{new Date(`${doc.due_date}T00:00:00`).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>{doc.days_overdue}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={dispositionMutation.isPending}
                            onClick={() => handleDisposition(doc.id, "arquivar", doc.file_name)}
                          >
                            Arquivar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={dispositionMutation.isPending}
                            onClick={() => handleDisposition(doc.id, "destruir", doc.file_name)}
                          >
                            Destruir
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Grupos Nomeados de Acesso
          </CardTitle>
          <CardDescription>
            Grupos padrão para padronização de permissões documentais.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {namedGroups.map((group) => (
            <div key={group.name} className="rounded-lg border p-3 text-sm">
              <div className="font-medium">{group.name}</div>
              <div className="text-muted-foreground">{group.description}</div>
              <div className="text-muted-foreground">
                Permissão padrão: <span className="font-medium">{group.defaultPermissionLevel}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={isDispositionDialogOpen} onOpenChange={setIsDispositionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingDisposition?.action === "arquivar" ? "Confirmar arquivamento" : "Confirmar destruição lógica"}
            </DialogTitle>
            <DialogDescription>
              Documento: <span className="font-medium">{pendingDisposition?.documentName}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="disposition-reason">Motivo da disposição</Label>
            <Textarea
              id="disposition-reason"
              value={pendingDispositionReason}
              onChange={(event) => setPendingDispositionReason(event.target.value)}
              rows={4}
              placeholder="Descreva o motivo formal da disposição..."
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDispositionDialogOpen(false);
                setPendingDisposition(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant={pendingDisposition?.action === "destruir" ? "destructive" : "default"}
              disabled={dispositionMutation.isPending}
              onClick={confirmDisposition}
            >
              {dispositionMutation.isPending ? "Aplicando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
