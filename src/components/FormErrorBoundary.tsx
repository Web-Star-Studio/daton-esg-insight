import React, { ReactNode } from 'react';
import { EnhancedErrorBoundary } from './ui/enhanced-error-boundary';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';

interface FormErrorBoundaryProps {
  children: ReactNode;
  formName: string;
  onError?: (error: Error) => void;
}

export function FormErrorBoundary({ children, formName, onError }: FormErrorBoundaryProps) {
  return (
    <EnhancedErrorBoundary
      onError={onError}
      fallback={
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro no formulário</AlertTitle>
          <AlertDescription>
            <div className="space-y-2 mt-2">
              <p>
                Ocorreu um erro ao processar o formulário "{formName}".
              </p>
              <p className="text-sm">
                Tente fechar e abrir o formulário novamente, ou recarregue a página.
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.reload()}
                className="mt-2"
              >
                Recarregar Página
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      }
    >
      {children}
    </EnhancedErrorBoundary>
  );
}
