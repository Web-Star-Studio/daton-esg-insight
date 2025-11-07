import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface FormErrorContext {
  formType: string;
  operation: 'create' | 'update' | 'delete';
  userData?: any;
}

export class FormError extends Error {
  public code?: string;
  public context?: FormErrorContext;
  public retryable: boolean;

  constructor(
    message: string, 
    code?: string, 
    context?: FormErrorContext,
    retryable: boolean = false
  ) {
    super(message);
    this.name = 'FormError';
    this.code = code;
    this.context = context;
    this.retryable = retryable;
  }
}

export const formErrorHandler = {
  // Check authentication status
  async checkAuth(): Promise<{user: any, profile: any}> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new FormError(
        'Usuário não autenticado. Faça login novamente.',
        'AUTH_REQUIRED',
        undefined,
        false
      );
    }

    // Get user profile with company_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id, full_name, role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      throw new FormError(
        'Erro ao carregar perfil do usuário.',
        'PROFILE_ERROR',
        undefined,
        true
      );
    }

    if (!profile?.company_id) {
      throw new FormError(
        'Perfil de usuário incompleto. Entre em contato com o suporte.',
        'PROFILE_INCOMPLETE',
        undefined,
        false
      );
    }

    return { user, profile };
  },

  // Handle form submission with comprehensive error handling
  async handleFormSubmission<T>(
    operation: () => Promise<T>,
    context: FormErrorContext,
    options: {
      successMessage?: string;
      retryAttempts?: number;
      showToast?: boolean;
    } = {}
  ): Promise<T> {
    const { 
      successMessage = 'Operação realizada com sucesso!',
      retryAttempts = 2,
      showToast = true
    } = options;

    let attempts = 0;
    
    while (attempts <= retryAttempts) {
      try {
        attempts++;

        // Check authentication before each attempt
        await this.checkAuth();

        // Execute the operation
        const result = await operation();

        // Show success message
        if (showToast) {
          toast.success(successMessage);
        }

        return result;

      } catch (error: any) {
        console.error(`Form submission error (attempt ${attempts}):`, error);

        // If this is the last attempt or error is not retryable, handle and throw
        if (attempts > retryAttempts || !this.isRetryableError(error)) {
          this.handleError(error, context, showToast);
          throw error;
        }

        // Wait before retry
        if (attempts <= retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }
    }

    throw new FormError('Máximo de tentativas excedido', 'MAX_RETRIES_EXCEEDED', context);
  },

  // Determine if error is retryable
  isRetryableError(error: any): boolean {
    if (error instanceof FormError) {
      return error.retryable;
    }

    // Unique constraint violations are NOT retryable
    const nonRetryableCodes = [
      '23505', // Unique constraint violation
      '23503', // Foreign key constraint violation
    ];

    if (nonRetryableCodes.includes(error?.code)) {
      return false;
    }

    // Network or temporary database errors are retryable
    const retryableCodes = [
      'NETWORK_ERROR',
      'TIMEOUT',
      'PGRST301', // JWT expired
      'PGRST116'  // RLS policy violation (might be temporary auth issue)
    ];

    return retryableCodes.includes(error?.code) || 
           error?.message?.includes('network') ||
           error?.message?.includes('timeout');
  },

  // Handle and display errors
  handleError(error: unknown, context?: FormErrorContext, showToast: boolean = true): void {
    let formError: FormError;

    if (error instanceof FormError) {
      formError = error;
    } else if (error instanceof Error) {
      // Extract code from Supabase error
      const errorCode = (error as any).code || undefined;
      formError = new FormError(error.message, errorCode, context);
    } else if (typeof error === 'string') {
      formError = new FormError(error, undefined, context);
    } else if (typeof error === 'object' && error !== null) {
      // Handle Supabase error objects
      const errorCode = (error as any).code || undefined;
      const errorMessage = (error as any).message || 'Erro desconhecido';
      formError = new FormError(errorMessage, errorCode, context);
    } else {
      formError = new FormError('Erro desconhecido', undefined, context);
    }

    // Log detailed error information
    console.error('Form Error Details:', {
      message: formError.message,
      code: formError.code,
      context: formError.context,
      retryable: formError.retryable,
      stack: formError.stack
    });

    if (showToast) {
      this.showUserError(formError);
    }
  },

  // Show user-friendly error messages
  showUserError(error: FormError): void {
    let userMessage: string;
    let title = "Erro";

    // Map technical errors to user-friendly messages
    switch (error.code) {
      case 'AUTH_REQUIRED':
        userMessage = "Sessão expirada. Faça login novamente.";
        title = "Autenticação Necessária";
        break;
      case 'PROFILE_ERROR':
        userMessage = "Erro ao carregar perfil. Tente novamente.";
        title = "Erro de Perfil";
        break;
      case 'PROFILE_INCOMPLETE':
        userMessage = "Perfil incompleto. Entre em contato com o suporte.";
        title = "Perfil Incompleto";
        break;
      case 'PGRST116': // Row Level Security violation
        userMessage = "Você não tem permissão para realizar esta ação.";
        title = "Acesso Negado";
        break;
      case 'PGRST200': // Foreign key not found
        userMessage = "Dados relacionados não encontrados.";
        title = "Relacionamento Inválido";
        break;
      case '23505': // Unique constraint violation
        if (error.message?.includes('employee_code') || 
            error.message?.includes('employees_employee_code_key') ||
            error.message?.includes('employees_company_id_employee_code_key')) {
          userMessage = "Este código de funcionário já está em uso. Por favor, utilize um código diferente.";
          title = "Código Duplicado";
        } else {
          userMessage = "Já existe um registro com essas informações.";
          title = "Duplicação";
        }
        break;
      case '23503': // Foreign key constraint violation
        userMessage = "Não é possível excluir - existem dados relacionados.";
        title = "Dependência";
        break;
      case 'MAX_RETRIES_EXCEEDED':
        userMessage = "Não foi possível completar a operação após várias tentativas.";
        title = "Falha na Operação";
        break;
      default:
        // Generic user-friendly messages based on keywords
        if (error.message.toLowerCase().includes('unauthorized')) {
          userMessage = "Sessão expirada. Faça login novamente.";
          title = "Sessão Expirada";
        } else if (error.message.toLowerCase().includes('network')) {
          userMessage = "Problema de conectividade. Verifique sua internet.";
          title = "Conexão";
        } else if (error.message.toLowerCase().includes('timeout')) {
          userMessage = "Operação demorou muito. Tente novamente.";
          title = "Timeout";
        } else {
          userMessage = error.message || "Ocorreu um erro inesperado.";
        }
    }

    // Add retry hint for retryable errors
    if (error.retryable) {
      userMessage += " Você pode tentar novamente.";
    }

    toast.error(title, {
      description: userMessage,
      duration: error.retryable ? 5000 : 7000,
    });
  },

  // Wrapper for creating records with proper error handling
  async createRecord<T>(
    operation: () => Promise<T>,
    options: {
      formType: string;
      successMessage?: string;
    }
  ): Promise<T> {
    return this.handleFormSubmission(
      operation,
      {
        formType: options.formType,
        operation: 'create'
      },
      {
        successMessage: options.successMessage || `${options.formType} criado com sucesso!`
      }
    );
  },

  // Wrapper for updating records with proper error handling
  async updateRecord<T>(
    operation: () => Promise<T>,
    options: {
      formType: string;
      successMessage?: string;
    }
  ): Promise<T> {
    return this.handleFormSubmission(
      operation,
      {
        formType: options.formType,
        operation: 'update'
      },
      {
        successMessage: options.successMessage || `${options.formType} atualizado com sucesso!`
      }
    );
  }
};

export default formErrorHandler;