import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ClipboardList, AlertTriangle, BarChart3, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useExecutionStats } from "@/hooks/audit/useExecution";
import { SessionProgressCard } from "./SessionProgressCard";
import { SessionExecutionView } from "./SessionExecutionView";
import { OccurrencesList } from "./OccurrencesList";

interface AuditExecutionPageProps {
  auditId: string;
  companyId: string;
  onBack: () => void;
}

export function AuditExecutionPage({ auditId, companyId, onBack }: AuditExecutionPageProps) {
  const [activeTab, setActiveTab] = useState("sessions");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Fetch audit details
  const { data: audit, isLoading: loadingAudit } = useQuery({
    queryKey: ['audit', auditId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audits')
        .select('*')
        .eq('id', auditId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch sessions
  const { data: sessions, isLoading: loadingSessions } = useQuery({
    queryKey: ['audit-sessions', auditId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_sessions')
        .select('*')
        .eq('audit_id', auditId)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch default response type (first active one)
  const { data: defaultResponseType } = useQuery({
    queryKey: ['default-response-type', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_response_types')
        .select('id')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch execution stats
  const { data: stats } = useExecutionStats(auditId);

  const selectedSession = sessions?.find(s => s.id === selectedSessionId);

  if (loadingAudit || loadingSessions) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If a session is selected, show the execution view
  if (selectedSession) {
    return (
      <SessionExecutionView
        session={selectedSession}
        companyId={companyId}
        onBack={() => setSelectedSessionId(null)}
        defaultResponseTypeId={defaultResponseType?.id}
      />
    );
  }

  const totalProgress = stats && stats.totalItems > 0
    ? (stats.respondedItems / stats.totalItems) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{audit?.title || 'Execução de Auditoria'}</h1>
          {audit?.target_entity && (
            <p className="text-muted-foreground">{audit.target_entity}</p>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Progresso Geral</p>
                <p className="text-2xl font-bold">{Math.round(totalProgress)}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
            <Progress value={totalProgress} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Itens Respondidos</p>
                <p className="text-2xl font-bold">
                  {stats?.respondedItems || 0} / {stats?.totalItems || 0}
                </p>
              </div>
              <ClipboardList className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sessões</p>
                <p className="text-2xl font-bold">{sessions?.length || 0}</p>
              </div>
              <ClipboardList className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ocorrências Abertas</p>
                <p className="text-2xl font-bold text-destructive">
                  {stats?.openOccurrences || 0}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="sessions">Sessões</TabsTrigger>
          <TabsTrigger value="occurrences">
            Ocorrências
            {stats?.openOccurrences ? (
              <span className="ml-2 bg-destructive text-destructive-foreground text-xs px-1.5 py-0.5 rounded-full">
                {stats.openOccurrences}
              </span>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions?.map((session) => (
              <SessionProgressCard
                key={session.id}
                session={session}
                onExecute={setSelectedSessionId}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="occurrences" className="mt-4">
          <OccurrencesList auditId={auditId} companyId={companyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
