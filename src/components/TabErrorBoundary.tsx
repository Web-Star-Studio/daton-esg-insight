import React, { ReactNode } from 'react';
import { EnhancedErrorBoundary } from './ui/enhanced-error-boundary';
import { Alert, AlertDescription } from './ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';

interface TabErrorBoundaryProps {
  children: ReactNode;
  tabName: string;
}

export function TabErrorBoundary({ children, tabName }: TabErrorBoundaryProps) {
  return (
    <EnhancedErrorBoundary
      fallback={
        <Alert variant="destructive" className="m-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">Erro ao carregar a aba "{tabName}"</p>
              <p className="text-sm">
                Houve um erro ao renderizar esta seção. Tente recarregar a página.
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.reload()}
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
