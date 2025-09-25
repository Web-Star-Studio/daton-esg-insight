import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Target, TrendingUp, AlertTriangle } from 'lucide-react';
import { useQualityIndicators } from '@/services/qualityIndicators';
import { useIndicatorTargets } from '@/services/indicatorTargets';
import { IndicatorTargetModal } from './IndicatorTargetModal';
import { Skeleton } from '@/components/ui/skeleton';

export const TargetManagementDashboard: React.FC = () => {
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string>('');

  const { data: indicators, isLoading } = useQualityIndicators();

  const handleManageTargets = (indicatorId: string) => {
    setSelectedIndicatorId(indicatorId);
    setIsTargetModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </CardHeader>
            </Card>
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const totalIndicators = indicators?.length || 0;
  const indicatorsWithTargets = indicators?.filter(indicator => indicator.id)?.length || 0;
  const indicatorsWithoutTargets = totalIndicators - indicatorsWithTargets;

  return (
    <div className="space-y-6">
      {/* KPIs Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Indicadores</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalIndicators}</div>
            <p className="text-xs text-muted-foreground">
              Indicadores cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Com Metas Definidas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{indicatorsWithTargets}</div>
            <p className="text-xs text-muted-foreground">
              Metas configuradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sem Metas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{indicatorsWithoutTargets}</div>
            <p className="text-xs text-muted-foreground">
              Precisam de metas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Indicators List */}
      <Card>
        <CardHeader>
          <CardTitle>Gestão de Metas por Indicador</CardTitle>
          <CardDescription>
            Configure metas, limites de controle e limites críticos para cada indicador
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {indicators?.map((indicator) => (
              <IndicatorTargetRow 
                key={indicator.id}
                indicator={indicator}
                onManageTargets={handleManageTargets}
              />
            ))}
            
            {totalIndicators === 0 && (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum indicador cadastrado</h3>
                <p className="text-muted-foreground">
                  Primeiro cadastre indicadores para depois definir suas metas
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Target Modal */}
      <IndicatorTargetModal 
        isOpen={isTargetModalOpen}
        onClose={() => setIsTargetModalOpen(false)}
        indicatorId={selectedIndicatorId}
      />
    </div>
  );
};

interface IndicatorTargetRowProps {
  indicator: any;
  onManageTargets: (indicatorId: string) => void;
}

const IndicatorTargetRow: React.FC<IndicatorTargetRowProps> = ({ 
  indicator, 
  onManageTargets 
}) => {
  const { data: targets } = useIndicatorTargets(indicator.id);
  const activeTarget = targets?.find(target => target.is_active);

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">{indicator.name}</h3>
          <Badge variant="outline">{indicator.category}</Badge>
          <Badge variant="outline">{indicator.measurement_unit}</Badge>
          {activeTarget ? (
            <Badge variant="default">Meta Ativa</Badge>
          ) : (
            <Badge variant="secondary">Sem Meta</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {indicator.description}
        </p>
        {activeTarget && (
          <div className="flex items-center gap-4 mt-2 text-sm">
            <span>Meta: {activeTarget.target_value}</span>
            {activeTarget.upper_limit && (
              <span>Limite Superior: {activeTarget.upper_limit}</span>
            )}
            {activeTarget.lower_limit && (
              <span>Limite Inferior: {activeTarget.lower_limit}</span>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onManageTargets(indicator.id)}
        >
          <Plus className="h-4 w-4 mr-2" />
          {activeTarget ? 'Gerenciar Metas' : 'Definir Meta'}
        </Button>
      </div>
    </div>
  );
};