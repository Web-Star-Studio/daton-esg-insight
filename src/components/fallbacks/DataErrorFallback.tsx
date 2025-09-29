import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, Database, Wifi, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DataErrorFallbackProps {
  error?: Error;
  retry?: () => void;
  title?: string;
  description?: string;
  moduleName?: string;
}

export function DataErrorFallback({
  error,
  retry,
  title,
  description,
  moduleName = "módulo"
}: DataErrorFallbackProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  const isNetworkError = error?.message?.toLowerCase().includes('network') || 
                        error?.message?.toLowerCase().includes('fetch') ||
                        error?.message?.toLowerCase().includes('connection');

  const isDBError = error?.message?.toLowerCase().includes('database') || 
                   error?.message?.toLowerCase().includes('sql') ||
                   error?.message?.toLowerCase().includes('relation');

  const getErrorIcon = () => {
    if (isNetworkError) return <Wifi className="w-8 h-8 text-red-500" />;
    if (isDBError) return <Database className="w-8 h-8 text-red-500" />;
    return <AlertCircle className="w-8 h-8 text-red-500" />;
  };

  const getDefaultTitle = () => {
    if (isNetworkError) return "Problema de Conectividade";
    if (isDBError) return "Erro no Banco de Dados";
    return title || `Erro no ${moduleName}`;
  };

  const getDefaultDescription = () => {
    if (isNetworkError) return "Verifique sua conexão com a internet e tente novamente.";
    if (isDBError) return "Problema ao acessar os dados. Entre em contato com o suporte técnico.";
    return description || `Ocorreu um erro inesperado no ${moduleName}. Tente recarregar a página.`;
  };

  return (
    <div className="min-h-[600px] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            {getErrorIcon()}
          </div>
          <CardTitle className="text-red-900">{getDefaultTitle()}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <p className="font-medium">{getDefaultDescription()}</p>
              <ul className="mt-2 space-y-1 text-sm">
                {isNetworkError ? (
                  <>
                    <li>• Verifique sua conexão com a internet</li>
                    <li>• Tente recarregar a página</li>
                    <li>• Verifique se o servidor está online</li>
                  </>
                ) : isDBError ? (
                  <>
                    <li>• Problema temporário no banco de dados</li>
                    <li>• Entre em contato com o suporte técnico</li>
                    <li>• Tente novamente em alguns minutos</li>
                  </>
                ) : (
                  <>
                    <li>• Tente recarregar a página</li>
                    <li>• Verifique se você tem as permissões necessárias</li>
                    <li>• Entre em contato com o suporte se o problema persistir</li>
                  </>
                )}
              </ul>
            </AlertDescription>
          </Alert>
          
          {error && (
            <details className="text-left">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                📋 Detalhes técnicos do erro
              </summary>
              <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-auto max-h-40 border">
                {error.message}
                {error.stack && `\n\nStack:\n${error.stack.slice(0, 500)}...`}
              </pre>
            </details>
          )}
          
          <div className="flex gap-2 pt-2">
            {retry && (
              <Button onClick={retry} className="flex-1 gap-2">
                <RefreshCw className="w-4 h-4" />
                Tentar Novamente
              </Button>
            )}
            
            <Button onClick={handleBack} variant="outline" className="flex-1 gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          </div>
          
          <div className="text-center pt-2">
            <Button 
              variant="link" 
              size="sm"
              onClick={() => window.location.href = '/dashboard'}
              className="text-muted-foreground"
            >
              Ir para Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}