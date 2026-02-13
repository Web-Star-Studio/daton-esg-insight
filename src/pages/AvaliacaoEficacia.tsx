import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
import { getMyPendingEvaluations, getEvaluationDashboardMetrics } from "@/services/efficacyEvaluationDashboard";
import { useNavigate } from "react-router-dom";

const AvaliacaoEficacia = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { data: evaluations = [], isLoading } = useQuery({
    queryKey: ['my-efficacy-evaluations'],
    queryFn: getMyPendingEvaluations,
  });

  const { data: metrics } = useQuery({
    queryKey: ['efficacy-dashboard-metrics'],
    queryFn: getEvaluationDashboardMetrics,
  });

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
                  <TableHeader><TableRow><TableHead>Treinamento</TableHead><TableHead>Categoria</TableHead><TableHead>Participantes</TableHead><TableHead>Prazo</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filteredEvaluations.map((e) => (
                      <TableRow key={e.training_program_id}>
                        <TableCell><div className="flex items-center gap-2"><GraduationCap className="h-4 w-4" /><span className="font-medium">{e.training_name}</span></div></TableCell>
                        <TableCell><Badge variant="outline">{e.category || "—"}</Badge></TableCell>
                        <TableCell><div className="flex items-center gap-1"><Users className="h-3 w-3" />{e.participants_count}</div></TableCell>
                        <TableCell><div className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(e.deadline), "dd/MM/yyyy", { locale: ptBR })}</div></TableCell>
                        <TableCell>{getStatusBadge(e.status, e.days_remaining)}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant={e.status === "Avaliado" ? "ghost" : "default"} onClick={() => navigate(`/gestao-treinamentos?openEfficacy=${e.training_program_id}`)}>
                            {e.status === "Avaliado" ? <><Eye className="h-4 w-4 mr-1" />Ver</> : <><ClipboardCheck className="h-4 w-4 mr-1" />Avaliar</>}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AvaliacaoEficacia;
