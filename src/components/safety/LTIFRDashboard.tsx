import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2, Info, TrendingDown, TrendingUp } from "lucide-react";

interface LTIFRMetadata {
  worked_hours: number;
  calculation_method: 'real_data' | 'estimated_by_employees' | 'estimated_default';
  data_quality: 'high' | 'medium' | 'low';
  confidence_level: number;
  formula: string;
  compliance: string;
}

interface LTIFRDashboardProps {
  ltifr: number;
  metadata: LTIFRMetadata;
  accidentsWithLostTime?: number;
  sectorBenchmark?: number;
}

export function LTIFRDashboard({ 
  ltifr, 
  metadata, 
  accidentsWithLostTime = 0,
  sectorBenchmark = 2.5 
}: LTIFRDashboardProps) {
  
  // Determinar classificação de performance
  const getPerformanceClassification = (value: number) => {
    if (value < 1.0) return { label: 'Excelente', color: 'bg-success text-success-foreground', icon: CheckCircle2 };
    if (value < 3.0) return { label: 'Bom', color: 'bg-secondary text-secondary-foreground', icon: Info };
    if (value < 5.0) return { label: 'Atenção', color: 'bg-warning text-warning-foreground', icon: AlertTriangle };
    return { label: 'Crítico', color: 'bg-destructive text-destructive-foreground', icon: AlertTriangle };
  };

  const performance = getPerformanceClassification(ltifr);
  const PerformanceIcon = performance.icon;

  // Determinar badge de qualidade de dados
  const getDataQualityBadge = () => {
    if (metadata.data_quality === 'high') {
      return { variant: 'default' as const, label: '✓ Dados Reais', color: 'text-success' };
    }
    if (metadata.data_quality === 'medium') {
      return { variant: 'secondary' as const, label: '≈ Estimativa', color: 'text-warning' };
    }
    return { variant: 'outline' as const, label: '⚠ Estimado', color: 'text-muted-foreground' };
  };

  const dataQuality = getDataQualityBadge();

  // Comparação com benchmark
  const vssBenchmark = ltifr - sectorBenchmark;
  const isBetterThanBenchmark = vssBenchmark < 0;

  return (
    <div className="space-y-4">
      {/* Card Principal - LTIFR */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                Taxa de Frequência de Acidentes (LTIFR)
                <Badge className={performance.color}>
                  {performance.label}
                </Badge>
              </CardTitle>
              <CardDescription className="mt-1">
                {metadata.formula}
              </CardDescription>
            </div>
            <PerformanceIcon className={`h-8 w-8 ${performance.color.includes('success') ? 'text-success' : performance.color.includes('destructive') ? 'text-destructive' : performance.color.includes('warning') ? 'text-warning' : 'text-muted-foreground'}`} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Valor Principal */}
          <div className="flex items-baseline gap-3">
            <div className="text-5xl font-bold">{ltifr.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">
              acidentes / milhão de horas
            </div>
          </div>

          {/* Metadata de Qualidade */}
          <div className="flex items-center gap-3 pt-2 border-t">
            <Badge variant={dataQuality.variant} className="gap-1">
              {dataQuality.label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Confiança: {metadata.confidence_level}%
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">
              {metadata.worked_hours.toLocaleString('pt-BR')} horas trabalhadas
            </span>
            {accidentsWithLostTime > 0 && (
              <>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  {accidentsWithLostTime} acidente{accidentsWithLostTime > 1 ? 's' : ''} com afastamento
                </span>
              </>
            )}
          </div>

          {/* Comparação com Benchmark */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <span className="text-sm font-medium">Benchmark Setorial:</span>
            <span className="text-sm">{sectorBenchmark.toFixed(2)}</span>
            <div className="flex items-center gap-1">
              {isBetterThanBenchmark ? (
                <>
                  <TrendingDown className="h-4 w-4 text-success" />
                  <span className="text-sm text-success font-medium">
                    {Math.abs(vssBenchmark).toFixed(2)} abaixo
                  </span>
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 text-destructive" />
                  <span className="text-sm text-destructive font-medium">
                    {vssBenchmark.toFixed(2)} acima
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Compliance */}
          <div className="text-xs text-muted-foreground pt-2 border-t">
            <strong>Compliance:</strong> {metadata.compliance}
          </div>
        </CardContent>
      </Card>

      {/* Alertas Inteligentes */}
      {metadata.data_quality === 'low' && (
        <Alert className="border-warning bg-warning/10">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertTitle>Dados Estimados</AlertTitle>
          <AlertDescription>
            O LTIFR foi calculado usando estimativa padrão de horas trabalhadas.
            <br />
            <strong className="text-warning">Recomendação:</strong> Ative o módulo de Ponto Eletrônico ou cadastre registros de attendance_records para cálculos mais precisos (confiança de 95%).
          </AlertDescription>
        </Alert>
      )}

      {ltifr > 5.0 && (
        <Alert className="border-destructive bg-destructive/10">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <AlertTitle className="text-destructive font-bold">Taxa Crítica de Acidentes</AlertTitle>
          <AlertDescription className="text-destructive">
            LTIFR acima de 5.0 indica <strong>alto risco ocupacional</strong>. 
            <br />
            <strong>Ações imediatas:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Revisar procedimentos de segurança</li>
              <li>Reforçar treinamentos de EPIs</li>
              <li>Investigar causas raiz dos acidentes</li>
              <li>Implementar DDS (Diálogo Diário de Segurança)</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {ltifr < 1.0 && (
        <Alert className="border-success bg-success/10">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertTitle className="text-success">Performance Classe Mundial 🏆</AlertTitle>
          <AlertDescription className="text-success">
            LTIFR abaixo de 1.0 demonstra <strong>excelência em gestão de SST</strong>.
            Sua empresa está entre as melhores do setor!
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
