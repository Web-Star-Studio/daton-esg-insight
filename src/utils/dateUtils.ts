/**
 * Utilitários para manipulação segura de datas, evitando problemas de timezone.
 * 
 * Problema: JavaScript interpreta "YYYY-MM-DD" como UTC meia-noite.
 * No Brasil (UTC-3), meia-noite UTC = 21:00 do dia anterior.
 * 
 * Solução: Usar meio-dia (T12:00:00) para que a conversão nunca mude o dia.
 */

/**
 * Converte uma string de data ISO (YYYY-MM-DD) para um objeto Date
 * de forma segura, evitando problemas de timezone.
 * 
 * @param dateString - String no formato ISO (YYYY-MM-DD) ou ISO com hora
 * @returns Date object ou null se dateString for inválido
 */
export function parseDateSafe(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  
  // Se já inclui horário, usar diretamente
  if (dateString.includes('T')) {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  }
  
  // Adicionar meio-dia para evitar problemas de timezone
  // Com T12:00:00, mesmo com conversão ±12h, o dia nunca muda
  const date = new Date(`${dateString}T12:00:00`);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Formata uma data para string ISO (YYYY-MM-DD) para salvar no banco.
 * Usa componentes locais da data para evitar problemas de timezone.
 * 
 * @param date - Objeto Date a ser formatado
 * @returns String no formato YYYY-MM-DD ou null se date for inválido
 */
export function formatDateForDB(date: Date | null | undefined): string | null {
  if (!date || isNaN(date.getTime())) return null;
  
  // Usar componentes locais da data (não UTC)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Formata uma data para exibição no formato brasileiro (DD/MM/YYYY).
 * 
 * @param dateString - String no formato ISO (YYYY-MM-DD)
 * @returns String no formato DD/MM/YYYY ou string vazia se inválido
 */
export function formatDateDisplay(dateString: string | null | undefined): string {
  const date = parseDateSafe(dateString);
  if (!date) return '';
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
}
