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
    const errorCode = appError.code?.toUpperCase() || '';
    const errorMsg = appError.message?.toLowerCase() || '';

    if (errorCode === 'PGRST116' || errorMsg.includes('rls') || errorMsg.includes('row level security')) {
      userMessage = "Você não tem permissão para realizar esta ação";
      title = "Acesso Negado";
    } else if (errorCode === 'PGRST200' || errorMsg.includes('foreign key')) {
      userMessage = "Dados relacionados não encontrados. Verifique se os registros existem";
      title = "Relacionamento Inválido";
    } else if (errorCode === '23505' || errorMsg.includes('duplicate') || errorMsg.includes('unique')) {
      userMessage = "Já existe um registro com essas informações";
      title = "Duplicação";
    } else if (errorCode === '23503' || errorMsg.includes('violates foreign key')) {
      userMessage = "Não é possível excluir este registro pois existem dados relacionados";
      title = "Dependência";
    } else if (errorCode === 'FUNCTIONSHTTPERROR' || errorMsg.includes('edge function')) {
      userMessage = "Erro interno do servidor. Tente novamente em alguns minutos";
      title = "Erro do Servidor";
    } else if (errorMsg.includes('unauthorized') || errorMsg.includes('401')) {
      userMessage = "Sua sessão expirou. Faça login novamente";
      title = "Sessão Expirada";
    } else if (errorMsg.includes('forbidden') || errorMsg.includes('403')) {
      userMessage = "Você não tem permissão para acessar este recurso";
      title = "Acesso Negado";
    } else if (errorMsg.includes('not found') || errorMsg.includes('404')) {
      userMessage = "Recurso não encontrado";
      title = "Não Encontrado";
    } else if (errorMsg.includes('rate limit') || errorMsg.includes('429')) {
      userMessage = "Muitas requisições. Aguarde alguns instantes";
      title = "Limite Excedido";
    } else if (errorMsg.includes('timeout')) {
      userMessage = "A operação demorou muito tempo. Tente novamente";
      title = "Tempo Esgotado";
    } else if (errorMsg.includes('network') || errorMsg.includes('connection')) {
      userMessage = "Erro de conexão. Verifique sua internet";
      title = "Sem Conexão";
    } else {
      userMessage = appError.message || "Ocorreu um erro inesperado";
    }

    // Show toast based on severity
    const toastOptions = {
      duration: appError.severity === 'critical' ? 10000 : 5000,
    };

    if (appError.severity === 'critical' || appError.severity === 'high') {
      toast.error(title, {
        description: userMessage,
        ...toastOptions
      });
    } else {
      toast.warning(title, {
        description: userMessage,
        ...toastOptions
      });
    }
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