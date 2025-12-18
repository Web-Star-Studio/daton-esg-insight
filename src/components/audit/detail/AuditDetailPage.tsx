/**
 * AuditDetailPage - Página completa de detalhes da auditoria
 * Integra todas as fases: Planejamento, Execução, Scoring e Relatórios
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { SessionExecutionView } from "../execution/SessionExecutionView";
import { OccurrencesList } from "../execution/OccurrencesList";
import { AuditScoreDashboard } from "../scoring/AuditScoreDashboard";
import { AuditReportPage } from "../reports/AuditReportPage";
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Target, 
  FileText,
  Play,
  CheckCircle,
  Clock,
  AlertTriangle,
  BarChart3,
  ClipboardList,
  Settings
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuditDetailPageProps {
  auditId: string;
  companyId: string;
  onBack: () => void;
}

export function AuditDetailPage({ auditId, companyId, onBack }: AuditDetailPageProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Fetch audit data
  const { data: audit, isLoading: loadingAudit } = useQuery({
    queryKey: ['audit-detail', auditId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audits')
        .select('*')
        .eq('id', auditId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!auditId
  });

  // Fetch sessions
  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ['audit-sessions', auditId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_sessions')
        .select('*')
        .eq('audit_id', auditId)
        .order('display_order');
      if (error) throw error;
      return data || [];
    },
    enabled: !!auditId
  });

  // Fetch occurrences count
  const { data: occurrencesCount = 0 } = useQuery({
    queryKey: ['audit-occurrences-count', auditId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('audit_occurrences')
        .select('*', { count: 'exact', head: true })
        .eq('audit_id', auditId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!auditId
  });

  // Fetch linked standards
  const { data: standards = [] } = useQuery({
    queryKey: ['audit-standards', auditId],
    queryFn: async () => {
      const { data: links, error: linksError } = await supabase
        .from('audit_standards_link')
        .select('standard_id')
        .eq('audit_id', auditId);
      
      if (linksError) throw linksError;
      if (!links || links.length === 0) return [];

      const { data, error } = await supabase
        .from('audit_standards')
        .select('id, name, code, version')
        .in('id', links.map(l => l.standard_id));
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!auditId
  });

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: React.ReactNode }> = {
      'planejada': { color: 'bg-blue-500', icon: <Clock className="h-3 w-3" /> },
      'em_execucao': { color: 'bg-yellow-500', icon: <Play className="h-3 w-3" /> },
      'concluida': { color: 'bg-green-500', icon: <CheckCircle className="h-3 w-3" /> },
      'cancelada': { color: 'bg-red-500', icon: <AlertTriangle className="h-3 w-3" /> },
    };
    const statusConfig = config[status?.toLowerCase()] || config['planejada'];
    return (
      <Badge className={`${statusConfig.color} gap-1`}>
        {statusConfig.icon}
        {status}
      </Badge>
    );
  };

  if (loadingAudit) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Auditoria não encontrada</p>
        <Button variant="outline" onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  // Calculate overall progress
  const totalItems = sessions.reduce((sum, s) => sum + (s.total_items || 0), 0);
  const respondedItems = sessions.reduce((sum, s) => sum + (s.responded_items || 0), 0);
  const overallProgress = totalItems > 0 ? (respondedItems / totalItems) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{audit.title}</h1>
              {getStatusBadge(audit.status)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {audit.audit_type} • Criada em {format(new Date(audit.created_at), 'dd/MM/yyyy', { locale: ptBR })}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Período</p>
                <p className="text-sm font-medium">
                  {audit.start_date ? format(new Date(audit.start_date), 'dd/MM/yy', { locale: ptBR }) : 'N/A'}
                  {audit.end_date && ` - ${format(new Date(audit.end_date), 'dd/MM/yy', { locale: ptBR })}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Auditor</p>
                <p className="text-sm font-medium">{audit.auditor || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Sessões</p>
                <p className="text-sm font-medium">{sessions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Progresso</p>
                <p className="text-sm font-medium">{overallProgress.toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Ocorrências</p>
                <p className="text-sm font-medium">{occurrencesCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="execution">Execução</TabsTrigger>
          <TabsTrigger value="occurrences">Ocorrências ({occurrencesCount})</TabsTrigger>
          <TabsTrigger value="scoring">Pontuação</TabsTrigger>
          <TabsTrigger value="report">Relatório</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Scope */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Escopo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{audit.scope || 'Escopo não definido'}</p>
              </CardContent>
            </Card>

            {/* Standards */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Normas Aplicadas</CardTitle>
              </CardHeader>
              <CardContent>
                {standards.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma norma vinculada</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {standards.map((std: any) => (
                      <Badge key={std.id} variant="outline">
                        {std.code || std.name} {std.version && `v${std.version}`}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sessions Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sessões de Auditoria</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingSessions ? (
                <Skeleton className="h-24 w-full" />
              ) : sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma sessão configurada
                </p>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => {
                    const progress = session.total_items > 0 
                      ? (session.responded_items / session.total_items) * 100 
                      : 0;
                    return (
                      <div 
                        key={session.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => {
                          setSelectedSessionId(session.id);
                          setActiveTab('execution');
                        }}
                      >
                        <div>
                          <p className="font-medium">{session.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {session.session_date 
                              ? format(new Date(session.session_date), 'dd/MM/yyyy', { locale: ptBR })
                              : 'Data não definida'
                            }
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">{progress.toFixed(0)}%</p>
                            <p className="text-xs text-muted-foreground">
                              {session.responded_items || 0}/{session.total_items || 0} itens
                            </p>
                          </div>
                          <Badge variant="outline">{session.status}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Execution Tab */}
        <TabsContent value="execution" className="mt-4">
          {selectedSessionId ? (
            (() => {
              const selectedSession = sessions.find(s => s.id === selectedSessionId);
              if (!selectedSession) return null;
              return (
                <SessionExecutionView
                  session={{
                    id: selectedSession.id,
                    name: selectedSession.name,
                    audit_id: auditId,
                    total_items: selectedSession.total_items,
                    responded_items: selectedSession.responded_items,
                  }}
                  companyId={companyId}
                  onBack={() => setSelectedSessionId(null)}
                />
              );
            })()
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Selecione uma Sessão</CardTitle>
              </CardHeader>
              <CardContent>
                {sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhuma sessão disponível para execução
                  </p>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {sessions.map((session) => {
                      const progress = session.total_items > 0 
                        ? (session.responded_items / session.total_items) * 100 
                        : 0;
                      return (
                        <Card 
                          key={session.id}
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => setSelectedSessionId(session.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-semibold">{session.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {session.total_items || 0} itens
                                </p>
                              </div>
                              <Badge variant={session.status === 'concluida' ? 'default' : 'outline'}>
                                {session.status}
                              </Badge>
                            </div>
                            <div className="mt-3">
                              <div className="flex justify-between text-xs mb-1">
                                <span>Progresso</span>
                                <span>{progress.toFixed(0)}%</span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary transition-all"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Occurrences Tab */}
        <TabsContent value="occurrences" className="mt-4">
          <OccurrencesList auditId={auditId} companyId={companyId} />
        </TabsContent>

        {/* Scoring Tab */}
        <TabsContent value="scoring" className="mt-4">
          <AuditScoreDashboard auditId={auditId} companyId={companyId} />
        </TabsContent>

        {/* Report Tab */}
        <TabsContent value="report" className="mt-4">
          <AuditReportPage auditId={auditId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
