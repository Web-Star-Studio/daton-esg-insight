import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { opportunitiesService, Opportunity } from "@/services/opportunities";
import { OpportunityManagementModal } from "./OpportunityManagementModal";
import { Plus, Target, TrendingUp, Filter, Eye, Edit, DollarSign } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const getOpportunityLevelColor = (level: string) => {
  switch (level) {
    case 'Crítica': return 'bg-destructive hover:bg-destructive/80';
    case 'Alta': return 'bg-warning hover:bg-warning/80';
    case 'Média': return 'bg-primary hover:bg-primary/80';
    case 'Baixa': return 'bg-muted hover:bg-muted/80';
    default: return 'bg-secondary hover:bg-secondary/80';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Implementada': return 'bg-success text-success-foreground';
    case 'Em Implementação': return 'bg-primary text-primary-foreground';
    case 'Em Análise': return 'bg-warning text-warning-foreground';
    case 'Identificada': return 'bg-secondary text-secondary-foreground';
    case 'Descartada': return 'bg-muted text-muted-foreground';
    default: return 'bg-secondary text-secondary-foreground';
  }
};

export function OpportunityMapWidget() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | undefined>();
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const { data: opportunities, isLoading } = useQuery({
    queryKey: ['opportunities'],
    queryFn: () => opportunitiesService.getOpportunities()
  });

  const { data: opportunityMatrix } = useQuery({
    queryKey: ['opportunity-matrix'],
    queryFn: () => opportunitiesService.getOpportunityMatrix()
  });

  const { data: metrics } = useQuery({
    queryKey: ['opportunity-metrics'],
    queryFn: () => opportunitiesService.getOpportunityMetrics()
  });

  const filteredOpportunities = opportunities?.filter(opp => {
    const matchesSearch = opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (opp.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || opp.category === filterCategory;
    const matchesStatus = !filterStatus || opp.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  }) || [];

  const categories = [...new Set(opportunities?.map(opp => opp.category) || [])];
  const statuses = [...new Set(opportunities?.map(opp => opp.status) || [])];

  const handleCreateOpportunity = () => {
    setSelectedOpportunity(undefined);
    setModalMode('create');
    setModalOpen(true);
  };

  const handleViewOpportunity = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setModalMode('view');
    setModalOpen(true);
  };

  const handleEditOpportunity = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setModalMode('edit');
    setModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-8 bg-muted rounded mb-4"></div>
            <div className="grid grid-cols-3 gap-4">
              {[...Array(9)].map((_, i) => (
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
            <Target className="h-6 w-6" />
            Mapa de Oportunidades
          </h2>
          <p className="text-muted-foreground">
            {metrics?.total || 0} oportunidades identificadas • 
            ROI potencial: {Math.round(metrics?.potentialROI || 0)}%
          </p>
        </div>
        <Button onClick={handleCreateOpportunity} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Oportunidade
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Buscar oportunidades..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="min-w-40">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-40">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os status</SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(searchTerm || filterCategory || filterStatus) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilterCategory('');
                  setFilterStatus('');
                }}
              >
                Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Matriz de Oportunidades */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Matriz de Probabilidade vs Impacto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div></div>
            <div className="font-semibold text-sm">Baixo</div>
            <div className="font-semibold text-sm">Médio</div>
            <div className="font-semibold text-sm">Alto</div>
            
            {['Alta', 'Média', 'Baixa'].map((probability) => (
              <React.Fragment key={probability}>
                <div className="font-semibold text-sm py-4">{probability}</div>
                {['Baixo', 'Médio', 'Alto'].map((impact) => (
                  <div
                    key={`${probability}-${impact}`}
                    className="h-16 border-2 border-dashed border-muted rounded-lg flex items-center justify-center text-lg font-bold bg-muted/20"
                  >
                    {opportunityMatrix?.[probability]?.[impact] || 0}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Oportunidades */}
      <Card>
        <CardHeader>
          <CardTitle>Oportunidades ({filteredOpportunities.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredOpportunities.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {opportunities?.length === 0 
                    ? "Nenhuma oportunidade cadastrada ainda."
                    : "Nenhuma oportunidade encontrada com os filtros aplicados."
                  }
                </p>
                <Button 
                  onClick={handleCreateOpportunity} 
                  className="mt-4"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar primeira oportunidade
                </Button>
              </div>
            ) : (
              filteredOpportunities.map((opportunity) => (
                <div
                  key={opportunity.id}
                  className="border rounded-lg p-4 space-y-3 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{opportunity.title}</h3>
                        <Badge className={getOpportunityLevelColor(opportunity.opportunity_level)}>
                          {opportunity.opportunity_level}
                        </Badge>
                        <Badge className={getStatusColor(opportunity.status)} variant="outline">
                          {opportunity.status}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {opportunity.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Categoria: {opportunity.category}</span>
                        <span>Probabilidade: {opportunity.probability}</span>
                        <span>Impacto: {opportunity.impact}</span>
                        {opportunity.potential_value && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            R$ {opportunity.potential_value.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewOpportunity(opportunity)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditOpportunity(opportunity)}
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

      <OpportunityManagementModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        opportunity={selectedOpportunity}
        mode={modalMode}
      />
    </div>
  );
}