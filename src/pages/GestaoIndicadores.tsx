import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Upload, BarChart3, Settings, Calendar } from "lucide-react";
import { IndicatorStatsCards } from "@/components/indicators/IndicatorStatsCards";
import { IndicatorList } from "@/components/indicators/IndicatorList";
import { useIndicatorsWithData, useIndicatorStats, useIndicatorGroups } from "@/services/indicatorManagement";

export default function GestaoIndicadores() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [activeTab, setActiveTab] = useState("dashboard");

  const { data: indicators, isLoading: loadingIndicators } = useIndicatorsWithData(selectedYear);
  const { data: stats, isLoading: loadingStats } = useIndicatorStats(selectedYear);
  const { data: groups, isLoading: loadingGroups } = useIndicatorGroups();

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Gestão de Indicadores</h1>
            <p className="text-muted-foreground">
              Monitore e gerencie os indicadores de desempenho da organização
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
              <SelectTrigger className="w-[120px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Indicador
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <IndicatorStatsCards stats={stats} isLoading={loadingStats} />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="dashboard">
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="indicators">Indicadores</TabsTrigger>
            <TabsTrigger value="collection">Coleta</TabsTrigger>
            <TabsTrigger value="groups">
              <Settings className="h-4 w-4 mr-2" />
              Grupos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Indicadores Críticos</CardTitle>
                </CardHeader>
                <CardContent>
                  {indicators?.filter(i => i.period_data?.some(pd => pd.status === 'critical')).length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum indicador em estado crítico
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {indicators?.filter(i => i.period_data?.some(pd => pd.status === 'critical')).slice(0, 5).map(ind => (
                        <div key={ind.id} className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                          <span className="font-medium">{ind.name}</span>
                          <span className="text-destructive font-bold">Crítico</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Taxa de Conclusão</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <p className="text-5xl font-bold text-primary">{stats?.completion_rate || 0}%</p>
                      <p className="text-muted-foreground mt-2">dos indicadores coletados</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="indicators" className="mt-6">
            <IndicatorList 
              indicators={indicators || []}
              groups={groups || []}
              isLoading={loadingIndicators || loadingGroups}
            />
          </TabsContent>

          <TabsContent value="collection" className="mt-6">
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Selecione um indicador para registrar valores</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="groups" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Grupos de Indicadores</CardTitle>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Grupo
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {groups?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum grupo cadastrado
                  </p>
                ) : (
                  <div className="space-y-2">
                    {groups?.map(group => (
                      <div key={group.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {group.icon && <span className="text-xl">{group.icon}</span>}
                          <span className="font-medium">{group.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
