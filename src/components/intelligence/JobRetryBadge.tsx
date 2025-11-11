import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RefreshCw, AlertCircle, XCircle, CheckCircle } from 'lucide-react';
import { getJobRetryInfo, getRetryStatusMessage, getRetryStatusVariant } from '@/utils/jobStatusHelpers';

interface JobRetryBadgeProps {
  job: any;
  showTooltip?: boolean;
}

export function JobRetryBadge({ job, showTooltip = true }: JobRetryBadgeProps) {
  const retryInfo = getJobRetryInfo(job);
  
  // Não mostrar badge se não há informação de retry relevante
  if (!retryInfo.isRetrying && !retryInfo.isPermanentFailure && retryInfo.retryCount === 0) {
    return null;
  }

  const message = getRetryStatusMessage(retryInfo);
  const variant = getRetryStatusVariant(retryInfo);
  
  const getIcon = () => {
    if (retryInfo.isPermanentFailure) return <XCircle className="w-3 h-3" />;
    if (retryInfo.isRetrying) return <RefreshCw className="w-3 h-3 animate-spin" />;
    if (retryInfo.retryCount > 0) return <CheckCircle className="w-3 h-3" />;
    return <AlertCircle className="w-3 h-3" />;
  };

  const badge = (
    <Badge variant={variant} className="gap-1 text-xs">
      {getIcon()}
      {retryInfo.isPermanentFailure && 'Falha Permanente'}
      {retryInfo.isRetrying && `Retry ${retryInfo.retryCount}/${retryInfo.maxRetries}`}
      {!retryInfo.isPermanentFailure && !retryInfo.isRetrying && retryInfo.retryCount > 0 && `${retryInfo.retryCount}x reprocessado`}
    </Badge>
  );

  if (!showTooltip || !message) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{message}</p>
          {retryInfo.isRetrying && retryInfo.nextRetryAt && (
            <p className="text-xs text-muted-foreground mt-1">
              Backoff exponencial aplicado
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
