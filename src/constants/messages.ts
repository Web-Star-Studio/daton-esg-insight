/**
 * Constantes de mensagens padronizadas do sistema
 * 
 * Glossário de terminologia:
 * - "Excluir" para deleções permanentes
 * - "Remover" para desvincular (não permanente)
 * - "Salvar" para persistir dados
 * - "Dashboard" mantido como termo técnico ESG
 * - "Usuário" sempre com acento
 * - "Email" sem hífen (padrão atual)
 */

export const MESSAGES = {
  // ============ SUCESSO ============
  SAVE_SUCCESS: 'Dados salvos com sucesso!',
  CREATE_SUCCESS: (item: string) => `${item} criado(a) com sucesso!`,
  UPDATE_SUCCESS: (item: string) => `${item} atualizado(a) com sucesso!`,
  DELETE_SUCCESS: (item: string) => `${item} excluído(a) com sucesso!`,
  UPLOAD_SUCCESS: 'Arquivo enviado com sucesso!',
  DOWNLOAD_SUCCESS: 'Download concluído!',
  COPY_SUCCESS: 'Copiado para a área de transferência!',
  
  // ============ ERRO ============
  SAVE_ERROR: 'Erro ao salvar. Tente novamente.',
  CREATE_ERROR: (item: string) => `Erro ao criar ${item}. Verifique os dados e tente novamente.`,
  UPDATE_ERROR: (item: string) => `Erro ao atualizar ${item}. Tente novamente.`,
  DELETE_ERROR: (item: string) => `Erro ao excluir ${item}. Tente novamente.`,
  LOAD_ERROR: 'Erro ao carregar dados. Atualize a página.',
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
  UPLOAD_ERROR: 'Erro ao enviar arquivo. Tente novamente.',
  PERMISSION_ERROR: 'Você não tem permissão para realizar esta ação.',
  SESSION_EXPIRED: 'Sua sessão expirou. Faça login novamente.',
  
  // ============ CONFIRMAÇÃO ============
  DELETE_CONFIRM: (item: string) => `Tem certeza que deseja excluir este(a) ${item}? Esta ação não pode ser desfeita.`,
  UNSAVED_CHANGES: 'Você tem alterações não salvas. Deseja sair mesmo assim?',
  CONFIRM_ACTION: 'Tem certeza que deseja continuar?',
  
  // ============ VAZIO ============
  NO_RESULTS: 'Nenhum resultado encontrado.',
  NO_DATA: (item: string) => `Nenhum(a) ${item} cadastrado(a).`,
  EMPTY_LIST: 'A lista está vazia.',
  NO_NOTIFICATIONS: 'Nenhuma notificação.',
  
  // ============ CARREGAMENTO ============
  LOADING: 'Carregando...',
  SAVING: 'Salvando...',
  PROCESSING: 'Processando...',
  UPLOADING: 'Enviando...',
  DELETING: 'Excluindo...',
  
  // ============ VALIDAÇÃO ============
  REQUIRED_FIELD: 'Campo obrigatório',
  INVALID_EMAIL: 'Email inválido',
  INVALID_CNPJ: 'CNPJ inválido. Digite 14 dígitos.',
  INVALID_CPF: 'CPF inválido. Digite 11 dígitos.',
  INVALID_CEP: 'CEP inválido. Digite 8 dígitos.',
  INVALID_PHONE: 'Telefone inválido.',
  INVALID_DATE: 'Data inválida.',
  PASSWORD_MISMATCH: 'As senhas não coincidem',
  PASSWORD_TOO_SHORT: 'A senha deve ter no mínimo 8 caracteres',
  PASSWORD_REQUIREMENTS: 'A senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais',
  
  // ============ HELP TEXT ============
  HELP: {
    CNPJ: 'Apenas números, 14 dígitos',
    CPF: 'Apenas números, 11 dígitos',
    CEP: 'Digite o CEP para preenchimento automático',
    EMAIL: 'Use seu email corporativo',
    PASSWORD: 'Mínimo 8 caracteres, 1 maiúscula, 1 número, 1 especial',
    DATE: 'Formato: DD/MM/AAAA',
    CURRENCY: 'Valores em Reais (R$)',
    EMISSION_FACTOR: 'Valor em kgCO₂e por unidade de atividade',
    LICENSE_EXPIRY: 'Data limite para renovação da licença',
  },
} as const;

// Tipo para autocomplete
export type MessageKey = keyof typeof MESSAGES;
export type HelpTextKey = keyof typeof MESSAGES.HELP;
