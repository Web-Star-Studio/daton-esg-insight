// Data Quality Badge - Indicador visual de qualidade de dados
import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface DataQualityScore {
  score: number; // 0-100
  issues: {
    type: 'missing' | 'outlier' | 'format' | 'duplicate' | 'inconsistent';
    field: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }[];
  recommendations: string[];
}

interface DataQualityBadgeProps {
  quality: DataQualityScore;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  className?: string;
}

export function DataQualityBadge({ 
  quality, 
  size = 'md', 
  showDetails = true,
  className 
}: DataQualityBadgeProps) {
  const getQualityConfig = () => {
    if (quality.score >= 90) {
      return {
        level: 'Excelente',
        icon: CheckCircle,
        variant: 'default' as const,
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30'
      };
    }
    if (quality.score >= 70) {
      return {
        level: 'Boa',
        icon: Shield,
        variant: 'secondary' as const,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30'
      };
    }
    if (quality.score >= 50) {
      return {
        level: 'Regular',
        icon: AlertTriangle,
        variant: 'outline' as const,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30'
      };
    }
    return {
      level: 'Baixa',
      icon: XCircle,
      variant: 'destructive' as const,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30'
    };
  };

  const config = getQualityConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs h-5 gap-1',
    md: 'text-sm h-6 gap-1.5',
    lg: 'text-base h-8 gap-2'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  if (!showDetails) {
    return (
      <Badge 
        variant={config.variant}
        className={cn(
          "flex items-center font-medium",
          sizeClasses[size],
          className
        )}
      >
        <Icon className={iconSizes[size]} />
        {quality.score}%
      </Badge>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 cursor-help transition-all",
            config.bgColor,
            config.borderColor,
            className
          )}>
            <Icon className={cn(iconSizes[size], config.color)} />
            <div className="flex flex-col items-start">
              <span className={cn("font-semibold leading-none", config.color)}>
                {quality.score}%
              </span>
              <span className="text-xs text-muted-foreground leading-none mt-0.5">
                Qualidade {config.level}
              </span>
            </div>
          </div>
        </TooltipTrigger>
        
        <TooltipContent side="bottom" className="max-w-sm p-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-sm mb-1">Qualidade dos Dados</h4>
              <p className="text-xs text-muted-foreground">
                Score: {quality.score}/100 - {config.level}
              </p>
            </div>

            {quality.issues.length > 0 && (
              <div>
                <h5 className="font-medium text-xs mb-2">Problemas Identificados:</h5>
                <ul className="space-y-1">
                  {quality.issues.slice(0, 3).map((issue, idx) => (
                    <li key={idx} className="text-xs flex items-start gap-2">
                      <div className={cn(
                        "h-1.5 w-1.5 rounded-full mt-1.5 shrink-0",
                        issue.severity === 'high' ? 'bg-red-500' :
                        issue.severity === 'medium' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      )} />
                      <span>
                        <strong>{issue.field}:</strong> {issue.description}
                      </span>
                    </li>
                  ))}
                  {quality.issues.length > 3 && (
                    <li className="text-xs text-muted-foreground">
                      +{quality.issues.length - 3} outros problemas
                    </li>
                  )}
                </ul>
              </div>
            )}

            {quality.recommendations.length > 0 && (
              <div>
                <h5 className="font-medium text-xs mb-2">Recomendações:</h5>
                <ul className="space-y-1">
                  {quality.recommendations.slice(0, 2).map((rec, idx) => (
                    <li key={idx} className="text-xs flex items-start gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Função auxiliar para calcular qualidade de dados
export function calculateDataQuality(data: Record<string, any>[]): DataQualityScore {
  const issues: DataQualityScore['issues'] = [];
  const recommendations: string[] = [];
  let totalScore = 100;

  if (data.length === 0) {
    return {
      score: 0,
      issues: [{ type: 'missing', field: 'data', description: 'Nenhum dado fornecido', severity: 'high' }],
      recommendations: ['Forneça dados para análise']
    };
  }

  const fields = Object.keys(data[0]);
  
  // Check for missing values
  fields.forEach(field => {
    const missingCount = data.filter(row => !row[field] || row[field] === '').length;
    const missingPercentage = (missingCount / data.length) * 100;
    
    if (missingPercentage > 20) {
      issues.push({
        type: 'missing',
        field,
        description: `${missingPercentage.toFixed(0)}% dos valores estão faltando`,
        severity: missingPercentage > 50 ? 'high' : 'medium'
      });
      totalScore -= missingPercentage > 50 ? 15 : 8;
      recommendations.push(`Preencher valores faltantes em "${field}"`);
    }
  });

  // Check for numeric outliers
  fields.forEach(field => {
    const numericValues = data
      .map(row => parseFloat(row[field]))
      .filter(val => !isNaN(val));
    
    if (numericValues.length > 3) {
      const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
      const stdDev = Math.sqrt(
        numericValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numericValues.length
      );
      
      const outliers = numericValues.filter(val => 
        Math.abs(val - mean) > 3 * stdDev
      );
      
      if (outliers.length > 0) {
        issues.push({
          type: 'outlier',
          field,
          description: `${outliers.length} valores atípicos detectados`,
          severity: 'low'
        });
        totalScore -= 3;
        recommendations.push(`Revisar valores atípicos em "${field}"`);
      }
    }
  });

  // Check for duplicates
  const duplicates = new Set(
    data.map(row => JSON.stringify(row))
  ).size !== data.length;
  
  if (duplicates) {
    issues.push({
      type: 'duplicate',
      field: 'all',
      description: 'Registros duplicados detectados',
      severity: 'medium'
    });
    totalScore -= 10;
    recommendations.push('Remover registros duplicados');
  }

  return {
    score: Math.max(0, Math.round(totalScore)),
    issues,
    recommendations
  };
}
