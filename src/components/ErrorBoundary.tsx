import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { isProduction } from '@/utils/productionConfig';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // In production, send error to monitoring service
    if (isProduction()) {
      // TODO: Send to error monitoring service (e.g., Sentry)
      // Example: Sentry.captureException(error, { extra: errorInfo });
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <div>
                  <CardTitle>Algo deu errado</CardTitle>
                  <CardDescription>
                    Ocorreu um erro inesperado na aplicação
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Pedimos desculpas pelo inconveniente. O erro foi registrado e nossa equipe 
                será notificada.
              </p>

              {!isProduction() && this.state.error && (
                <div className="space-y-2">
                  <details className="bg-muted/30 p-4 rounded-lg">
                    <summary className="cursor-pointer text-sm font-medium mb-2">
                      Detalhes do erro (apenas em desenvolvimento)
                    </summary>
                    <div className="space-y-2 mt-2">
                      <div>
                        <p className="text-xs font-semibold text-destructive">
                          {this.state.error.name}: {this.state.error.message}
                        </p>
                      </div>
                      {this.state.errorInfo && (
                        <pre className="text-xs overflow-auto max-h-64 bg-background p-2 rounded">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      )}
                      {this.state.error.stack && (
                        <pre className="text-xs overflow-auto max-h-64 bg-background p-2 rounded">
                          {this.state.error.stack}
                        </pre>
                      )}
                    </div>
                  </details>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={this.handleReset} variant="default">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar Novamente
                </Button>
                <Button onClick={this.handleGoHome} variant="outline">
                  <Home className="h-4 w-4 mr-2" />
                  Ir para Início
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
