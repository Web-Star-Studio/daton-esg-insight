import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupplierAuth } from '@/contexts/SupplierAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export default function SupplierChangePassword() {
  const navigate = useNavigate();
  const { changePassword, isAuthenticated, mustChangePassword, isLoading: authLoading } = useSupplierAuth();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/fornecedor/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const passwordValidations = {
    minLength: newPassword.length >= 8,
    hasUppercase: /[A-Z]/.test(newPassword),
    hasNumber: /\d/.test(newPassword),
    passwordsMatch: newPassword === confirmPassword && confirmPassword.length > 0
  };

  const isValid = Object.values(passwordValidations).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isValid) {
      setError('Por favor, atenda a todos os requisitos de senha');
      return;
    }

    setIsLoading(true);
    const result = await changePassword(newPassword);
    
    if (!result.success) {
      setError(result.error || 'Erro ao alterar senha');
    } else {
      navigate('/fornecedor/dashboard');
    }

    setIsLoading(false);
  };

  const ValidationItem = ({ valid, text }: { valid: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-sm ${valid ? 'text-green-600' : 'text-muted-foreground'}`}>
      {valid ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
      {text}
    </div>
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Alterar Senha</CardTitle>
          <CardDescription>
            {mustChangePassword 
              ? 'Este é seu primeiro acesso. Por segurança, crie uma nova senha para continuar.'
              : 'Crie uma nova senha para sua conta'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Digite sua nova senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirme sua nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <p className="text-sm font-medium mb-2">Requisitos da senha:</p>
              <ValidationItem valid={passwordValidations.minLength} text="Mínimo 8 caracteres" />
              <ValidationItem valid={passwordValidations.hasUppercase} text="Pelo menos uma letra maiúscula" />
              <ValidationItem valid={passwordValidations.hasNumber} text="Pelo menos um número" />
              <ValidationItem valid={passwordValidations.passwordsMatch} text="Senhas coincidem" />
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading || !isValid}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Nova Senha'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
