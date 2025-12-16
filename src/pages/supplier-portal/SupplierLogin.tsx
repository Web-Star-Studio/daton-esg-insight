import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupplierAuth } from '@/contexts/SupplierAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Truck, AlertCircle } from 'lucide-react';

export default function SupplierLogin() {
  const navigate = useNavigate();
  const { login, isAuthenticated, mustChangePassword, isLoading: authLoading } = useSupplierAuth();
  
  const [document, setDocument] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      if (mustChangePassword) {
        navigate('/fornecedor/alterar-senha');
      } else {
        navigate('/fornecedor/dashboard');
      }
    }
  }, [isAuthenticated, mustChangePassword, authLoading, navigate]);

  const formatDocument = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      return numbers
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDocument(e.target.value);
    setDocument(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(document, password);
    
    if (!result.success) {
      setError(result.error || 'Erro ao fazer login');
    } else if (result.mustChangePassword) {
      navigate('/fornecedor/alterar-senha');
    } else {
      navigate('/fornecedor/dashboard');
    }

    setIsLoading(false);
  };

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
            <Truck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Portal do Fornecedor</CardTitle>
          <CardDescription>
            Acesse sua área exclusiva para treinamentos, documentos e pesquisas
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
              <Label htmlFor="document">CPF ou CNPJ</Label>
              <Input
                id="document"
                type="text"
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                value={document}
                onChange={handleDocumentChange}
                maxLength={18}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              <strong>Primeiro acesso?</strong> Use a senha temporária fornecida pela empresa. 
              Você será solicitado a criar uma nova senha após o login.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
