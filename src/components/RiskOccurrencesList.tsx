import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { riskOccurrencesService, RiskOccurrence } from "@/services/riskOccurrences";
import { RiskOccurrenceModal } from "./RiskOccurrenceModal";
import { AlertTriangle, Plus, Eye, Edit, DollarSign, Calendar, Filter } from "lucide-react";

const getImpactColor = (impact: string) => {
  switch (impact) {
    case 'Alto': return 'bg-destructive hover:bg-destructive/80';
    case 'Médio': return 'bg-warning hover:bg-warning/80';
    case 'Baixo': return 'bg-success hover:bg-success/80';
    default: return 'bg-secondary hover:bg-secondary/80';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Fechada': return 'bg-success text-success-foreground';
    case 'Resolvida': return 'bg-primary text-primary-foreground';
    case 'Em Tratamento': return 'bg-warning text-warning-foreground';
    case 'Aberta': return 'bg-destructive text-destructive-foreground';
    default: return 'bg-secondary text-secondary-foreground';
  }
};

export function RiskOccurrencesList() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOccurrence, setSelectedOccurrence] = useState<RiskOccurrence | undefined>();
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterImpact, setFilterImpact] = useState<string>('');

  const { data: occurrences, isLoading } = useQuery({
    queryKey: ['risk-occurrences'],
    queryFn: () => riskOccurrencesService.getOccurrences()
  });

  const { data: metrics } = useQuery({
    queryKey: ['occurrence-metrics'],
    queryFn: () => riskOccurrencesService.getOccurrenceMetrics()
  });

  const filteredOccurrences = occurrences?.filter(occ => {
    const matchesSearch = occ.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (occ.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || occ.status === filterStatus;
    const matchesImpact = !filterImpact || occ.actual_impact === filterImpact;
    
    return matchesSearch && matchesStatus && matchesImpact;
  }) || [];

  const statuses = [...new Set(occurrences?.map(occ => occ.status) || [])];
  const impacts = [...new Set(occurrences?.map(occ => occ.actual_impact) || [])];

  const handleCreateOccurrence = () => {
    setSelectedOccurrence(undefined);
    setModalMode('create');
    setModalOpen(true);
  };

  const handleViewOccurrence = (occurrence: RiskOccurrence) => {
    setSelectedOccurrence(occurrence);
    setModalMode('view');
    setModalOpen(true);
  };

  const handleEditOccurrence = (occurrence: RiskOccurrence) => {
    setSelectedOccurrence(occurrence);
    setModalMode('edit');
    setModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-8 bg-muted rounded mb-4"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com métricas */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            Ocorrências de Riscos
          </h2>
          <p className="text-muted-foreground">
            {metrics?.total || 0} ocorrências registradas • 
            {metrics?.open || 0} abertas • 
            Tempo médio de resolução: {metrics?.avgResolutionDays || 0} dias
          </p>
        </div>
        <Button onClick={handleCreateOccurrence} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Registrar Ocorrência
        </Button>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Ocorrências</p>
              <p className="text-2xl font-bold">{metrics?.total || 0}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Em Aberto</p>
              <p className="text-2xl font-bold text-destructive">{metrics?.open || 0}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Resolvidas</p>
              <p className="text-2xl font-bold text-success">{metrics?.resolved || 0}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-success" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Impacto Financeiro</p>
              <p className="text-2xl font-bold">R$ {(metrics?.totalFinancialImpact || 0).toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-warning" />
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Buscar ocorrências..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="min-w-40">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-40">
              <Select value={filterImpact} onValueChange={setFilterImpact}>
                <SelectTrigger>
                  <SelectValue placeholder="Impacto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os impactos</SelectItem>
                  {impacts.map((impact) => (
                    <SelectItem key={impact} value={impact}>
                      {impact}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(searchTerm || filterStatus || filterImpact) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('');
                  setFilterImpact('');
                }}
              >
                Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Ocorrências */}
      <Card>
        <CardHeader>
          <CardTitle>Ocorrências ({filteredOccurrences.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredOccurrences.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {occurrences?.length === 0 
                    ? "Nenhuma ocorrência registrada ainda."
                    : "Nenhuma ocorrência encontrada com os filtros aplicados."
                  }
                </p>
                <Button 
                  onClick={handleCreateOccurrence} 
                  className="mt-4"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar primeira ocorrência
                </Button>
              </div>
            ) : (
              filteredOccurrences.map((occurrence) => (
                <div
                  key={occurrence.id}
                  className="border rounded-lg p-4 space-y-3 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{occurrence.title}</h3>
                        <Badge className={getStatusColor(occurrence.status)}>
                          {occurrence.status}
                        </Badge>
                        <Badge className={getImpactColor(occurrence.actual_impact)}>
                          {occurrence.actual_impact}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {occurrence.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(occurrence.occurrence_date).toLocaleDateString()}
                        </span>
                        {occurrence.financial_impact && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            R$ {occurrence.financial_impact.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewOccurrence(occurrence)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditOccurrence(occurrence)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <RiskOccurrenceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        occurrence={selectedOccurrence}
        mode={modalMode}
      />
    </div>
  );
}