/**
 * Utilitários para normalização e tradução de status de Não Conformidades
 */

// Mapeamento de status para português
const STATUS_LABELS: Record<string, string> = {
  // Valores em inglês
  'open': 'Aberta',
  'in_progress': 'Em Tratamento',
  'closed': 'Encerrada',
  'pending': 'Pendente',
  'cancelled': 'Cancelada',
  'approved': 'Aprovada',
  
  // Valores já em português (normalização)
  'Aberta': 'Aberta',
  'Em Análise': 'Em Tratamento',
  'Em Correção': 'Em Tratamento',
  'Em Tratamento': 'Em Tratamento',
  'Fechada': 'Encerrada',
  'Encerrada': 'Encerrada',
  'Pendente': 'Pendente',
  'Cancelada': 'Cancelada',
  'Aprovada': 'Aprovada',
};

// Cores para badges de status
const STATUS_COLORS: Record<string, string> = {
  'Aberta': 'bg-red-100 text-red-800 border-red-200',
  'Em Tratamento': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Encerrada': 'bg-green-100 text-green-800 border-green-200',
  'Pendente': 'bg-orange-100 text-orange-800 border-orange-200',
  'Cancelada': 'bg-gray-100 text-gray-800 border-gray-200',
  'Aprovada': 'bg-purple-100 text-purple-800 border-purple-200',
};

// Ícones para status (nomes para uso com Lucide)
const STATUS_ICONS: Record<string, string> = {
  'Aberta': 'AlertCircle',
  'Em Tratamento': 'Clock',
  'Encerrada': 'CheckCircle',
  'Pendente': 'AlertTriangle',
  'Cancelada': 'XCircle',
  'Aprovada': 'CheckCircle2',
};

/**
 * Retorna o label traduzido para português de um status
 */
export function getNCStatusLabel(status: string): string {
  return STATUS_LABELS[status] || status;
}

/**
 * Retorna a classe CSS para a cor do badge de status
 */
export function getNCStatusColor(status: string): string {
  const normalizedStatus = getNCStatusLabel(status);
  return STATUS_COLORS[normalizedStatus] || 'bg-gray-100 text-gray-800 border-gray-200';
}

/**
 * Retorna o nome do ícone Lucide para o status
 */
export function getNCStatusIcon(status: string): string {
  const normalizedStatus = getNCStatusLabel(status);
  return STATUS_ICONS[normalizedStatus] || 'AlertCircle';
}

/**
 * Mapeamento de severidade para cores
 */
export function getNCseravityColor(severity: string): string {
  switch (severity) {
    case 'Crítica': return 'bg-red-100 text-red-800 border-red-200';
    case 'Alta': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'Média': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Baixa': return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

/**
 * Formata status para exibição em gráficos/dashboards
 */
export function formatStatusForChart(status: string): string {
  return getNCStatusLabel(status);
}

/**
 * Verifica se um status indica NC encerrada
 */
export function isNCClosed(status: string): boolean {
  const normalizedStatus = getNCStatusLabel(status);
  return normalizedStatus === 'Encerrada' || normalizedStatus === 'Cancelada';
}

/**
 * Verifica se um status indica NC em andamento
 */
export function isNCInProgress(status: string): boolean {
  const normalizedStatus = getNCStatusLabel(status);
  return normalizedStatus === 'Em Tratamento';
}

/**
 * Verifica se um status indica NC aberta/pendente
 */
export function isNCOpen(status: string): boolean {
  const normalizedStatus = getNCStatusLabel(status);
  return normalizedStatus === 'Aberta' || normalizedStatus === 'Pendente';
}
