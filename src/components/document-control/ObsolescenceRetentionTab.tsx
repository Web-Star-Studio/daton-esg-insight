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
import { AlertTriangle, Archive, Trash2, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { gedDocumentsService } from "@/services/gedDocuments";
import {
  applyDocumentDisposition,
  getPendingDocumentDispositions,
  type DispositionAction,
} from "@/services/documentCompliance";
import { EnhancedLoading } from "@/components/ui/enhanced-loading";

export const ObsolescenceRetentionTab = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [dispositionDialog, setDispositionDialog] = useState<{
    documentId: string;
    action: DispositionAction;
    documentName: string;
  } | null>(null);
  const [dispositionReason, setDispositionReason] = useState(
    "Conforme política de retenção ISO 9001 item 7.5"
  );

  const { data: reviewDocs = [], isLoading: isLoadingReview } = useQuery({
    queryKey: ["documents-for-review"],
    queryFn: () => gedDocumentsService.getDocumentsForReview(),
  });

  const { data: pendingDispositions = [], isLoading: isLoadingDispositions } = useQuery({
    queryKey: ["document-compliance", "pending-dispositions"],
    queryFn: getPendingDocumentDispositions,
  });

  const dispositionMutation = useMutation({
    mutationFn: ({ documentId, action, reason }: { documentId: string; action: DispositionAction; reason: string }) =>
      applyDocumentDisposition(documentId, action, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-compliance", "pending-dispositions"] });
      queryClient.invalidateQueries({ queryKey: ["documents-for-review"] });
      toast({ title: "Disposição aplicada", description: "Ação registrada na trilha de auditoria." });
      setDispositionDialog(null);
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const confirmDisposition = () => {
    if (!dispositionDialog) return;
    if (!dispositionReason.trim()) {
      toast({ title: "Motivo obrigatório", description: "Justificativa é obrigatória.", variant: "destructive" });
      return;
    }
    dispositionMutation.mutate({
      documentId: dispositionDialog.documentId,
      action: dispositionDialog.action,
      reason: dispositionReason.trim(),
    });
  };

  const isLoading = isLoadingReview || isLoadingDispositions;

  if (isLoading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <EnhancedLoading size="lg" text="Carregando dados de obsolescência..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 12-month review alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Documentos para Revisão (Ciclo 12 meses)
          </CardTitle>
          <CardDescription>
            Documentos que atingiram ou ultrapassaram a data de próxima revisão.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reviewDocs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum documento pendente de revisão no momento.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Data Revisão</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviewDocs.map((doc: any) => {
                    const reviewDate = doc.next_review_date ? new Date(`${doc.next_review_date}T00:00:00`) : null;
                    const isOverdue = reviewDate && reviewDate < new Date();
                    return (
                      <TableRow key={doc.id}>
                        <TableCell className="font-mono font-medium">{doc.code || "—"}</TableCell>
                        <TableCell>{doc.file_name}</TableCell>
                        <TableCell>
                          {reviewDate ? reviewDate.toLocaleDateString("pt-BR") : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={isOverdue ? "destructive" : "secondary"}>
                            {isOverdue ? (
                              <span className="flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" /> Vencido
                              </span>
                            ) : (
                              "Próximo"
                            )}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disposition */}
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
          {pendingDispositions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum documento pendente de disposição.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Documento</TableHead>
                    <TableHead>Retenção</TableHead>
                    <TableHead>Data Limite</TableHead>
                    <TableHead>Dias em atraso</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingDispositions.map((doc: any) => (
                    <TableRow key={doc.id}>
                      <TableCell>{doc.file_name}</TableCell>
                      <TableCell>{doc.retention_period}</TableCell>
                      <TableCell>
                        {new Date(`${doc.due_date}T00:00:00`).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>{doc.days_overdue}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            disabled={dispositionMutation.isPending}
                            onClick={() =>
                              setDispositionDialog({
                                documentId: doc.id,
                                action: "arquivar",
                                documentName: doc.file_name,
                              })
                            }
                          >
                            <Archive className="h-3.5 w-3.5" /> Arquivar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="gap-1"
                            disabled={dispositionMutation.isPending}
                            onClick={() =>
                              setDispositionDialog({
                                documentId: doc.id,
                                action: "destruir",
                                documentName: doc.file_name,
                              })
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Destruir
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

      {/* Disposition confirmation dialog */}
      <Dialog open={!!dispositionDialog} onOpenChange={() => setDispositionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dispositionDialog?.action === "arquivar" ? "Confirmar Arquivamento" : "Confirmar Destruição Lógica"}
            </DialogTitle>
            <DialogDescription>
              Documento: {dispositionDialog?.documentName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Motivo da disposição *</Label>
            <Textarea
              value={dispositionReason}
              onChange={(e) => setDispositionReason(e.target.value)}
              rows={4}
              placeholder="Justificativa formal..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDispositionDialog(null)}>Cancelar</Button>
            <Button
              variant={dispositionDialog?.action === "destruir" ? "destructive" : "default"}
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
