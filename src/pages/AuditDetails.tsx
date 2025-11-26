import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Users, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AuditOverviewTab } from "@/components/audit/tabs/AuditOverviewTab";
import { AuditPlanTab } from "@/components/audit/tabs/AuditPlanTab";
import { AuditAreasTab } from "@/components/audit/tabs/AuditAreasTab";
import { AuditChecklistTab } from "@/components/audit/tabs/AuditChecklistTab";
import { AuditFindingsTab } from "@/components/audit/tabs/AuditFindingsTab";
import { AuditEvidenceTab } from "@/components/audit/tabs/AuditEvidenceTab";
import { AuditReportTab } from "@/components/audit/tabs/AuditReportTab";
import { AuditTimelineTab } from "@/components/audit/tabs/AuditTimelineTab";

export default function AuditDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: audit, isLoading } = useQuery({
    queryKey: ['audit', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audits')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: plan } = useQuery({
    queryKey: ['audit-plan', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_plans')
        .select('*')
        .eq('audit_id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      draft: { variant: "outline", label: "Rascunho" },
      planned: { variant: "secondary", label: "Planejada" },
      in_progress: { variant: "default", label: "Em Andamento" },
      completed: { variant: "outline", label: "Concluída" },
      cancelled: { variant: "destructive", label: "Cancelada" },
    };
    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return <div className="p-8">Carregando auditoria...</div>;
  }

  if (!audit) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <p>Auditoria não encontrada.</p>
            <Button onClick={() => navigate('/auditoria')} className="mt-4">
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/auditoria')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Auditorias
        </Button>
        <span>/</span>
        <span className="text-foreground font-medium">{audit.title}</span>
      </div>

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <CardTitle className="text-3xl">{audit.title}</CardTitle>
                {getStatusBadge(audit.status)}
              </div>
              {audit.scope && (
                <p className="text-muted-foreground">{audit.scope}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3 mt-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Data Início</p>
                <p className="font-medium">
                  {audit.start_date ? format(new Date(audit.start_date), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Data Fim</p>
                <p className="font-medium">
                  {audit.end_date ? format(new Date(audit.end_date), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Tipo</p>
                <p className="font-medium capitalize">{audit.audit_type?.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="plan">Plano</TabsTrigger>
          <TabsTrigger value="areas">Áreas</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="findings">Achados</TabsTrigger>
          <TabsTrigger value="evidence">Evidências</TabsTrigger>
          <TabsTrigger value="report">Relatório</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <AuditOverviewTab audit={audit} plan={plan} />
        </TabsContent>

        <TabsContent value="plan">
          <AuditPlanTab audit={audit} plan={plan} />
        </TabsContent>

        <TabsContent value="areas">
          <AuditAreasTab auditId={audit.id} />
        </TabsContent>

        <TabsContent value="checklist">
          <AuditChecklistTab auditId={audit.id} />
        </TabsContent>

        <TabsContent value="findings">
          <AuditFindingsTab auditId={audit.id} />
        </TabsContent>

        <TabsContent value="evidence">
          <AuditEvidenceTab auditId={audit.id} />
        </TabsContent>

        <TabsContent value="report">
          <AuditReportTab audit={audit} />
        </TabsContent>

        <TabsContent value="timeline">
          <AuditTimelineTab auditId={audit.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
