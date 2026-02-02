import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Building2, Mail, Lock, User, FileText, Info, CheckCircle2, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { ForgotPasswordModal } from '@/components/ForgotPasswordModal';
import { validatePassword, getPasswordRequirementChecks } from '@/utils/passwordValidation';

export default function Auth() {
  const { login, register, isLoading, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      logger.info('User already logged in, redirecting to dashboard', 'auth', { userId: user.id });
      navigate('/dashboard', { replace: true });
    }
  }, [isLoading, user, navigate]);

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
      logger.info('Submitting login form', 'auth', { email: loginData.email });
      await login(loginData.email, loginData.password);
      logger.info('Login successful, navigating to dashboard', 'auth');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      logger.error('Login form submission failed', error, 'auth');
      // Erro já tratado no context com toast
    }
  };

  // Função para limpar CNPJ (remover caracteres especiais)
  const cleanCNPJ = (cnpj: string) => cnpj.replace(/[^\d]/g, '');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password strength
    const passwordValidation = validatePassword(registerData.password);
    if (!passwordValidation.valid) {
      toast({
        variant: "destructive",
        title: "Senha não atende aos requisitos",
        description: passwordValidation.errors[0],
      });
      return;
    }
    
    if (registerData.password !== registerData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "As senhas não coincidem!",
      });
      return;
    }

    const cleanedCnpj = cleanCNPJ(registerData.cnpj);
    
    if (cleanedCnpj.length !== 14) {
      toast({
        variant: "destructive",
        title: "CNPJ inválido",
        description: "O CNPJ deve ter 14 dígitos.",
      });
      return;
    }

    try {
      await register({
        company_name: registerData.company_name.trim(),
        cnpj: cleanedCnpj, // CNPJ normalizado (apenas números)
        user_name: registerData.user_name.trim(),
        email: registerData.email.trim().toLowerCase(),
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

                {!isLoading && user && (
                  <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm text-center">
                    Você já está logado, redirecionando...
                  </div>
                )}

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

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setIsForgotPasswordOpen(true)}
                      className="text-sm text-primary hover:underline"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                </form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register" className="mt-6">
                <CardTitle className="text-2xl text-center">Criar Conta Empresarial</CardTitle>
                <CardDescription className="text-center">
                  Registre sua empresa na plataforma Daton
                </CardDescription>

                {/* Info box para usuários convidados */}
                <Alert className="mt-4 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    <strong>Recebeu um convite?</strong> Use o link enviado por email para definir sua senha. Não é necessário criar uma nova conta.
                  </AlertDescription>
                </Alert>

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
                      {/* Password Requirements Feedback */}
                      {registerData.password && (
                        <div className="mt-2 space-y-1">
                          {getPasswordRequirementChecks(registerData.password).map((req, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs">
                              {req.met ? (
                                <CheckCircle2 className="h-3 w-3 text-green-600" />
                              ) : (
                                <XCircle className="h-3 w-3 text-muted-foreground" />
                              )}
                              <span className={req.met ? 'text-green-600' : 'text-muted-foreground'}>
                                {req.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
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
            <Link to="/termos" className="text-primary hover:underline">
              Termos de Serviço
            </Link>{' '}
            e{' '}
            <Link to="/privacidade" className="text-primary hover:underline">
              Política de Privacidade
            </Link>
          </p>
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />
    </div>
  );
}