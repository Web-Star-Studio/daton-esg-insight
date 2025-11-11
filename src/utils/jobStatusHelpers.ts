/**
 * Utilitários para formatação e exibição de status de jobs
 */

import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface JobRetryInfo {
  isRetrying: boolean;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: string;
  lastRetryAt?: string;
  isPermanentFailure: boolean;
}

/**
 * Formata informações de retry de um job
 */
export function getJobRetryInfo(job: any): JobRetryInfo {
  return {
    isRetrying: job.status === 'Aguardando Retry',
    retryCount: job.retry_count || 0,
    maxRetries: job.max_retries || 3,
    nextRetryAt: job.next_retry_at,
    lastRetryAt: job.last_retry_at,
    isPermanentFailure: job.status === 'Falha Permanente'
  };
}

/**
 * Retorna mensagem amigável sobre o status de retry
 */
export function getRetryStatusMessage(retryInfo: JobRetryInfo): string {
  if (retryInfo.isPermanentFailure) {
    return `Falha permanente após ${retryInfo.maxRetries} tentativas`;
  }
  
  if (retryInfo.isRetrying && retryInfo.nextRetryAt) {
    const timeUntilRetry = formatDistanceToNow(new Date(retryInfo.nextRetryAt), {
      locale: ptBR,
      addSuffix: true
    });
    return `Nova tentativa ${timeUntilRetry} (${retryInfo.retryCount}/${retryInfo.maxRetries})`;
  }
  
  if (retryInfo.retryCount > 0) {
    return `Reprocessado ${retryInfo.retryCount}x`;
  }
  
  return '';
}

/**
 * Retorna variante de badge baseado no status de retry
 */
export function getRetryStatusVariant(retryInfo: JobRetryInfo): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (retryInfo.isPermanentFailure) return 'destructive';
  if (retryInfo.isRetrying) return 'secondary';
  if (retryInfo.retryCount > 0) return 'outline';
  return 'default';
}

/**
 * Calcula tempo de backoff exponencial para exibição
 */
export function calculateBackoffDisplay(retryCount: number): string {
  const minutes = Math.pow(2, retryCount);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  return `${Math.round(minutes / 60)} h`;
}
