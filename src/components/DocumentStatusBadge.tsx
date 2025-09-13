import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Wand2, CheckCircle, Clock, AlertTriangle, Circle } from 'lucide-react';

interface DocumentStatusBadgeProps {
  aiProcessingStatus?: string;
  aiConfidenceScore?: number;
  className?: string;
}

export const DocumentStatusBadge: React.FC<DocumentStatusBadgeProps> = ({
  aiProcessingStatus,
  aiConfidenceScore,
  className = ""
}) => {
  if (!aiProcessingStatus) {
    return (
      <Badge variant="outline" className={`text-xs ${className}`}>
        <Circle className="h-3 w-3 mr-1" />
        Não processado
      </Badge>
    );
  }

  switch (aiProcessingStatus) {
    case 'Processando':
      return (
        <Badge variant="secondary" className={`text-xs bg-blue-50 text-blue-600 ${className}`}>
          <Clock className="h-3 w-3 mr-1" />
          Processando
        </Badge>
      );
    
    case 'Processado':
      const confidence = aiConfidenceScore || 0;
      let confidenceColor = 'bg-success/10 text-success';
      
      if (confidence < 0.6) {
        confidenceColor = 'bg-destructive/10 text-destructive';
      } else if (confidence < 0.8) {
        confidenceColor = 'bg-warning/10 text-warning';
      }
      
      return (
        <Badge variant="secondary" className={`text-xs ${confidenceColor} ${className}`}>
          <Wand2 className="h-3 w-3 mr-1" />
          Processado ({Math.round(confidence * 100)}%)
        </Badge>
      );
    
    case 'Erro':
      return (
        <Badge variant="destructive" className={`text-xs ${className}`}>
          <AlertTriangle className="h-3 w-3 mr-1" />
          Erro
        </Badge>
      );
    
    case 'Aprovado':
      return (
        <Badge variant="secondary" className={`text-xs bg-success/10 text-success ${className}`}>
          <CheckCircle className="h-3 w-3 mr-1" />
          Aprovado
        </Badge>
      );
    
    default:
      return (
        <Badge variant="outline" className={`text-xs ${className}`}>
          <Circle className="h-3 w-3 mr-1" />
          {aiProcessingStatus}
        </Badge>
      );
  }
};