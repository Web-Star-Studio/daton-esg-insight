import { useEffect } from 'react';
import { toast } from 'sonner';

interface ErrorToastProps {
  error?: Error | null;
  onClear?: () => void;
}

export function ErrorToast({ error, onClear }: ErrorToastProps) {
  useEffect(() => {
    if (error) {
      console.error('ErrorToast:', error);
      
      let message = 'Ocorreu um erro inesperado';
      let description = 'Tente novamente em alguns instantes.';
      
      const errorMsg = error.message.toLowerCase();
      
      // Handle specific error types
      if (errorMsg.includes('401') || errorMsg.includes('unauthorized') || errorMsg.includes('authentication')) {
        message = 'Erro de autenticação';
        description = 'Sua sessão pode ter expirado. Faça login novamente.';
      } else if (errorMsg.includes('403') || errorMsg.includes('forbidden')) {
        message = 'Acesso negado';
        description = 'Você não tem permissão para realizar esta ação.';
      } else if (errorMsg.includes('404') || errorMsg.includes('not found')) {
        message = 'Recurso não encontrado';
        description = 'O recurso solicitado não existe ou foi removido.';
      } else if (errorMsg.includes('429') || errorMsg.includes('rate limit')) {
        message = 'Muitas requisições';
        description = 'Aguarde alguns instantes antes de tentar novamente.';
      } else if (errorMsg.includes('500') || errorMsg.includes('internal server')) {
        message = 'Erro no servidor';
        description = 'Ocorreu um erro interno. Tente novamente mais tarde.';
      } else if (errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('connection')) {
        message = 'Erro de conexão';
        description = 'Verifique sua conexão com a internet.';
      } else if (errorMsg.includes('timeout')) {
        message = 'Tempo esgotado';
        description = 'A operação demorou muito. Tente novamente.';
      } else if (errorMsg.includes('validation') || errorMsg.includes('invalid')) {
        message = 'Dados inválidos';
        description = 'Verifique os dados informados e tente novamente.';
      } else if (error.message) {
        // Use the actual error message if it's user-friendly
        description = error.message;
      }
      
      toast.error(message, {
        description,
        duration: 5000,
        action: onClear ? {
          label: 'Fechar',
          onClick: onClear,
        } : undefined,
      });
    }
  }, [error, onClear]);

  return null;
}