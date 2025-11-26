import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";
import { useAuditProgram } from "@/hooks/useAuditProgram";
import { AuditProgramModal } from "./AuditProgramModal";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function AuditProgramDashboard() {
  const { programs, isLoading } = useAuditProgram();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);

  const currentYear = new Date().getFullYear();
  const currentProgram = programs?.find(p => p.year === currentYear);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      planned: "secondary",
      in_progress: "default",
      completed: "outline",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      planned: "Planejado",
      in_progress: "Em Andamento",
      completed: "Concluído",
      cancelled: "Cancelado",
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Programa de Auditoria</h2>
          <p className="text-muted-foreground">
            Planejamento e gestão dos programas anuais de auditoria
          </p>
        </div>
        <Button onClick={() => {
          setSelectedProgram(null);
          setIsModalOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Programa
        </Button>
      </div>

      {currentProgram && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {currentProgram.title}
                </CardTitle>
                <CardDescription>Programa {currentProgram.year}</CardDescription>
              </div>
              {getStatusBadge(currentProgram.status)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Período</p>
                <p className="text-lg font-semibold">
                  {new Date(currentProgram.start_date).toLocaleDateString()} - {new Date(currentProgram.end_date).toLocaleDateString()}
                </p>
              </div>
              {currentProgram.resources_budget && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Orçamento</p>
                  <p className="text-lg font-semibold">
                    R$ {currentProgram.resources_budget.toLocaleString('pt-BR')}
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <p className="text-lg font-semibold">{getStatusLabel(currentProgram.status)}</p>
              </div>
            </div>

            {currentProgram.objectives && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Objetivos</p>
                <p className="text-sm">{currentProgram.objectives}</p>
              </div>
            )}

            {currentProgram.scope_description && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Escopo</p>
                <p className="text-sm">{currentProgram.scope_description}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedProgram(currentProgram);
                  setIsModalOpen(true);
                }}
              >
                Editar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Programas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{programs?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Todos os anos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {programs?.filter(p => p.status === 'in_progress').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Programas ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {programs?.filter(p => p.status === 'completed').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Finalizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planejados</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {programs?.filter(p => p.status === 'planned').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Aguardando início</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Programas</CardTitle>
          <CardDescription>Programas de auditoria dos anos anteriores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {programs && programs.length > 0 ? (
              programs.map((program) => (
                <div
                  key={program.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{program.title}</h4>
                      {getStatusBadge(program.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(program.start_date).toLocaleDateString()} - {new Date(program.end_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedProgram(program);
                      setIsModalOpen(true);
                    }}
                  >
                    Ver Detalhes
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum programa de auditoria cadastrado.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AuditProgramModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        program={selectedProgram}
      />
    </div>
  );
}
