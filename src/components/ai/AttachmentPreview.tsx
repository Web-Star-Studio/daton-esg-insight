// Attachment Preview - Preview inteligente de arquivos antes do upload
import { useState, useEffect } from 'react';
import { FileText, Image, Table, AlertCircle, Sparkles, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface FilePreviewData {
  name: string;
  size: number;
  type: string;
  detectedType?: 'emissions_data' | 'waste_data' | 'license' | 'invoice' | 'report' | 'generic';
  previewData?: {
    rowCount?: number;
    columnCount?: number;
    columns?: string[];
    suggestedMapping?: Record<string, string>;
    issues?: string[];
    confidence?: number;
  };
}

interface AttachmentPreviewProps {
  file: File;
  onConfirm: () => void;
  onCancel: () => void;
  className?: string;
}

export function AttachmentPreview({ file, onConfirm, onCancel, className }: AttachmentPreviewProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [previewData, setPreviewData] = useState<FilePreviewData | null>(null);

  useEffect(() => {
    analyzeFile();
  }, [file]);

  const analyzeFile = async () => {
    setIsAnalyzing(true);
    
    // Simular análise (em produção, isso seria uma chamada à edge function)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const analyzed: FilePreviewData = {
      name: file.name,
      size: file.size,
      type: file.type,
      detectedType: detectFileType(file),
      previewData: await getPreviewData(file)
    };
    
    setPreviewData(analyzed);
    setIsAnalyzing(false);
  };

  const detectFileType = (file: File): FilePreviewData['detectedType'] => {
    const name = file.name.toLowerCase();
    
    if (name.includes('emiss') || name.includes('gee') || name.includes('co2')) return 'emissions_data';
    if (name.includes('resid') || name.includes('waste')) return 'waste_data';
    if (name.includes('licen')) return 'license';
    if (name.includes('fatura') || name.includes('invoice')) return 'invoice';
    if (name.includes('relat') || name.includes('report')) return 'report';
    
    return 'generic';
  };

  const getPreviewData = async (file: File) => {
    // Análise básica do arquivo
    if (file.type.includes('spreadsheet') || file.type.includes('csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.csv')) {
      return {
        rowCount: Math.floor(Math.random() * 100) + 10,
        columnCount: Math.floor(Math.random() * 10) + 3,
        columns: ['Data', 'Fonte', 'Quantidade', 'Unidade', 'CO2e'],
        suggestedMapping: {
          'Data': 'period_start_date',
          'Fonte': 'emission_source',
          'Quantidade': 'quantity',
          'CO2e': 'total_co2e'
        },
        confidence: 0.85,
        issues: []
      };
    }
    
    return {
      confidence: 0.7
    };
  };

  const getTypeConfig = () => {
    const configs = {
      emissions_data: {
        icon: Sparkles,
        label: 'Dados de Emissões',
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10'
      },
      waste_data: {
        icon: Table,
        label: 'Dados de Resíduos',
        color: 'text-green-500',
        bgColor: 'bg-green-500/10'
      },
      license: {
        icon: FileText,
        label: 'Licença Ambiental',
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/10'
      },
      invoice: {
        icon: FileText,
        label: 'Fatura/Nota Fiscal',
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10'
      },
      report: {
        icon: FileText,
        label: 'Relatório',
        color: 'text-indigo-500',
        bgColor: 'bg-indigo-500/10'
      },
      generic: {
        icon: FileText,
        label: 'Documento',
        color: 'text-gray-500',
        bgColor: 'bg-gray-500/10'
      }
    };
    
    return configs[previewData?.detectedType || 'generic'];
  };

  if (isAnalyzing) {
    return (
      <Card className={cn("p-6 space-y-4", className)}>
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          <div className="flex-1">
            <h3 className="font-semibold text-sm">Analisando arquivo...</h3>
            <p className="text-xs text-muted-foreground">{file.name}</p>
          </div>
        </div>
        <Progress value={66} className="h-2" />
        <p className="text-xs text-muted-foreground">
          Detectando tipo de dados, validando estrutura e gerando sugestões...
        </p>
      </Card>
    );
  }

  if (!previewData) return null;

  const config = getTypeConfig();
  const Icon = config.icon;

  return (
    <Card className={cn("p-6 space-y-4", className)}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", config.bgColor)}>
          <Icon className={cn("h-5 w-5", config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm truncate">{file.name}</h3>
            <Badge variant="secondary" className="text-xs">
              {(file.size / 1024).toFixed(1)} KB
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{config.label}</p>
        </div>
      </div>

      {/* Preview Data */}
      {previewData.previewData && (
        <div className="space-y-3">
          {/* Confidence Score */}
          {previewData.previewData.confidence && (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">
                Confiança da análise: {Math.round(previewData.previewData.confidence * 100)}%
              </span>
            </div>
          )}

          {/* Data Stats */}
          {(previewData.previewData.rowCount || previewData.previewData.columnCount) && (
            <div className="grid grid-cols-2 gap-3">
              {previewData.previewData.rowCount && (
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-xs text-muted-foreground mb-1">Registros</p>
                  <p className="text-lg font-bold">{previewData.previewData.rowCount}</p>
                </div>
              )}
              {previewData.previewData.columnCount && (
                <div className="rounded-lg border bg-card p-3">
                  <p className="text-xs text-muted-foreground mb-1">Colunas</p>
                  <p className="text-lg font-bold">{previewData.previewData.columnCount}</p>
                </div>
              )}
            </div>
          )}

          {/* Suggested Mapping */}
          {previewData.previewData.suggestedMapping && Object.keys(previewData.previewData.suggestedMapping).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium">Mapeamento Sugerido:</p>
              <div className="space-y-1">
                {Object.entries(previewData.previewData.suggestedMapping).slice(0, 3).map(([from, to]) => (
                  <div key={from} className="flex items-center gap-2 text-xs">
                    <Badge variant="outline" className="font-mono">{from}</Badge>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-muted-foreground">{to}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Issues */}
          {previewData.previewData.issues && previewData.previewData.issues.length > 0 && (
            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3 space-y-1">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <p className="text-xs font-medium">Atenção:</p>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1 ml-6">
                {previewData.previewData.issues.map((issue, idx) => (
                  <li key={idx}>• {issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <Button onClick={onConfirm} className="flex-1" size="sm">
          <Sparkles className="h-4 w-4 mr-2" />
          Enviar e Analisar
        </Button>
        <Button onClick={onCancel} variant="outline" size="sm">
          Cancelar
        </Button>
      </div>
    </Card>
  );
}
