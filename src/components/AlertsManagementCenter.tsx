import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Bell, CheckCircle2, Clock, Search, Filter, TrendingUp, Users, MessageSquare } from 'lucide-react';
import { useIndicatorAlerts } from '@/services/qualityIndicators';
import { Skeleton } from '@/components/ui/skeleton';
import { RootCauseAnalysisModal } from './RootCauseAnalysisModal';

interface AlertsManagementCenterProps {
  className?: string;
}

export const AlertsManagementCenter: React.FC<AlertsManagementCenterProps> = ({ className }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [isRootCauseModalOpen, setIsRootCauseModalOpen] = useState(false);

  const { data: alerts, isLoading } = useIndicatorAlerts();

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <Bell className="h-4 w-4 text-warning" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-success" />;
    }
  };

  const getAlertColor = (level: string, acknowledged: boolean) => {
    if (acknowledged) {
      return level === 'critical' ? 'outline' : 'secondary';
    }
    return level === 'critical' ? 'destructive' : 'default';
  };

  const getStatusColor = (alert: any) => {
    if (alert.is_resolved) return 'bg-green-100 text-green-800';
    if (alert.is_acknowledged) return 'bg-blue-100 text-blue-800';
    return alert.alert_level === 'critical' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800';
  };

  const getStatusLabel = (alert: any) => {
    if (alert.is_resolved) return 'Resolvido';
    if (alert.is_acknowledged) return 'Reconhecido';
    return 'Ativo';
  };

  const handleAnalyzeRootCause = (alert: any) => {
    setSelectedAlert(alert);
    setIsRootCauseModalOpen(true);
  };

  const filteredAlerts = alerts?.filter(alert => {
    const matchesSearch = alert.alert_message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.quality_indicators?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = levelFilter === 'all' || alert.alert_level === levelFilter;
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && !alert.is_resolved && !alert.is_acknowledged) ||
                         (statusFilter === 'acknowledged' && alert.is_acknowledged && !alert.is_resolved) ||
                         (statusFilter === 'resolved' && alert.is_resolved);
    
    return matchesSearch && matchesLevel && matchesStatus;
  }) || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  const activeAlerts = alerts?.filter(a => !a.is_resolved && !a.is_acknowledged) || [];
  const criticalAlerts = activeAlerts.filter(a => a.alert_level === 'critical');
  const acknowledgedAlerts = alerts?.filter(a => a.is_acknowledged && !a.is_resolved) || [];
  const resolvedAlerts = alerts?.filter(a => a.is_resolved) || [];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* KPIs dos Alertas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Ativos</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando ação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Críticos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              Ação imediata
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reconhecidos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{acknowledgedAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              Em tratamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolvidos (7 dias)</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{resolvedAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              Últimos 7 dias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Alertas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por indicador ou mensagem..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Nível" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Níveis</SelectItem>
                <SelectItem value="critical">Crítico</SelectItem>
                <SelectItem value="warning">Atenção</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="acknowledged">Reconhecidos</SelectItem>
                <SelectItem value="resolved">Resolvidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Alertas */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Ativos ({activeAlerts.length})</TabsTrigger>
          <TabsTrigger value="acknowledged">Reconhecidos ({acknowledgedAlerts.length})</TabsTrigger>
          <TabsTrigger value="resolved">Resolvidos ({resolvedAlerts.length})</TabsTrigger>
          <TabsTrigger value="all">Todos ({filteredAlerts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertas Ativos</CardTitle>
              <CardDescription>
                Alertas que necessitam de ação imediata
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getAlertIcon(alert.alert_level)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{alert.alert_message}</h3>
                          <Badge className={getStatusColor(alert)}>
                            {getStatusLabel(alert)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <strong>Indicador:</strong> {alert.quality_indicators?.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <strong>Valor:</strong> {alert.indicator_measurements?.measured_value} em {alert.indicator_measurements?.measurement_date}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(alert.created_at).toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAnalyzeRootCause(alert)}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Analisar Causa
                      </Button>
                      <Button variant="outline" size="sm">
                        Reconhecer
                      </Button>
                    </div>
                  </div>
                ))}
                
                {activeAlerts.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhum alerta ativo</h3>
                    <p className="text-muted-foreground">
                      Todos os indicadores estão dentro dos limites esperados
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="acknowledged" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertas Reconhecidos</CardTitle>
              <CardDescription>
                Alertas reconhecidos e em processo de tratamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {acknowledgedAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg bg-blue-50">
                    <div className="flex items-center gap-3">
                      {getAlertIcon(alert.alert_level)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{alert.alert_message}</h3>
                          <Badge className={getStatusColor(alert)}>
                            {getStatusLabel(alert)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <strong>Indicador:</strong> {alert.quality_indicators?.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <strong>Reconhecido em:</strong> {alert.acknowledged_at ? new Date(alert.acknowledged_at).toLocaleString('pt-BR') : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        Resolver
                      </Button>
                    </div>
                  </div>
                ))}
                
                {acknowledgedAlerts.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhum alerta reconhecido</h3>
                    <p className="text-muted-foreground">
                      Alertas reconhecidos aparecerão aqui
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertas Resolvidos</CardTitle>
              <CardDescription>
                Histórico de alertas que foram resolvidos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {resolvedAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{alert.alert_message}</h3>
                          <Badge className={getStatusColor(alert)}>
                            {getStatusLabel(alert)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <strong>Indicador:</strong> {alert.quality_indicators?.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <strong>Resolvido em:</strong> {alert.resolved_at ? new Date(alert.resolved_at).toLocaleString('pt-BR') : 'N/A'}
                        </p>
                        {alert.resolution_notes && (
                          <p className="text-sm mt-2 p-2 bg-green-100 rounded">
                            <strong>Resolução:</strong> {alert.resolution_notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {resolvedAlerts.length === 0 && (
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhum alerta resolvido</h3>
                    <p className="text-muted-foreground">
                      Alertas resolvidos aparecerão aqui
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Todos os Alertas</CardTitle>
              <CardDescription>
                Visualização completa de todos os alertas (filtros aplicados)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getAlertIcon(alert.alert_level)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{alert.alert_message}</h3>
                          <Badge className={getStatusColor(alert)}>
                            {getStatusLabel(alert)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <strong>Indicador:</strong> {alert.quality_indicators?.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <strong>Criado em:</strong> {new Date(alert.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredAlerts.length === 0 && (
                  <div className="text-center py-8">
                    <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhum alerta encontrado</h3>
                    <p className="text-muted-foreground">
                      Ajuste os filtros para ver mais alertas
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Análise de Causa Raiz */}
      {selectedAlert && (
        <RootCauseAnalysisModal
          isOpen={isRootCauseModalOpen}
          onClose={() => {
            setIsRootCauseModalOpen(false);
            setSelectedAlert(null);
          }}
          indicatorId={selectedAlert.indicator_id}
          measurementId={selectedAlert.measurement_id}
          deviationDescription={`Alerta ${selectedAlert.alert_level}: ${selectedAlert.alert_message} - Indicador: ${selectedAlert.quality_indicators?.name}`}
        />
      )}
    </div>
  );
};