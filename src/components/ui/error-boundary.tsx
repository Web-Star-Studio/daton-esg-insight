import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Badge } from './badge';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-2xl animate-fade-in">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-destructive/10 rounded-full">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-2xl">Ops! Algo deu errado</CardTitle>
              <CardDescription>
                Encontramos um erro inesperado. Nossa equipe foi notificada automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Error details for development */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Bug className="h-4 w-4" />
                    <span className="font-medium">Detalhes do Erro (Desenvolvimento)</span>
                  </div>
                  <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                    <div className="space-y-2">
                      <div>
                        <Badge variant="destructive" className="mb-2">
                          {this.state.error.name}
                        </Badge>
                        <p className="text-sm font-mono text-muted-foreground">
                          {this.state.error.message}
                        </p>
                      </div>
                      {this.state.error.stack && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-sm font-medium">
                            Stack Trace
                          </summary>
                          <pre className="text-xs text-muted-foreground mt-2 overflow-x-auto">
                            {this.state.error.stack}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* User-friendly error actions */}
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Você pode tentar as seguintes ações para resolver o problema:
                </p>
                
                <div className="grid gap-3 sm:grid-cols-3">
                  <Button 
                    onClick={this.handleRetry} 
                    variant="outline"
                    className="w-full"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Tentar Novamente
                  </Button>
                  
                  <Button 
                    onClick={this.handleReload} 
                    variant="outline"
                    className="w-full"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Recarregar Página
                  </Button>
                  
                  <Button 
                    onClick={this.handleGoHome} 
                    className="w-full"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Ir ao Início
                  </Button>
                </div>
              </div>

              {/* Support information */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm">
                  <strong>Precisa de ajuda?</strong> Entre em contato com nosso suporte 
                  técnico se o problema persistir. Inclua o horário do erro: {' '}
                  <Badge variant="secondary" className="font-mono">
                    {new Date().toLocaleString('pt-BR')}
                  </Badge>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorFallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={errorFallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Hook for error handling in functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    console.error('Error caught by error handler:', error, errorInfo);
    // Here you could send to error reporting service
    throw error;
  };
}