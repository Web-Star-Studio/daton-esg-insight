import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  Activity,
  Target
} from 'lucide-react';
import { useQualityIndicators } from '@/services/qualityIndicators';
import { IndicatorCreationModal } from './IndicatorCreationModal';
import { IndicatorMeasurementModal } from './IndicatorMeasurementModal';
import { Skeleton } from '@/components/ui/skeleton';

const QualityIndicatorDashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState(false);
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const { data: indicators = [], isLoading } = useQualityIndicators();

  const handleAddMeasurement = (indicatorId: string) => {
    setSelectedIndicatorId(indicatorId);
    setIsMeasurementModalOpen(true);
  };

  const handleIndicatorCreated = (indicatorId: string) => {
    // Abrir modal de medição para o indicador recém-criado
    setSelectedIndicatorId(indicatorId);
    setIsMeasurementModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Indicadores de Qualidade</h2>
          <p className="text-muted-foreground">Monitore o desempenho do sistema de qualidade</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="month">Mês</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="year">Ano</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Indicador
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-full mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/3 mb-2" />
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && indicators.length === 0 && (
        <Card className="col-span-full">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum indicador cadastrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Clique em "Novo Indicador" para começar a monitorar a qualidade
            </p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Indicador
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Indicators List */}
      {!isLoading && indicators.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {indicators.map((indicator: any) => (
            <Card key={indicator.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{indicator.name}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {indicator.category}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {indicator.frequency === 'daily' ? 'Diário' : 
                     indicator.frequency === 'weekly' ? 'Semanal' :
                     indicator.frequency === 'monthly' ? 'Mensal' : 'Trimestral'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">Unidade:</span>
                  <span className="font-medium">{indicator.measurement_unit}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">Tipo:</span>
                  <span className="text-sm">
                    {indicator.measurement_type === 'manual' ? 'Manual' :
                     indicator.measurement_type === 'automatic' ? 'Automático' : 'Calculado'}
                  </span>
                </div>
                {indicator.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {indicator.description}
                  </p>
                )}
                <div className="pt-2 flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleAddMeasurement(indicator.id)}
                  >
                    <Activity className="h-3 w-3 mr-1" />
                    Registrar Medição
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <IndicatorCreationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onCreated={handleIndicatorCreated}
      />
      
      {selectedIndicatorId && (
        <IndicatorMeasurementModal
          isOpen={isMeasurementModalOpen}
          onClose={() => {
            setIsMeasurementModalOpen(false);
            setSelectedIndicatorId(null);
          }}
          indicatorId={selectedIndicatorId}
        />
      )}
    </div>
  );
};

export default QualityIndicatorDashboard;
