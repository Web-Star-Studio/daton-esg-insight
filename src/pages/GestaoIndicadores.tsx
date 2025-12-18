import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Upload, BarChart3, Settings, Calendar } from "lucide-react";
import { IndicatorStatsCards } from "@/components/indicators/IndicatorStatsCards";
import { IndicatorList } from "@/components/indicators/IndicatorList";
import { IndicatorChart } from "@/components/indicators/IndicatorChart";
import { CollectionForm } from "@/components/indicators/CollectionForm";
import { IndicatorFormWizard } from "@/components/indicators/IndicatorFormWizard";
import { ImportExcelModal } from "@/components/indicators/ImportExcelModal";
import { GroupFormModal } from "@/components/indicators/GroupFormModal";
import { useIndicatorsWithData, useIndicatorStats, useIndicatorGroups } from "@/services/indicatorManagement";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function GestaoIndicadores() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showNewIndicator, setShowNewIndicator] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState<string | null>(null);

  const { data: indicators, isLoading: loadingIndicators } = useIndicatorsWithData(selectedYear);
  const { data: stats, isLoading: loadingStats } = useIndicatorStats(selectedYear);
  const { data: groups, isLoading: loadingGroups } = useIndicatorGroups();

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <>
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
            <Button variant="outline" onClick={() => setShowImport(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>
            <Button onClick={() => setShowNewIndicator(true)}>
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
              {/* Gráfico de Evolução */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Evolução dos Indicadores</CardTitle>
                </CardHeader>
                <CardContent>
                  <IndicatorChart 
                    indicators={indicators || []} 
                    year={selectedYear}
                  />
                </CardContent>
              </Card>

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
            <CollectionForm 
              indicators={indicators || []}
              selectedIndicatorId={selectedIndicator}
              onSelectIndicator={setSelectedIndicator}
              year={selectedYear}
            />
          </TabsContent>

          <TabsContent value="groups" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Grupos de Indicadores</CardTitle>
                  <Button size="sm" onClick={() => setShowNewGroup(true)}>
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
                      <div key={group.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          {group.icon && <span className="text-xl">{group.icon}</span>}
                          <div>
                            <span className="font-medium">{group.name}</span>
                            {group.description && (
                              <p className="text-sm text-muted-foreground">{group.description}</p>
                            )}
                          </div>
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

      {/* Modais */}
      <Dialog open={showNewIndicator} onOpenChange={setShowNewIndicator}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <IndicatorFormWizard 
            onClose={() => setShowNewIndicator(false)}
            groups={groups || []}
          />
        </DialogContent>
      </Dialog>

      <ImportExcelModal 
        open={showImport} 
        onOpenChange={setShowImport}
      />

      <GroupFormModal
        open={showNewGroup}
        onOpenChange={setShowNewGroup}
      />
    </>
  );
}
