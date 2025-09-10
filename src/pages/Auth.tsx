import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Building2, Mail, Lock, User, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Auth() {
  const { login, register, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login');

  // Estados para login
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // Estados para registro
  const [registerData, setRegisterData] = useState({
    company_name: '',
    cnpj: '',
    user_name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(loginData.email, loginData.password);
      navigate('/');
    } catch (error) {
      // Erro já tratado no context com toast
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerData.password !== registerData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "As senhas não coincidem!",
      });
      return;
    }

    try {
      await register({
        company_name: registerData.company_name,
        cnpj: registerData.cnpj,
        user_name: registerData.user_name,
        email: registerData.email,
        password: registerData.password
      });
      
      setActiveTab('login');
    } catch (error) {
      // Erro já tratado no context com toast
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Building2 className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Daton</h1>
          <p className="text-muted-foreground mt-2">
            Plataforma de Gestão ESG Inteligente
          </p>
        </div>

        <Card className="border-border shadow-lg">
          <CardHeader className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Criar Conta</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login" className="mt-6">
                <CardTitle className="text-2xl text-center">Bem-vindo de volta</CardTitle>
                <CardDescription className="text-center">
                  Entre com suas credenciais para acessar sua conta
                </CardDescription>

                <form onSubmit={handleLogin} className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-10"
                        value={loginData.email}
                        onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={loginData.password}
                        onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register" className="mt-6">
                <CardTitle className="text-2xl text-center">Criar Conta Empresarial</CardTitle>
                <CardDescription className="text-center">
                  Registre sua empresa na plataforma Daton
                </CardDescription>

                <form onSubmit={handleRegister} className="space-y-4 mt-6">
                  {/* Dados da Empresa */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Dados da Empresa</span>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="company-name">Nome da Empresa</Label>
                      <Input
                        id="company-name"
                        placeholder="Sua Empresa Ltda"
                        value={registerData.company_name}
                        onChange={(e) => setRegisterData({...registerData, company_name: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cnpj">CNPJ</Label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="cnpj"
                          placeholder="00.123.456/0001-89"
                          className="pl-10"
                          value={registerData.cnpj}
                          onChange={(e) => setRegisterData({...registerData, cnpj: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Dados do Usuário */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Dados do Administrador</span>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="user-name">Nome Completo</Label>
                      <Input
                        id="user-name"
                        placeholder="Seu Nome Completo"
                        value={registerData.user_name}
                        onChange={(e) => setRegisterData({...registerData, user_name: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="admin@suaempresa.com"
                          className="pl-10"
                          value={registerData.email}
                          onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-password">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="register-password"
                          type="password"
                          placeholder="••••••••"
                          className="pl-10"
                          value={registerData.password}
                          onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirmar Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="••••••••"
                          className="pl-10"
                          value={registerData.confirmPassword}
                          onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Criando Conta...' : 'Criar Conta Empresarial'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>
            Ao criar uma conta, você concorda com nossos{' '}
            <span className="text-primary cursor-pointer hover:underline">
              Termos de Serviço
            </span>{' '}
            e{' '}
            <span className="text-primary cursor-pointer hover:underline">
              Política de Privacidade
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}