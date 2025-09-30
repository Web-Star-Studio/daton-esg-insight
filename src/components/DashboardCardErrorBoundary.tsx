import React, { ReactNode } from 'react';
import { EnhancedErrorBoundary } from './ui/enhanced-error-boundary';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

interface DashboardCardErrorBoundaryProps {
  children: ReactNode;
  cardTitle?: string;
  onRetry?: () => void;
}

export function DashboardCardErrorBoundary({ 
  children, 
  cardTitle = 'Componente',
  onRetry 
}: DashboardCardErrorBoundaryProps) {
  return (
    <EnhancedErrorBoundary
      fallback={
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Erro em {cardTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Não foi possível carregar este componente.
              </p>
              <div className="flex gap-2">
                {onRetry && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={onRetry}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tentar Novamente
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.reload()}
                >
                  Recarregar Página
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      }
    >
      {children}
    </EnhancedErrorBoundary>
  );
}
