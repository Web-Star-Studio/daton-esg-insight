import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  Activity,
  Clock,
  Target,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { LostTimeAccidentsResult } from "@/services/lostTimeAccidentsAnalysis";

interface LostTimeAccidentsDashboardProps {
  data: LostTimeAccidentsResult;
  year: number;
}

export function LostTimeAccidentsDashboard({ data, year }: LostTimeAccidentsDashboardProps) {
  const getPerformanceClassification = () => {
    const { performance_classification } = data;
    
    const config = {
      'Excelente': {
        color: 'bg-success text-success-foreground',
        icon: CheckCircle2,
        message: 'Apenas uma pequena porcentagem dos acidentes causa afastamento. Mantenha as práticas preventivas!'
      },
      'Bom': {
        color: 'bg-blue-500 text-white',
        icon: Activity,
        message: 'Desempenho dentro do aceitável, mas há espaço para melhorias nas medidas preventivas.'
      },
      'Atenção': {
        color: 'bg-warning text-warning-foreground',
        icon: AlertCircle,
        message: 'Taxa elevada de acidentes com afastamento. Revisar procedimentos de segurança urgentemente.'
      },
      'Crítico': {
        color: 'bg-destructive text-destructive-foreground',
        icon: AlertTriangle,
        message: 'SITUAÇÃO CRÍTICA: Maioria dos acidentes causa afastamento. Ação imediata necessária!'
      }
    };

    return config[performance_classification];
  };

  const classification = getPerformanceClassification();
  const Icon = classification.icon;

  return (
    <div className="space-y-4">
      {/* Card Principal */}
      <Card className="border-primary/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Acidentes com Afastamento - {year}
              </CardTitle>
              <CardDescription>
                GRI 403-9: Lesões decorrentes de acidentes do trabalho
              </CardDescription>
            </div>
            <Badge className={classification.color}>
              <Icon className="h-4 w-4 mr-1" />
              {data.performance_classification}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Total de Acidentes com Afastamento */}
            <div className="text-center p-4 border rounded-lg bg-card">
              <div className="text-3xl font-bold text-destructive">
                {data.total_accidents_with_lost_time}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Acidentes com Afastamento
              </div>
            </div>

            {/* Taxa de Afastamento */}
            <div className="text-center p-4 border rounded-lg bg-card">
              <div className="text-3xl font-bold text-warning">
                {data.lost_time_accident_rate.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Taxa de Afastamento
              </div>
              <Progress 
                value={data.lost_time_accident_rate} 
                className="mt-2 h-2" 
              />
            </div>

            {/* LTIFR */}
            <div className="text-center p-4 border rounded-lg bg-card">
              <div className="text-3xl font-bold text-primary">
                {data.ltifr_contribution.ltifr_value}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                LTIFR
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Por milhão de horas
              </div>
            </div>

            {/* Comparação com Período Anterior */}
            <div className="text-center p-4 border rounded-lg bg-card">
              <div className="flex items-center justify-center gap-2">
                {data.comparison.is_improving ? (
                  <TrendingDown className="h-5 w-5 text-success" />
                ) : (
                  <TrendingUp className="h-5 w-5 text-destructive" />
                )}
                <div className={`text-3xl font-bold ${
                  data.comparison.is_improving ? 'text-success' : 'text-destructive'
                }`}>
                  {data.comparison.change_percentage.toFixed(1)}%
                </div>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {data.comparison.is_improving ? 'Redução' : 'Aumento'} vs. período anterior
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertas Inteligentes */}
      {data.lost_time_accident_rate > 50 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>CRÍTICO: Taxa de Afastamento Muito Alta</AlertTitle>
          <AlertDescription>
            Mais de 50% dos acidentes causam afastamento. Revisar medidas preventivas urgentemente e considerar:
            • Reforçar treinamentos de segurança
            • Auditar EPIs e equipamentos
            • Investigar causas raiz dos acidentes
          </AlertDescription>
        </Alert>
      )}

      {data.lost_time_accident_rate > 25 && data.lost_time_accident_rate <= 50 && (
        <Alert className="border-warning bg-warning/10">
          <AlertCircle className="h-4 w-4 text-warning" />
          <AlertTitle>ATENÇÃO: Taxa de Afastamento Elevada</AlertTitle>
          <AlertDescription>
            Taxa de afastamento está acima do ideal. Considere reforçar treinamentos de segurança e revisar procedimentos operacionais.
          </AlertDescription>
        </Alert>
      )}

      {!data.comparison.is_improving && data.comparison.change_percentage > 20 && (
        <Alert className="border-warning bg-warning/10">
          <TrendingUp className="h-4 w-4 text-warning" />
          <AlertTitle>Aumento Significativo vs. Período Anterior</AlertTitle>
          <AlertDescription>
            Houve aumento de {data.comparison.change_percentage.toFixed(1)}% em acidentes com afastamento. Investigar fatores contribuintes.
          </AlertDescription>
        </Alert>
      )}

      {data.lost_time_accident_rate <= 10 && (
        <Alert className="border-success bg-success/10">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertTitle>EXCELENTE: Baixa Taxa de Afastamento</AlertTitle>
          <AlertDescription>
            Apenas {data.lost_time_accident_rate.toFixed(1)}% dos acidentes causam afastamento. As práticas de segurança estão funcionando!
          </AlertDescription>
        </Alert>
      )}

      {/* Breakdown por Tipo e Severidade */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top 5 Tipos de Acidentes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-4 w-4" />
              Top 5 Tipos que Causam Afastamento
            </CardTitle>
            <CardDescription>
              Acidentes mais frequentes com dias perdidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.top_5_types.length > 0 ? (
                data.top_5_types.map((type, idx) => (
                  <div key={idx} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-sm">{type.type}</div>
                      <Badge variant="secondary">{type.count} acidentes</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>
                        <Clock className="h-3 w-3 inline mr-1" />
                        {type.total_days_lost} dias perdidos
                      </div>
                      <div>
                        Média: {type.avg_days_per_accident} dias/acidente
                      </div>
                    </div>
                    <Progress 
                      value={(type.count / data.total_accidents_with_lost_time) * 100} 
                      className="mt-2 h-1.5" 
                    />
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Nenhum acidente com afastamento registrado
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Distribuição por Severidade */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Distribuição por Severidade
            </CardTitle>
            <CardDescription>
              Classificação de gravidade dos acidentes com afastamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.by_severity.length > 0 ? (
                data.by_severity.map((severity, idx) => {
                  const getSeverityColor = (sev: string) => {
                    if (sev === 'Alta') return 'text-destructive';
                    if (sev === 'Média') return 'text-warning';
                    return 'text-secondary';
                  };

                  return (
                    <div key={idx} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className={`font-semibold text-sm ${getSeverityColor(severity.severity)}`}>
                          {severity.severity}
                        </div>
                        <div className="text-sm font-medium">
                          {severity.count} ({severity.percentage.toFixed(1)}%)
                        </div>
                      </div>
                      <Progress 
                        value={severity.percentage} 
                        className="h-2" 
                      />
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Nenhum dado de severidade disponível
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Nota Metodológica */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">Nota Metodológica</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <p>
            <strong>GRI 403-9:</strong> Lesões decorrentes de acidentes do trabalho. 
            Contagem de acidentes que resultam em afastamento (days_lost &gt; 0).
          </p>
          <p>
            <strong>ISO 45001:</strong> Cláusula 9.1.1 - Monitoramento e medição de desempenho em SST.
          </p>
          <p>
            <strong>Cálculo:</strong> Contagem direta de registros em safety_incidents onde days_lost &gt; 0.
          </p>
          <p>
            <strong>Fontes:</strong> CAT (Comunicação de Acidente de Trabalho), SESMT, CIPA, registros internos.
          </p>
          <p>
            <strong>Taxa de Afastamento:</strong> (Acidentes com Afastamento / Total de Acidentes) × 100
          </p>
          <p>
            <strong>LTIFR:</strong> (Acidentes com Afastamento × 1.000.000) / Horas Trabalhadas
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
