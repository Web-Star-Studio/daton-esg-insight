import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, LogIn, Settings, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface AuthErrorFallbackProps {
  error?: Error;
  retry?: () => void;
  title?: string;
  description?: string;
  showLoginButton?: boolean;
  showBackButton?: boolean;
}

export function AuthErrorFallback({
  error,
  retry,
  title = "Acesso Negado",
  description = "Você precisa estar autenticado para acessar esta página.",
  showLoginButton = true,
  showBackButton = true
}: AuthErrorFallbackProps) {
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      // Check if user is already logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // User is logged in but might have profile issues
        navigate('/dashboard');
      } else {
        // Redirect to auth page
        navigate('/auth');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      navigate('/auth');
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const isAuthError = error?.message?.toLowerCase().includes('auth') || 
                     error?.message?.toLowerCase().includes('profile') ||
                     error?.message?.toLowerCase().includes('usuario');

  return (
    <div className="min-h-[600px] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-amber-500" />
          </div>
          <CardTitle className="text-amber-900">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <p className="font-medium">{description}</p>
              {isAuthError && (
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Verifique se você está logado com as credenciais corretas</li>
                  <li>• Confirme se seu perfil está configurado adequadamente</li>
                  <li>• Entre em contato com o administrador se o problema persistir</li>
                </ul>
              )}
            </AlertDescription>
          </Alert>
          
          {error && error.message !== "Usuário não autenticado ou perfil incompleto" && (
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
              <Button onClick={retry} variant="outline" className="flex-1 gap-2">
                <RefreshCw className="w-4 h-4" />
                Tentar Novamente
              </Button>
            )}
            
            {showLoginButton && (
              <Button onClick={handleLogin} className="flex-1 gap-2">
                <LogIn className="w-4 h-4" />
                Fazer Login
              </Button>
            )}
            
            {!showLoginButton && showBackButton && (
              <Button onClick={handleBack} variant="outline" className="flex-1 gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
            )}
          </div>
          
          <div className="text-center pt-2">
            <Button 
              variant="link" 
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="text-muted-foreground"
            >
              <Settings className="w-3 h-3 mr-1" />
              Ir para Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}