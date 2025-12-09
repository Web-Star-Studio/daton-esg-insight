/**
 * Utility functions for generating user-friendly license error messages
 */

export interface LicenseErrorInfo {
  title: string;
  description: string;
  suggestions: string[];
  severity: 'low' | 'medium' | 'high';
}

export function getLicenseErrorMessage(
  aiExtractedData: any | null,
  aiProcessingStatus: string | null
): LicenseErrorInfo {
  // Check for specific error types based on extracted data
  if (!aiExtractedData || Object.keys(aiExtractedData).length === 0) {
    return {
      title: "Documento não reconhecido",
      description: "A IA não conseguiu identificar este documento como uma licença ambiental válida.",
      suggestions: [
        "Verifique se o arquivo é um PDF válido e não está corrompido",
        "Confirme se é uma licença ambiental oficial",
        "O documento pode estar escaneado em baixa qualidade"
      ],
      severity: 'high'
    };
  }

  const licenseInfo = aiExtractedData.license_info || {};
  const condicionantes = aiExtractedData.condicionantes || [];
  const alertas = aiExtractedData.alertas || [];

  // Check if license info extraction was partial
  const hasBasicInfo = licenseInfo.license_number || licenseInfo.license_name || licenseInfo.issuing_body;
  
  if (!hasBasicInfo) {
    return {
      title: "Informações básicas não encontradas",
      description: "Não foi possível extrair dados essenciais como número, nome ou órgão emissor.",
      suggestions: [
        "Verifique se o documento contém a primeira página com o cabeçalho",
        "O PDF pode estar com páginas faltando",
        "Tente reprocessar o documento"
      ],
      severity: 'high'
    };
  }

  // Check for partial extraction
  if (condicionantes.length === 0 && alertas.length === 0) {
    return {
      title: "Extração incompleta",
      description: "O documento foi identificado, mas condicionantes e alertas não foram extraídos.",
      suggestions: [
        "Tente reprocessar o documento",
        "O PDF pode estar protegido ou com texto não selecionável",
        "Documentos muito longos podem ter processamento parcial"
      ],
      severity: 'medium'
    };
  }

  // Check for needs_review status
  if (aiProcessingStatus === 'needs_review') {
    return {
      title: "Revisão necessária",
      description: "A IA encontrou inconsistências que precisam de verificação manual.",
      suggestions: [
        "Revise os dados extraídos na reconciliação",
        "Algumas informações podem estar incorretas",
        "Compare com o documento original"
      ],
      severity: 'low'
    };
  }

  // Generic error
  return {
    title: "Erro no processamento",
    description: "Ocorreu um erro durante a análise do documento pela IA.",
    suggestions: [
      "Aguarde alguns minutos e tente novamente",
      "Problemas temporários de conexão podem ter ocorrido",
      "Se o erro persistir, verifique a qualidade do PDF"
    ],
    severity: 'medium'
  };
}

export function getUploadErrorMessage(error: any): { title: string; description: string } {
  const errorMessage = error?.message?.toLowerCase() || '';
  
  if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return {
      title: "Tempo limite excedido",
      description: "O documento é muito grande ou a conexão está lenta. Tente novamente."
    };
  }
  
  if (errorMessage.includes('upload') || errorMessage.includes('storage')) {
    return {
      title: "Falha no upload",
      description: "Não foi possível enviar o arquivo. Verifique sua conexão."
    };
  }
  
  if (errorMessage.includes('openai') || errorMessage.includes('ai')) {
    return {
      title: "Serviço de IA indisponível",
      description: "O serviço de análise está temporariamente fora. Tente em alguns minutos."
    };
  }
  
  if (errorMessage.includes('pdf') || errorMessage.includes('format')) {
    return {
      title: "Formato inválido",
      description: "O arquivo enviado não é um PDF válido ou está corrompido."
    };
  }
  
  if (errorMessage.includes('size') || errorMessage.includes('large')) {
    return {
      title: "Arquivo muito grande",
      description: "O tamanho do arquivo excede o limite permitido."
    };
  }

  return {
    title: "Erro ao processar documento",
    description: "Ocorreu um erro inesperado. Tente novamente."
  };
}
