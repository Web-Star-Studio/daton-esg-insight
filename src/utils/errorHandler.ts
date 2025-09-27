import { toast } from "sonner";

export interface ErrorContext {
  component?: string;
  function?: string;
  userId?: string;
  additionalData?: any;
}

export class AppError extends Error {
  public code?: string;
  public context?: ErrorContext;
  public severity: 'low' | 'medium' | 'high' | 'critical';

  constructor(
    message: string, 
    code?: string, 
    context?: ErrorContext,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.context = context;
    this.severity = severity;
  }
}

export const errorHandler = {
  // Handle and log errors consistently
  handle(error: unknown, context?: ErrorContext): AppError {
    let appError: AppError;

    if (error instanceof AppError) {
      appError = error;
    } else if (error instanceof Error) {
      appError = new AppError(error.message, undefined, context);
    } else if (typeof error === 'string') {
      appError = new AppError(error, undefined, context);
    } else {
      appError = new AppError('Erro desconhecido', undefined, context);
    }

    // Log error based on severity
    const logData = {
      message: appError.message,
      code: appError.code,
      context: appError.context,
      stack: appError.stack,
      timestamp: new Date().toISOString()
    };

    switch (appError.severity) {
      case 'critical':
        console.error('🔴 CRITICAL ERROR:', logData);
        break;
      case 'high':
        console.error('🟠 HIGH SEVERITY ERROR:', logData);
        break;
      case 'medium':
        console.warn('🟡 MEDIUM SEVERITY ERROR:', logData);
        break;
      case 'low':
        console.info('🟢 LOW SEVERITY ERROR:', logData);
        break;
    }

    return appError;
  },

  // Show user-friendly error messages
  showUserError(error: unknown, context?: ErrorContext): void {
    const appError = this.handle(error, context);
    
    let userMessage: string;
    let title = "Erro";

    // Map technical errors to user-friendly messages
    switch (appError.code) {
      case 'PGRST116': // Row Level Security violation
        userMessage = "Você não tem permissão para realizar esta ação";
        title = "Acesso Negado";
        break;
      case 'PGRST200': // Foreign key not found
        userMessage = "Dados relacionados não encontrados. Verifique se os registros existem";
        title = "Relacionamento Inválido";
        break;
      case '23505': // Unique constraint violation
        userMessage = "Já existe um registro com essas informações";
        title = "Duplicação";
        break;
      case '23503': // Foreign key constraint violation
        userMessage = "Não é possível excluir este registro pois existem dados relacionados";
        title = "Dependência";
        break;
      case 'FunctionsHttpError':
        userMessage = "Erro interno do servidor. Tente novamente em alguns minutos";
        title = "Erro do Servidor";
        break;
      default:
        // Generic user-friendly messages based on keywords
        if (appError.message.toLowerCase().includes('unauthorized')) {
          userMessage = "Sessão expirada. Faça login novamente";
          title = "Sessão Expirada";
        } else if (appError.message.toLowerCase().includes('network')) {
          userMessage = "Problema de conectividade. Verifique sua internet";
          title = "Conexão";
        } else if (appError.message.toLowerCase().includes('timeout')) {
          userMessage = "Operação demorou muito. Tente novamente";
          title = "Timeout";
        } else {
          userMessage = appError.message || "Ocorreu um erro inesperado";
        }
    }

    toast.error(title, {
      description: userMessage,
      duration: appError.severity === 'critical' ? 10000 : 5000,
    });
  },

  // Handle async operations with consistent error handling
  async withErrorHandling<T>(
    operation: () => Promise<T>,
    context?: ErrorContext,
    showToast: boolean = true
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const appError = this.handle(error, context);
      
      if (showToast) {
        this.showUserError(appError, context);
      }
      
      throw appError;
    }
  },

  // Validate and handle API responses
  validateApiResponse<T>(response: any, expectedShape?: Partial<T>): T {
    if (!response) {
      throw new AppError('Resposta vazia da API', 'EMPTY_RESPONSE');
    }

    if (response.error) {
      throw new AppError(
        response.error.message || 'Erro da API',
        response.error.code,
        { additionalData: response.error }
      );
    }

    if (expectedShape) {
      const missingFields = Object.keys(expectedShape).filter(
        key => !(key in response)
      );
      
      if (missingFields.length > 0) {
        throw new AppError(
          `Campos obrigatórios ausentes: ${missingFields.join(', ')}`,
          'INVALID_RESPONSE_SHAPE'
        );
      }
    }

    return response;
  }
};

// Utility function for React Query error handling
export const queryErrorHandler = (error: unknown, context?: ErrorContext) => {
  errorHandler.showUserError(error, context);
};

// Utility function for mutation error handling  
export const mutationErrorHandler = (error: unknown, context?: ErrorContext) => {
  errorHandler.showUserError(error, context);
};

// Export default
export default errorHandler;