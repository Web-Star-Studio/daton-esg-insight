import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, CheckCircle, AlertTriangle, AlertCircle, Info, Loader2 } from "lucide-react";
import { useAuditOccurrences, useDeleteOccurrence, useCloseOccurrence } from "@/hooks/audit/useExecution";
import { AuditOccurrence } from "@/services/audit/execution";
import { OccurrenceModal } from "./OccurrenceModal";
import { supabase } from "@/integrations/supabase/client";
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

interface OccurrencesListProps {
  auditId: string;
  companyId: string;
}

export function OccurrencesList({ auditId, companyId }: OccurrencesListProps) {
  const { data: occurrences, isLoading } = useAuditOccurrences(auditId);
  const deleteOccurrence = useDeleteOccurrence();
  const closeOccurrence = useCloseOccurrence();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingOccurrence, setEditingOccurrence] = useState<AuditOccurrence | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [occurrenceToDelete, setOccurrenceToDelete] = useState<AuditOccurrence | null>(null);

  const typeConfig: Record<string, { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    'NC_maior': { label: 'NC Maior', icon: <AlertCircle className="h-4 w-4" />, variant: 'destructive' },
    'NC_menor': { label: 'NC Menor', icon: <AlertTriangle className="h-4 w-4" />, variant: 'default' },
    'OM': { label: 'Oportunidade', icon: <Info className="h-4 w-4" />, variant: 'secondary' },
    'Observacao': { label: 'Observação', icon: <Info className="h-4 w-4" />, variant: 'outline' },
  };

  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
    'Aberta': { label: 'Aberta', variant: 'destructive' },
    'Em_Tratamento': { label: 'Em Tratamento', variant: 'default' },
    'Aguardando_Verificacao': { label: 'Aguardando Verificação', variant: 'secondary' },
    'Fechada': { label: 'Fechada', variant: 'outline' },
    'Cancelada': { label: 'Cancelada', variant: 'outline' },
  };

  const handleEdit = (occurrence: AuditOccurrence) => {
    setEditingOccurrence(occurrence);
    setModalOpen(true);
  };

  const handleDelete = (occurrence: AuditOccurrence) => {
    setOccurrenceToDelete(occurrence);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (occurrenceToDelete) {
      await deleteOccurrence.mutateAsync({
        id: occurrenceToDelete.id,
        auditId,
      });
      setDeleteConfirmOpen(false);
      setOccurrenceToDelete(null);
    }
  };

  const handleClose = async (occurrence: AuditOccurrence) => {
    const { data: { user } } = await supabase.auth.getUser();
    await closeOccurrence.mutateAsync({
      id: occurrence.id,
      closedBy: user?.id || '',
    });
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingOccurrence(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-medium">Ocorrências</CardTitle>
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Ocorrência
          </Button>
        </CardHeader>
        <CardContent>
          {occurrences && occurrences.length > 0 ? (
            <div className="space-y-3">
              {occurrences.map((occurrence) => {
                const type = typeConfig[occurrence.occurrence_type] || typeConfig['Observacao'];
                const status = statusConfig[occurrence.status] || statusConfig['Aberta'];

                return (
                  <div
                    key={occurrence.id}
                    className="flex items-start gap-4 p-4 rounded-lg border bg-card"
                  >
                    <div className={`p-2 rounded-full ${
                      occurrence.occurrence_type === 'NC_maior' ? 'bg-destructive/10 text-destructive' :
                      occurrence.occurrence_type === 'NC_menor' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {type.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={type.variant} className="text-xs">
                          {type.label}
                        </Badge>
                        <Badge variant={status.variant} className="text-xs">
                          {status.label}
                        </Badge>
                        {occurrence.occurrence_number && (
                          <span className="text-xs text-muted-foreground font-mono">
                            {occurrence.occurrence_number}
                          </span>
                        )}
                      </div>
                      <h4 className="font-medium">{occurrence.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {occurrence.description}
                      </p>
                      {occurrence.due_date && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Prazo: {new Date(occurrence.due_date).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {occurrence.status !== 'Fechada' && occurrence.status !== 'Cancelada' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleClose(occurrence)}
                          title="Fechar ocorrência"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(occurrence)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(occurrence)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma ocorrência registrada</p>
            </div>
          )}
        </CardContent>
      </Card>

      <OccurrenceModal
        open={modalOpen}
        onOpenChange={handleModalClose}
        auditId={auditId}
        companyId={companyId}
        occurrence={editingOccurrence}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Ocorrência</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a ocorrência "{occurrenceToDelete?.title}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
