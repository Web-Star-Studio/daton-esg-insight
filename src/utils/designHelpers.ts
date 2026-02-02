/**
 * Design System Helpers
 * Funções utilitárias para uso consistente do design system
 */

/**
 * Retorna classes de cor semântica baseado no status
 */
export function getStatusClasses(status: 'success' | 'error' | 'warning' | 'info' | 'neutral') {
  const statusMap = {
    success: {
      bg: 'bg-success/10',
      border: 'border-success/30',
      text: 'text-success',
      solid: 'bg-success text-success-foreground',
    },
    error: {
      bg: 'bg-destructive/10',
      border: 'border-destructive/30',
      text: 'text-destructive',
      solid: 'bg-destructive text-destructive-foreground',
    },
    warning: {
      bg: 'bg-warning/10',
      border: 'border-warning/30',
      text: 'text-warning',
      solid: 'bg-warning text-warning-foreground',
    },
    info: {
      bg: 'bg-info/10',
      border: 'border-info/30',
      text: 'text-info',
      solid: 'bg-info text-info-foreground',
    },
    neutral: {
      bg: 'bg-muted',
      border: 'border-border',
      text: 'text-muted-foreground',
      solid: 'bg-secondary text-secondary-foreground',
    },
  };
  
  return statusMap[status];
}

/**
 * Retorna classes de prioridade
 */
export function getPriorityClasses(priority: 'high' | 'medium' | 'low') {
  const priorityMap = {
    high: 'bg-destructive/10 text-destructive border-destructive/30',
    medium: 'bg-warning/10 text-warning border-warning/30',
    low: 'bg-success/10 text-success border-success/30',
  };
  
  return priorityMap[priority];
}

/**
 * Retorna classes de confiança/score
 */
export function getConfidenceClasses(confidence: number) {
  if (confidence >= 0.8) return 'bg-success/10 text-success border-success/30';
  if (confidence >= 0.6) return 'bg-warning/10 text-warning border-warning/30';
  return 'bg-destructive/10 text-destructive border-destructive/30';
}

/**
 * Retorna classes para nível de risco
 */
export function getRiskLevelClasses(level: 'critical' | 'high' | 'medium' | 'low' | 'minimal') {
  const riskMap = {
    critical: 'bg-destructive text-destructive-foreground',
    high: 'bg-destructive/80 text-destructive-foreground',
    medium: 'bg-warning text-warning-foreground',
    low: 'bg-success/80 text-success-foreground',
    minimal: 'bg-success text-success-foreground',
  };
  
  return riskMap[level];
}

/**
 * Retorna classes para progresso/porcentagem
 */
export function getProgressClasses(percentage: number) {
  if (percentage >= 80) return 'bg-success';
  if (percentage >= 50) return 'bg-warning';
  if (percentage >= 25) return 'bg-warning/70';
  return 'bg-destructive';
}
