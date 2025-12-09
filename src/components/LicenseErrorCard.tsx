import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  AlertCircle, 
  RefreshCw, 
  Trash2,
  FileWarning,
  Lightbulb
} from 'lucide-react';
import { getLicenseErrorMessage, LicenseErrorInfo } from '@/utils/licenseErrorMessages';

interface License {
  id: string;
  name: string;
  ai_processing_status?: string;
  ai_extracted_data?: any;
  created_at?: string;
  documents?: Array<{
    id: string;
    file_name: string;
  }>;
}

interface LicenseErrorCardProps {
  license: License;
  onRetry: (licenseId: string) => Promise<void>;
  onDelete: (licenseId: string) => void;
  isRetrying: boolean;
  isSelected: boolean;
  onSelect: (licenseId: string, checked: boolean) => void;
}

export function LicenseErrorCard({
  license,
  onRetry,
  onDelete,
  isRetrying,
  isSelected,
  onSelect
}: LicenseErrorCardProps) {
  const errorInfo: LicenseErrorInfo = getLicenseErrorMessage(
    license.ai_extracted_data,
    license.ai_processing_status
  );

  const severityColors = {
    low: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    medium: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    high: 'bg-destructive/10 text-destructive border-destructive/20'
  };

  const fileName = license.documents?.[0]?.file_name || license.name || 'Documento sem nome';
  const createdAt = license.created_at 
    ? new Date(license.created_at).toLocaleString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : null;

  return (
    <Card className={`border-destructive/30 ${isRetrying ? 'opacity-70' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(license.id, checked as boolean)}
            disabled={isRetrying}
          />
          
          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileWarning className="h-5 w-5 text-destructive flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm truncate max-w-[300px]" title={fileName}>
                    {fileName}
                  </p>
                  {createdAt && (
                    <p className="text-xs text-muted-foreground">
                      Tentativa em {createdAt}
                    </p>
                  )}
                </div>
              </div>
              <Badge 
                variant="outline" 
                className={severityColors[errorInfo.severity]}
              >
                <AlertCircle className="h-3 w-3 mr-1" />
                {errorInfo.severity === 'high' ? 'Crítico' : 
                 errorInfo.severity === 'medium' ? 'Atenção' : 'Aviso'}
              </Badge>
            </div>

            {/* Error Description */}
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <p className="font-medium text-sm text-foreground">
                {errorInfo.title}
              </p>
              <p className="text-sm text-muted-foreground">
                {errorInfo.description}
              </p>
            </div>

            {/* Suggestions */}
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Lightbulb className="h-3 w-3" />
                <span>Sugestões:</span>
              </div>
              <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5 pl-1">
                {errorInfo.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                size="sm"
                onClick={() => onRetry(license.id)}
                disabled={isRetrying}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? 'Reprocessando...' : 'Tentar Novamente'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete(license.id)}
                disabled={isRetrying}
                className="gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
