import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, CheckCircle, Calendar, AlertTriangle, FileText } from 'lucide-react';
import type { LicenseDetail } from '@/services/licenses';

interface LicenseSidebarProps {
  license?: LicenseDetail;
  isLoading: boolean;
  conditionsCount?: number;
  onNavigateToAnalysis: () => void;
}

export function LicenseSidebar({
  license,
  isLoading,
  conditionsCount = 0,
  onNavigateToAnalysis,
}: LicenseSidebarProps) {
  return (
    <div className="space-y-6">
      {/* AI Analysis Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2" />
            Análise de IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Status:</span>
                {license?.ai_processing_status === 'completed' ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Concluída
                  </Badge>
                ) : license?.ai_processing_status === 'processing' ? (
                  <Badge variant="secondary" className="gap-1">
                    <Brain className="h-3 w-3" />
                    Processando
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    Não analisada
                  </Badge>
                )}
              </div>
              {license?.ai_confidence_score && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Confiança:</span>
                  <span className="font-medium">{Math.round(license.ai_confidence_score * 100)}%</span>
                </div>
              )}
              {license?.compliance_score && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Conformidade:</span>
                  <span className="font-medium">{license.compliance_score}%</span>
                </div>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={onNavigateToAnalysis}
              >
                <Brain className="h-4 w-4 mr-2" />
                Ver Análise Completa
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" size="sm" className="w-full justify-start">
            <Calendar className="h-4 w-4 mr-2" />
            Agendar Renovação
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start"
            onClick={() => document.getElementById('condicionantes')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Ver Condicionantes ({conditionsCount})
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start">
            <FileText className="h-4 w-4 mr-2" />
            Gerar Relatório
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
