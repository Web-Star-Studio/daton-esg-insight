import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  useLAIARevisions,
  useLAIAPendingChangesCount,
  useValidateRevision,
  useFinalizeRevision,
  useUpdateRevisionTitle,
  useDeleteRevision,
} from "@/hooks/useLAIARevisions";
import { LAIARevisionDetail } from "./LAIARevisionDetail";
import type { LAIARevision } from "@/services/laiaRevisionService";
import {
  RotateCcw,
  Clock,
  CheckCircle2,
  FileText,
  Eye,
  Check,
  Pencil,
  Trash2,
  Loader2,
  GitCommit,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function LAIARevisoes() {
  const { data: revisions, isLoading } = useLAIARevisions();
  const { data: pendingCount } = useLAIAPendingChangesCount();
  const validateMutation = useValidateRevision();
  const finalizeMutation = useFinalizeRevision();
  const updateTitleMutation = useUpdateRevisionTitle();
  const deleteMutation = useDeleteRevision();

  const [selectedRevisionId, setSelectedRevisionId] = useState<string | null>(null);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [finalizeTitle, setFinalizeTitle] = useState("");
  const [finalizeDescription, setFinalizeDescription] = useState("");

  const draftRevision = revisions?.find(r => r.status === 'rascunho');
  const validatedRevision = revisions?.find(r => r.status === 'validada');
  const finalizedRevisions = revisions?.filter(r => r.status === 'finalizada') || [];

  const pendingRevision = draftRevision || validatedRevision;

  const handleValidate = async (id: string) => {
    await validateMutation.mutateAsync(id);
  };

  const handleFinalize = async (id: string) => {
    if (!finalizeTitle.trim()) return;
    await finalizeMutation.mutateAsync({ id, title: finalizeTitle, description: finalizeDescription });
    setFinalizeTitle("");
    setFinalizeDescription("");
  };

  const handleSaveTitle = async (id: string) => {
    await updateTitleMutation.mutateAsync({ id, title: editTitle, description: editDescription });
    setEditingTitleId(null);
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const startEditTitle = (rev: LAIARevision) => {
    setEditingTitleId(rev.id);
    setEditTitle(rev.title);
    setEditDescription(rev.description || "");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'rascunho':
        return <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/20"><Clock className="h-3 w-3 mr-1" /> Rascunho</Badge>;
      case 'validada':
        return <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-950/20"><CheckCircle2 className="h-3 w-3 mr-1" /> Validada</Badge>;
      case 'finalizada':
        return <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 dark:bg-green-950/20"><Check className="h-3 w-3 mr-1" /> Finalizada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Revision (Draft or Validated) */}
      {pendingRevision && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
                  <GitCommit className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    Revisão {String(pendingRevision.revision_number).padStart(2, '0')} — Pendente
                  </CardTitle>
                  <CardDescription>
                    {pendingRevision.changes_count || pendingCount || 0} alteração(ões) registrada(s)
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(pendingRevision.status)}
                {pendingCount !== undefined && pendingCount > 0 && (
                  <Badge className="bg-amber-500 text-white">{pendingCount}</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRevisionId(pendingRevision.id)}
              >
                <Eye className="h-4 w-4 mr-1" /> Visualizar Alterações
              </Button>

              {pendingRevision.status === 'rascunho' && (
                <>
                  <Button
                    size="sm"
                    onClick={() => handleValidate(pendingRevision.id)}
                    disabled={validateMutation.isPending || (pendingRevision.changes_count === 0 && (pendingCount || 0) === 0)}
                  >
                    {validateMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                    Validar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(pendingRevision.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Descartar
                  </Button>
                </>
              )}

              {pendingRevision.status === 'validada' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(pendingRevision.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Descartar
                </Button>
              )}
            </div>

            {/* Finalize form for validated revisions */}
            {pendingRevision.status === 'validada' && (
              <div className="space-y-3 border-t pt-4">
                <h4 className="font-medium text-sm">Finalizar Revisão</h4>
                <div className="space-y-2">
                  <Label htmlFor="finalize-title">Título da Revisão *</Label>
                  <Input
                    id="finalize-title"
                    value={finalizeTitle}
                    onChange={(e) => setFinalizeTitle(e.target.value)}
                    placeholder="Ex: Revisão 09 - Revisão Geral e análise crítica de POA e PIR..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="finalize-desc">Descrição (opcional)</Label>
                  <Textarea
                    id="finalize-desc"
                    value={finalizeDescription}
                    onChange={(e) => setFinalizeDescription(e.target.value)}
                    placeholder="Descreva as alterações realizadas nesta revisão..."
                    rows={2}
                  />
                </div>
                <Button
                  onClick={() => handleFinalize(pendingRevision.id)}
                  disabled={!finalizeTitle.trim() || finalizeMutation.isPending}
                >
                  {finalizeMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileText className="h-4 w-4 mr-1" />}
                  Finalizar Revisão
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No pending and no finalized */}
      {!pendingRevision && finalizedRevisions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <RotateCcw className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhuma revisão registrada</h3>
            <p className="text-sm text-muted-foreground max-w-md mt-1">
              As revisões são criadas automaticamente quando você edita avaliações ou setores.
              Edite uma avaliação para gerar a primeira revisão.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Finalized Revisions History */}
      {finalizedRevisions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Histórico de Revisões
            </CardTitle>
            <CardDescription>
              {finalizedRevisions.length} revisão(ões) finalizada(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {finalizedRevisions.map((rev, index) => (
                <div key={rev.id}>
                  {index > 0 && <Separator className="mb-3" />}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-primary">
                          {String(rev.revision_number).padStart(2, '0')}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        {editingTitleId === rev.id ? (
                          <div className="space-y-2">
                            <Input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="text-sm"
                            />
                            <Textarea
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              placeholder="Descrição..."
                              rows={2}
                              className="text-sm"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleSaveTitle(rev.id)} disabled={updateTitleMutation.isPending}>
                                Salvar
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingTitleId(null)}>
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="font-medium text-sm truncate">
                              {rev.title || `Revisão ${String(rev.revision_number).padStart(2, '0')}`}
                            </p>
                            {rev.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {rev.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              {rev.finalized_at && (
                                <span>{format(new Date(rev.finalized_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                              )}
                              {rev.creator?.full_name && (
                                <span>por {rev.creator.full_name}</span>
                              )}
                              <span>{rev.changes_count || 0} alteração(ões)</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSelectedRevisionId(rev.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {editingTitleId !== rev.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => startEditTitle(rev)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legacy Revisions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Histórico Legado (FPLAN-002)
          </CardTitle>
          <CardDescription>
            Revisões anteriores à implementação do sistema digital
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {LEGACY_REVISIONS.map((rev, index) => (
              <div key={rev.number}>
                {index > 0 && <Separator className="mb-3" />}
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-muted-foreground">
                      {rev.number}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{rev.title}</p>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Legado</Badge>
                    </div>
                    {rev.date && (
                      <p className="text-xs text-muted-foreground mt-0.5">{rev.date}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedRevisionId} onOpenChange={(open) => !open && setSelectedRevisionId(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Revisão</DialogTitle>
          </DialogHeader>
          {selectedRevisionId && (
            <LAIARevisionDetail revisionId={selectedRevisionId} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const LEGACY_REVISIONS = [
  { number: "00", title: "Emissão inicial do documento", date: "25/08/2020" },
  { number: "01", title: "Alteração item 5 e 5.3", date: "04/12/2020" },
  { number: "02", title: "Detalhamento controles operacionais", date: "17/12/2020" },
  { number: "03", title: "Alteração FPLAN-003 para LIRA", date: "18/10/2021" },
  { number: "04", title: "Inclusão Carregamento e Heliponto (PIR) e alteração Construção Civil (atual) (POA e PIR)", date: "30/05/2022" },
  { number: "05", title: "Inclusão Museu (PIR) e Posto Abastecimento (POA)", date: "30/08/2022" },
  { number: "06", title: "Inclusão Espaço Saúde (PIR); Central do Motorista (POA) e Elaboração LAIA SBC e Porto Real", date: "05/09/2023" },
  { number: "07", title: "Revisão geral - análise crítica do documento", date: "03/10/2023" },
  { number: "08", title: "Inclusão aspectos: ruído, odor, tonner e possibilidade de incêndio - POA, PIR", date: "23/10/2022" },
  { number: "09", title: "Revisão Geral e análise crítica de POA e PIR; Elaboração LAIA de Duque de Caxias, Anápolis e São José dos Pinhais", date: "15/04/2024" },
  { number: "10", title: "Revisão Geral (Queimadas Excessivas)", date: "24/09/2024" },
  { number: "11", title: "Troca de Classificação dos Resíduos de acordo com NBR 10.004-2024, inclusão de Sala de Descanso em GO-CARREGAMENTO, Inclusão das Unidades ES, IRA e CHUÍ", date: "30/06/2025" },
  { number: "12", title: "Perspectiva de estágio (ajustes)", date: null },
];
