import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Pencil, 
  ExternalLink, 
  Calendar, 
  Building2, 
  User,
  FileText,
  History,
  Loader2,
  Plus,
  Trash2,
  Download
} from "lucide-react";
import { useLegislation, useUnitCompliances, useLegislationEvidences } from "@/hooks/data/useLegislations";
import { useBranches } from "@/services/branches";
import { LegislationStatusBadge, JurisdictionBadge } from "@/components/legislation/LegislationStatusBadge";
import { UnitComplianceModal } from "@/components/legislation/UnitComplianceModal";
import { EvidenceUploadModal } from "@/components/legislation/EvidenceUploadModal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "@/contexts/AuthContext";
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

const LegislationDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { selectedCompany } = useCompany();
  
  const { data: legislation, isLoading } = useLegislation(id);
  const { compliances, isLoading: isLoadingCompliances, upsertCompliance, isUpserting } = useUnitCompliances(id);
  const { evidences, isLoading: isLoadingEvidences, createEvidence, deleteEvidence } = useLegislationEvidences(id);
  const { data: branches } = useBranches();

  const [complianceModal, setComplianceModal] = useState<{
    open: boolean;
    branchId: string;
    branchName: string;
    existing?: any;
  }>({ open: false, branchId: '', branchName: '' });

  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [deleteEvidenceId, setDeleteEvidenceId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!legislation) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Legislação não encontrada</p>
          <Button onClick={() => navigate('/licenciamento/legislacoes')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const handleOpenComplianceModal = (branchId: string, branchName: string) => {
    const existing = compliances.find(c => c.branch_id === branchId);
    setComplianceModal({
      open: true,
      branchId,
      branchName,
      existing,
    });
  };

  const handleSaveCompliance = (data: any) => {
    upsertCompliance(data, {
      onSuccess: () => setComplianceModal({ open: false, branchId: '', branchName: '' }),
    });
  };

  const handleSaveEvidence = (data: any) => {
    createEvidence({
      ...data,
      legislation_id: id,
      company_id: selectedCompany?.id,
      uploaded_by: user?.id,
    }, {
      onSuccess: () => setEvidenceModalOpen(false),
    });
  };

  const handleDeleteEvidence = (evidenceId: string) => {
    deleteEvidence(evidenceId, {
      onSuccess: () => setDeleteEvidenceId(null),
    });
  };

  // Get branches that don't have compliance records yet
  const branchesWithCompliance = branches?.map(branch => {
    const compliance = compliances.find(c => c.branch_id === branch.id);
    return { ...branch, compliance };
  }) || [];

  return (
    <div className="space-y-6">
      <Helmet>
        <title>{legislation.title} | Legislações</title>
        <meta name="description" content={legislation.summary || legislation.title} />
      </Helmet>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/licenciamento/legislacoes')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="font-mono">
                {legislation.norm_type} {legislation.norm_number && `nº ${legislation.norm_number}`}
              </Badge>
              <JurisdictionBadge value={legislation.jurisdiction} />
              {legislation.theme && (
                <Badge 
                  style={{ 
                    backgroundColor: `${legislation.theme.color}20`,
                    color: legislation.theme.color,
                    borderColor: legislation.theme.color 
                  }}
                >
                  {legislation.theme.name}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold max-w-2xl">
              {legislation.title}
            </h1>
            {legislation.issuing_body && (
              <p className="text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {legislation.issuing_body}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {legislation.full_text_url && (
            <Button variant="outline" onClick={() => window.open(legislation.full_text_url, '_blank')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Texto Completo
            </Button>
          )}
          <Button onClick={() => navigate(`/licenciamento/legislacoes/${id}/editar`)}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-2">Aplicabilidade</p>
            <LegislationStatusBadge type="applicability" value={legislation.overall_applicability} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-2">Status de Atendimento</p>
            <LegislationStatusBadge type="status" value={legislation.overall_status} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-2">Próxima Revisão</p>
            <p className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {legislation.next_review_date 
                ? format(new Date(legislation.next_review_date), "dd/MM/yyyy", { locale: ptBR })
                : "Não definida"
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="units">Avaliação por Unidade</TabsTrigger>
          <TabsTrigger value="evidences">Evidências</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6 mt-6">
          {/* Summary */}
          {legislation.summary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ementa / Resumo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {legislation.summary}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Publicação</p>
                  <p className="font-medium">
                    {legislation.publication_date 
                      ? format(new Date(legislation.publication_date), "dd/MM/yyyy", { locale: ptBR })
                      : "-"
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Jurisdição</p>
                  <p className="font-medium capitalize">
                    {legislation.jurisdiction}
                    {legislation.state && ` - ${legislation.state}`}
                    {legislation.municipality && ` / ${legislation.municipality}`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Subtema</p>
                  <p className="font-medium">
                    {legislation.subtheme?.name || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Responsável</p>
                  <p className="font-medium flex items-center gap-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {legislation.responsible_user?.full_name || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Última Revisão</p>
                  <p className="font-medium">
                    {legislation.last_review_date 
                      ? format(new Date(legislation.last_review_date), "dd/MM/yyyy", { locale: ptBR })
                      : "-"
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Frequência de Revisão</p>
                  <p className="font-medium">
                    {legislation.review_frequency_days} dias
                  </p>
                </div>
              </div>

              {legislation.observations && (
                <>
                  <Separator className="my-6" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Observações</p>
                    <p className="whitespace-pre-wrap">{legislation.observations}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="units" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Avaliação por Unidade</CardTitle>
              <CardDescription>
                Avalie a aplicabilidade e conformidade desta legislação em cada unidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingCompliances ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : branchesWithCompliance.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Nenhuma unidade cadastrada. Cadastre unidades em Configuração Organizacional.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {branchesWithCompliance.map((branch) => (
                    <div 
                      key={branch.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleOpenComplianceModal(branch.id, branch.name)}
                    >
                      <div>
                        <p className="font-medium">{branch.name}</p>
                        {branch.compliance?.pending_description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {branch.compliance.pending_description}
                          </p>
                        )}
                        {branch.compliance?.action_plan && (
                          <p className="text-sm text-amber-600 mt-1">
                            Plano de ação: {branch.compliance.action_plan.substring(0, 80)}...
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {branch.compliance ? (
                          <>
                            <LegislationStatusBadge 
                              type="applicability" 
                              value={branch.compliance.applicability} 
                            />
                            <LegislationStatusBadge 
                              type="status" 
                              value={branch.compliance.compliance_status} 
                            />
                          </>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Não avaliada
                          </Badge>
                        )}
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evidences" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Evidências
                </CardTitle>
                <CardDescription>
                  Documentos e evidências de conformidade
                </CardDescription>
              </div>
              <Button onClick={() => setEvidenceModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Evidência
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingEvidences ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : evidences.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Nenhuma evidência cadastrada ainda.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {evidences.map((evidence) => (
                    <div 
                      key={evidence.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{evidence.title}</p>
                          {evidence.description && (
                            <p className="text-sm text-muted-foreground">
                              {evidence.description}
                            </p>
                          )}
                          {evidence.file_name && (
                            <p className="text-xs text-muted-foreground">
                              {evidence.file_name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{evidence.evidence_type}</Badge>
                        {evidence.file_url && !evidence.file_url.startsWith('local://') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(evidence.file_url, '_blank')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteEvidenceId(evidence.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Alterações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div>
                    <p className="font-medium">Legislação criada</p>
                    <p className="text-muted-foreground">
                      {legislation.created_at 
                        ? format(new Date(legislation.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                        : "-"
                      }
                    </p>
                  </div>
                </div>
                {legislation.updated_at && legislation.updated_at !== legislation.created_at && (
                  <div className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground mt-2" />
                    <div>
                      <p className="font-medium">Última atualização</p>
                      <p className="text-muted-foreground">
                        {format(new Date(legislation.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Unit Compliance Modal */}
      <UnitComplianceModal
        open={complianceModal.open}
        onOpenChange={(open) => setComplianceModal({ ...complianceModal, open })}
        legislationId={id!}
        branchId={complianceModal.branchId}
        branchName={complianceModal.branchName}
        existingCompliance={complianceModal.existing}
        onSave={handleSaveCompliance}
        isSaving={isUpserting}
      />

      {/* Evidence Upload Modal */}
      <EvidenceUploadModal
        open={evidenceModalOpen}
        onOpenChange={setEvidenceModalOpen}
        legislationId={id!}
        onSave={handleSaveEvidence}
      />

      {/* Delete Evidence Confirmation */}
      <AlertDialog open={!!deleteEvidenceId} onOpenChange={() => setDeleteEvidenceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta evidência? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteEvidenceId && handleDeleteEvidence(deleteEvidenceId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LegislationDetail;