import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDateDisplay } from "@/utils/dateUtils";
import { 
  ClipboardCheck, Clock, CheckCircle2, AlertTriangle, Eye, 
  GraduationCap, Calendar, Users, Building2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getMyPendingEvaluations } from "@/services/efficacyEvaluationDashboard";
import { TrainingProgramEfficacyDialog } from "@/components/TrainingProgramEfficacyDialog";
import { TrainingProgramEvaluationFlow } from "@/components/TrainingProgramEvaluationFlow";

const AvaliacaoEficacia = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  // Wizard de avaliação contínua (estado='Pendente'/'Atrasado').
  const [evaluatingProgram, setEvaluatingProgram] = useState<{
    id: string;
    name: string;
  } | null>(null);
  // Modo read-only com a lista de participants já avaliados (estado='Avaliado').
  const [viewingProgram, setViewingProgram] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const { data: evaluations = [], isLoading } = useQuery({
    queryKey: ['my-efficacy-evaluations'],
    queryFn: getMyPendingEvaluations,
  });

  // Métricas derivadas do mesmo dataset — antes uma segunda useQuery chamava
  // getEvaluationDashboardMetrics, que internamente refazia getMyPendingEvaluations
  // (mais N queries por training). Reusar evita o trabalho dobrado.
  const metrics = React.useMemo(() => ({
    total: evaluations.length,
    pending: evaluations.filter(e => e.status === 'Pendente').length,
    evaluated: evaluations.filter(e => e.status === 'Avaliado').length,
    overdue: evaluations.filter(e => e.status === 'Atrasado').length,
  }), [evaluations]);

  const filteredEvaluations = evaluations.filter((e) => {
    const matchesSearch = e.training_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === "all" ||
      (activeTab === "pending" && e.status === "Pendente") ||
      (activeTab === "evaluated" && e.status === "Avaliado") ||
      (activeTab === "overdue" && e.status === "Atrasado");
    return matchesSearch && matchesTab;
  });

  const getStatusBadge = (status: string, daysRemaining: number) => {
    if (status === "Avaliado") return <Badge className="bg-green-500">Avaliado</Badge>;
    if (status === "Aguardando") return <Badge variant="secondary">Aguardando término</Badge>;
    if (status === "Atrasado") return <Badge variant="destructive">Atrasado ({Math.abs(daysRemaining)}d)</Badge>;
    if (daysRemaining <= 3) return <Badge variant="destructive">Urgente ({daysRemaining}d)</Badge>;
    if (daysRemaining <= 7) return <Badge className="bg-yellow-500 text-white">{daysRemaining}d</Badge>;
    return <Badge variant="outline">{daysRemaining} dias</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Avaliação de Eficácia</h1>
        <p className="text-muted-foreground">Treinamentos sob sua responsabilidade para avaliação</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{metrics?.total || 0}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pendentes</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-600">{metrics?.pending || 0}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Avaliados</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{metrics?.evaluated || 0}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Atrasados</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{metrics?.overdue || 0}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div><CardTitle>Meus Treinamentos para Avaliar</CardTitle><CardDescription>Treinamentos onde você é o responsável pela avaliação</CardDescription></div>
            <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-64" />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex w-full overflow-x-auto mb-4">
              <TabsTrigger value="all" className="min-w-fit">Todos ({evaluations.length})</TabsTrigger>
              <TabsTrigger value="pending" className="min-w-fit">Pendentes ({metrics?.pending || 0})</TabsTrigger>
              <TabsTrigger value="overdue" className="min-w-fit">Atrasados ({metrics?.overdue || 0})</TabsTrigger>
              <TabsTrigger value="evaluated" className="min-w-fit">Avaliados ({metrics?.evaluated || 0})</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab}>
              {isLoading ? (
                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
              ) : filteredEvaluations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground"><ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Nenhum treinamento encontrado</p></div>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Treinamento</TableHead><TableHead>Categoria</TableHead><TableHead>Progresso</TableHead><TableHead>Prazo</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filteredEvaluations.map((e) => {
                      const evaluated = e.evaluated_count ?? 0;
                      const total = e.participants_count ?? 0;
                      const isComplete = total > 0 && evaluated >= total;
                      return (
                      <TableRow key={e.training_program_id}>
                        <TableCell><div className="flex items-center gap-2"><GraduationCap className="h-4 w-4" /><span className="font-medium">{e.training_name}</span></div></TableCell>
                        <TableCell><Badge variant="outline">{e.category || "—"}</Badge></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span className={isComplete ? "text-green-600 font-medium" : ""}>{evaluated} / {total}</span>
                          </div>
                        </TableCell>
                        <TableCell><div className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDateDisplay(e.deadline)}</div></TableCell>
                        <TableCell>{getStatusBadge(e.status, e.days_remaining)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant={e.status === "Avaliado" ? "ghost" : "default"}
                            disabled={e.status === "Aguardando"}
                            title={e.status === "Aguardando" && e.end_date
                              ? `Liberada após o término em ${formatDateDisplay(e.end_date)}`
                              : undefined}
                            data-track={e.status === "Avaliado" ? "eficacia:view-details" : "eficacia:open-modal:evaluate"}
                            onClick={() => {
                              if (e.status === "Aguardando") return;
                              const target = { id: e.training_program_id, name: e.training_name };
                              if (e.status === "Avaliado") setViewingProgram(target);
                              else setEvaluatingProgram(target);
                            }}
                          >
                            {e.status === "Avaliado"
                              ? <><Eye className="h-4 w-4 mr-1" />Ver</>
                              : e.status === "Aguardando"
                                ? <><Clock className="h-4 w-4 mr-1" />Aguardando</>
                                : <><ClipboardCheck className="h-4 w-4 mr-1" />Avaliar</>}
                          </Button>
                        </TableCell>
                      </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <TrainingProgramEvaluationFlow
        open={!!evaluatingProgram}
        onOpenChange={(open) => { if (!open) setEvaluatingProgram(null); }}
        trainingProgramId={evaluatingProgram?.id ?? null}
        trainingProgramName={evaluatingProgram?.name ?? ""}
      />

      <TrainingProgramEfficacyDialog
        open={!!viewingProgram}
        onOpenChange={(open) => { if (!open) setViewingProgram(null); }}
        trainingProgramId={viewingProgram?.id ?? null}
        trainingProgramName={viewingProgram?.name ?? ""}
      />
    </div>
  );
};

export default AvaliacaoEficacia;
