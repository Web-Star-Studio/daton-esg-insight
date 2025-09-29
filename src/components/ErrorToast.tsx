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
      
      // Handle specific error types
      if (error.message.includes('401') || error.message.includes('authentication')) {
        message = 'Erro de autenticação';
        description = 'Sua sessão pode ter expirado. Faça login novamente.';
      } else if (error.message.includes('404') || error.message.includes('not found')) {
        message = 'Página não encontrada';
        description = 'A página solicitada não existe ou foi movida.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        message = 'Erro de conexão';
        description = 'Verifique sua conexão com a internet.';
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