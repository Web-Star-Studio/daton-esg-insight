import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  TrendingUp, 
  Target, 
  Bot, 
  Lightbulb,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  AlertTriangle
} from "lucide-react";
import { GRIIndicatorFormModal } from "@/components/GRIIndicatorFormModal";

interface GRIIndicatorDashboardProps {
  indicators: any[];
  completionStats: any;
  categorizedIndicators: Record<string, any[]>;
}

export function GRIIndicatorDashboard({ 
  indicators, 
  completionStats, 
  categorizedIndicators 
}: GRIIndicatorDashboardProps) {
  const [selectedIndicator, setSelectedIndicator] = useState<any>(null);
  const [showFormModal, setShowFormModal] = useState(false);

  const priorityIndicators = indicators.filter(ind => ind.is_mandatory).slice(0, 6);

  const getStatusIcon = (indicator: any) => {
    if (indicator.is_complete) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (indicator.value) {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    } else {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = (indicator: any) => {
    if (indicator.is_complete) return "Concluído";
    if (indicator.value) return "Em Progresso";
    return "Não Iniciado";
  };

  const getStatusColor = (indicator: any) => {
    if (indicator.is_complete) return "bg-green-100 text-green-800";
    if (indicator.value) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Progresso Geral dos Indicadores
          </CardTitle>
          <CardDescription>
            Acompanhe o progresso de preenchimento dos seus indicadores GRI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Progresso Geral</span>
              <span className="text-2xl font-bold">{completionStats?.completion_percentage || 0}%</span>
            </div>
            <Progress value={completionStats?.completion_percentage || 0} className="h-3" />
            
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{completionStats?.completed || 0}</p>
                <p className="text-sm text-muted-foreground">Concluídos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{completionStats?.in_progress || 0}</p>
                <p className="text-sm text-muted-foreground">Em Progresso</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{completionStats?.not_started || 0}</p>
                <p className="text-sm text-muted-foreground">Não Iniciados</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Priority Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Indicadores Obrigatórios Prioritários
          </CardTitle>
          <CardDescription>
            Indicadores obrigatórios que precisam de atenção imediata
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {priorityIndicators.map((indicator) => (
              <Card key={indicator.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(indicator)}
                      <Badge variant="outline" className="text-xs">
                        {indicator.code}
                      </Badge>
                    </div>
                    <Badge className={`text-xs ${getStatusColor(indicator)}`}>
                      {getStatusText(indicator)}
                    </Badge>
                  </div>
                  
                  <h4 className="font-medium text-sm mb-2 line-clamp-2">
                    {indicator.title || indicator.name}
                  </h4>
                  
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {indicator.description}
                  </p>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 text-xs"
                      onClick={() => {
                        setSelectedIndicator(indicator);
                        setShowFormModal(true);
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Preencher
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="px-2"
                    >
                      <Bot className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Progresso por Categoria
          </CardTitle>
          <CardDescription>
            Visão geral do progresso em cada categoria de indicadores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(categorizedIndicators).map(([category, indicators]) => {
              const completed = indicators.filter(ind => ind.is_complete).length;
              const total = indicators.length;
              const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
              
              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{category}</h4>
                    <span className="text-sm text-muted-foreground">
                      {completed}/{total} ({percentage}%)
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Ações Rápidas
          </CardTitle>
          <CardDescription>
            Funcionalidades inteligentes para acelerar o preenchimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => window.dispatchEvent(new CustomEvent('autoFillAll'))}
            >
              <Bot className="h-6 w-6" />
              <div className="text-center">
                <p className="font-medium">Preenchimento Automático</p>
                <p className="text-xs text-muted-foreground">
                  Use dados existentes para preencher indicadores
                </p>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => window.dispatchEvent(new CustomEvent('autoFillMandatory'))}
            >
              <TrendingUp className="h-6 w-6" />
              <div className="text-center">
                <p className="font-medium">Obrigatórios Primeiro</p>
                <p className="text-xs text-muted-foreground">
                  Preencher apenas indicadores obrigatórios
                </p>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => window.dispatchEvent(new CustomEvent('showTargets'))}
            >
              <Target className="h-6 w-6" />
              <div className="text-center">
                <p className="font-medium">Definir Metas</p>
                <p className="text-xs text-muted-foreground">
                  Configure metas para seus indicadores
                </p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Form Modal */}
      {showFormModal && selectedIndicator && (
        <GRIIndicatorFormModal
          isOpen={showFormModal}
          onClose={() => {
            setShowFormModal(false);
            setSelectedIndicator(null);
          }}
          indicator={selectedIndicator}
        />
      )}
    </div>
  );
}