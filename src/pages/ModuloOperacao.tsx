import { useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MaintenanceSchedulerModal } from "@/components/MaintenanceSchedulerModal";
import { CalibrationSchedulerModal } from "@/components/CalibrationSchedulerModal";
import { ValueChainMapperModal } from "@/components/ValueChainMapperModal";
import { InternalClientEvaluationModal } from "@/components/InternalClientEvaluationModal";
import { 
  useMaintenanceSchedules, 
  useMaintenanceStats,
  useMaintenanceRecords 
} from "@/services/equipmentMaintenance";
import { 
  useCalibrationSchedules, 
  useCalibrationStats,
  useCalibrationRecords 
} from "@/services/calibrationManagement";
import { 
  useValueChainProcesses, 
  useValueChainStats,
  useInternalRelationships,
  useInternalEvaluations 
} from "@/services/valueChainMapping";
import { useOwnershipStats, useAssetOwnershipRecords, useLoanAgreements } from "@/services/assetOwnership";
import {
  Settings,
  Wrench,
  Network,
  Users,
  Building,
  Calendar,
  AlertTriangle,
  TrendingUp,
  FileCheck,
  Clock,
  DollarSign,
  Star,
  Plus
} from "lucide-react";

export default function ModuloOperacao() {
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [calibrationModalOpen, setCalibrationModalOpen] = useState(false);
  const [valueChainModalOpen, setValueChainModalOpen] = useState(false);
  const [evaluationModalOpen, setEvaluationModalOpen] = useState(false);

  const { data: maintenanceStats } = useMaintenanceStats();
  const { data: calibrationStats } = useCalibrationStats();
  const { data: valueChainStats } = useValueChainStats();
  const { data: ownershipStats } = useOwnershipStats();

  const { data: maintenanceSchedules } = useMaintenanceSchedules();
  const { data: calibrationSchedules } = useCalibrationSchedules();
  const { data: valueChainProcesses } = useValueChainProcesses();
  const { data: internalEvaluations } = useInternalEvaluations();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Módulo Operação</h1>
          <p className="text-muted-foreground">
            Controle de equipamentos, cadeia cliente-fornecedor e avaliação interna
          </p>
        </div>

        {/* KPIs Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manutenções Atrasadas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{maintenanceStats?.overdue || 0}</div>
              <p className="text-xs text-muted-foreground">
                +{maintenanceStats?.upcoming || 0} próximas (7 dias)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calibrações Vencidas</CardTitle>
              <Settings className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{calibrationStats?.overdue || 0}</div>
              <p className="text-xs text-muted-foreground">
                {calibrationStats?.approvalRate?.toFixed(1) || 0}% aprovação
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processos Mapeados</CardTitle>
              <Network className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{valueChainStats?.totalProcesses || 0}</div>
              <p className="text-xs text-muted-foreground">
                {valueChainStats?.activeRelationships || 0} relacionamentos ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">NPS Interno</CardTitle>
              <Star className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{valueChainStats?.avgNPS || 0}</div>
              <p className="text-xs text-muted-foreground">
                Satisfação: {valueChainStats?.avgSatisfaction || 0}/10
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="maintenance" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="maintenance">Manutenção</TabsTrigger>
            <TabsTrigger value="calibration">Calibração</TabsTrigger>
            <TabsTrigger value="valuechain">Cadeia de Valor</TabsTrigger>
            <TabsTrigger value="ownership">Propriedade</TabsTrigger>
          </TabsList>

          <TabsContent value="maintenance" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Controle de Manutenção</h2>
                <p className="text-muted-foreground">Gerencie cronogramas e registros de manutenção</p>
              </div>
              <Button onClick={() => setMaintenanceModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Agendar Manutenção
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Estatísticas do Mês</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Concluídas:</span>
                    <span className="font-semibold">{maintenanceStats?.completedLastMonth || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Custo Total:</span>
                    <span className="font-semibold">
                      R$ {maintenanceStats?.totalCost?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Agendadas:</span>
                    <span className="font-semibold">{maintenanceStats?.totalScheduled || 0}</span>
                  </div>
                </CardContent>
              </Card>

              {maintenanceSchedules?.slice(0, 2).map((schedule) => (
                <Card key={schedule.id}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>{schedule.assets?.name}</span>
                      <Badge variant={
                        schedule.next_maintenance_date < new Date().toISOString().split('T')[0] 
                          ? "destructive" 
                          : "secondary"
                      }>
                        {schedule.priority}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{schedule.maintenance_type}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Próxima: {new Date(schedule.next_maintenance_date).toLocaleDateString('pt-BR')}</span>
                      </div>
                      {schedule.estimated_cost && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          <span>Custo: R$ {schedule.estimated_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      {schedule.estimated_duration_hours && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{schedule.estimated_duration_hours}h estimadas</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="calibration" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Controle de Calibração</h2>
                <p className="text-muted-foreground">Gerencie cronogramas e certificados de calibração</p>
              </div>
              <Button onClick={() => setCalibrationModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Agendar Calibração
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance de Calibração</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Taxa de Aprovação</span>
                      <span className="font-semibold">{calibrationStats?.approvalRate?.toFixed(1) || 0}%</span>
                    </div>
                    <Progress value={calibrationStats?.approvalRate || 0} />
                  </div>
                  <div className="flex justify-between">
                    <span>Calibrações no mês:</span>
                    <span className="font-semibold">{calibrationStats?.completedLastMonth || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Custo mensal:</span>
                    <span className="font-semibold">
                      R$ {calibrationStats?.totalCost?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {calibrationSchedules?.slice(0, 2).map((schedule) => (
                <Card key={schedule.id}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>{schedule.assets?.name}</span>
                      {schedule.certificate_required && (
                        <Badge variant="outline">
                          <FileCheck className="h-3 w-3 mr-1" />
                          Certificado
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{schedule.calibration_standard}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Próxima: {new Date(schedule.next_calibration_date).toLocaleDateString('pt-BR')}</span>
                      </div>
                      {schedule.calibration_provider && (
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          <span>{schedule.calibration_provider}</span>
                        </div>
                      )}
                      {schedule.estimated_cost && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          <span>R$ {schedule.estimated_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="valuechain" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Cadeia Cliente-Fornecedor</h2>
                <p className="text-muted-foreground">Mapeie processos e avalie relacionamentos internos</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setValueChainModalOpen(true)} variant="outline">
                  <Network className="h-4 w-4 mr-2" />
                  Mapear Processo
                </Button>
                <Button onClick={() => setEvaluationModalOpen(true)}>
                  <Star className="h-4 w-4 mr-2" />
                  Avaliar Relacionamento
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Panorama da Cadeia</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Processos Principais:</span>
                    <span className="font-semibold">{valueChainStats?.principalProcesses || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Processos Suporte:</span>
                    <span className="font-semibold">{valueChainStats?.supportProcesses || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Relacionamentos:</span>
                    <span className="font-semibold">{valueChainStats?.activeRelationships || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avaliações Recentes:</span>
                    <span className="font-semibold">{valueChainStats?.recentEvaluations || 0}</span>
                  </div>
                </CardContent>
              </Card>

              {valueChainProcesses?.slice(0, 2).map((process) => (
                <Card key={process.id}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <span>{process.process_name}</span>
                      <Badge variant={process.process_type === 'principal' ? 'default' : 'secondary'}>
                        {process.process_type}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {process.internal_client && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>Cliente: {process.internal_client}</span>
                        </div>
                      )}
                      {process.internal_supplier && (
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          <span>Fornecedor: {process.internal_supplier}</span>
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {process.external_suppliers?.length || 0} fornecedores externos
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {internalEvaluations && internalEvaluations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Últimas Avaliações</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {internalEvaluations.slice(0, 3).map((evaluation) => (
                      <div key={evaluation.id} className="flex items-center justify-between border-b pb-2">
                        <div className="flex-1">
                          <p className="font-medium">
                            {evaluation.internal_client_supplier_relationships?.client_department} 
                            ← {evaluation.internal_client_supplier_relationships?.supplier_department}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(evaluation.evaluation_period_end).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-center">
                            <div className="font-semibold text-sm">{evaluation.overall_satisfaction_score}/10</div>
                            <div className="text-xs text-muted-foreground">Satisfação</div>
                          </div>
                          {evaluation.nps_score !== null && (
                            <div className="text-center">
                              <div className="font-semibold text-sm">{evaluation.nps_score}/10</div>
                              <div className="text-xs text-muted-foreground">NPS</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="ownership" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Gestão de Propriedade</h2>
                <p className="text-muted-foreground">Controle de propriedade e acordos de empréstimo</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Ativos Próprios</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{ownershipStats?.ownedAssets || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Ativos Locados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{ownershipStats?.leasedAssets || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Comodatos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{ownershipStats?.comodatoAssets || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Seguro Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-gray-600">
                    R$ {ownershipStats?.totalInsuranceValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {ownershipStats?.expiringSoon && ownershipStats.expiringSoon > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Acordos Expirando em 30 Dias
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold text-orange-600">
                    {ownershipStats.expiringSoon} acordo(s) vencendo
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Revise os termos e renove se necessário
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <MaintenanceSchedulerModal
          open={maintenanceModalOpen}
          onClose={() => setMaintenanceModalOpen(false)}
        />

        <CalibrationSchedulerModal
          open={calibrationModalOpen}
          onClose={() => setCalibrationModalOpen(false)}
        />

        <ValueChainMapperModal
          open={valueChainModalOpen}
          onClose={() => setValueChainModalOpen(false)}
        />

        <InternalClientEvaluationModal
          open={evaluationModalOpen}
          onClose={() => setEvaluationModalOpen(false)}
        />
      </div>
    </MainLayout>
  );
}