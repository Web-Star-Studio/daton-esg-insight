import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { complianceService } from "@/services/compliance";
import { ComplianceTaskModal } from "@/components/ComplianceTaskModal";
import { RegulatoryRequirementModal } from "@/components/RegulatoryRequirementModal";
import { TaskCalendarView } from "@/components/TaskCalendarView";
import { RequirementsLibrary } from "@/components/RequirementsLibrary";

export default function Compliance() {
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showRequirementModal, setShowRequirementModal] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['compliance-stats'],
    queryFn: complianceService.getStats,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Painel de Conformidade Regulatória</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Obrigações Mapeadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.totalRequirements || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Requisitos regulatórios cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.pendingTasks || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando execução
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencendo em 30 Dias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {statsLoading ? '...' : stats?.duingSoon || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Requer atenção urgente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {statsLoading ? '...' : stats?.overdueTasks || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Prazo vencido
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.totalTasks || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Todas as tarefas cadastradas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendar">Calendário de Obrigações</TabsTrigger>
          <TabsTrigger value="requirements">Matriz Regulatória</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Calendário de Obrigações</h2>
              <p className="text-sm text-muted-foreground">
                Gerencie todas as tarefas de compliance com prazos e responsáveis
              </p>
            </div>
            <Button onClick={() => setShowTaskModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Agendar Tarefa
            </Button>
          </div>
          
          <TaskCalendarView />
        </TabsContent>

        <TabsContent value="requirements" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Matriz Regulatória</h2>
              <p className="text-sm text-muted-foreground">
                Base de conhecimento de todas as leis, normas e regulamentos aplicáveis
              </p>
            </div>
            <Button onClick={() => setShowRequirementModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Mapear Requisito
            </Button>
          </div>
          
          <RequirementsLibrary />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ComplianceTaskModal 
        open={showTaskModal} 
        onOpenChange={setShowTaskModal}
      />
      
      <RegulatoryRequirementModal 
        open={showRequirementModal} 
        onOpenChange={setShowRequirementModal}
      />
    </div>
  );
}