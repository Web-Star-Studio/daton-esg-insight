import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
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
import { motion } from 'framer-motion';
import datonLogo from '@/assets/daton-logo-header.png';
import '@/components/landing/heimdall/heimdall.css';

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
    }
  };

  const cleanCNPJ = (cnpj: string) => cnpj.replace(/[^\d]/g, '');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
        cnpj: cleanedCnpj,
        user_name: registerData.user_name.trim(),
        email: registerData.email.trim().toLowerCase(),
        password: registerData.password
      });
      
      navigate('/onboarding');
    } catch (error) {
      // Erro já tratado no context com toast
    }
  };

  const inputClassName = "pl-10 bg-white/60 border-[var(--heimdall-border)] focus:border-[var(--heimdall-accent)] focus:ring-[var(--heimdall-accent)] transition-colors";
  const inputClassNameNoIcon = "bg-white/60 border-[var(--heimdall-border)] focus:border-[var(--heimdall-accent)] focus:ring-[var(--heimdall-accent)] transition-colors";

  return (
    <div className="heimdall-page min-h-screen flex items-center justify-center p-4 precision-grid">
      <div className="w-full max-w-lg">
        {/* Logo/Header - Heimdall style */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-3">
            <img src={datonLogo} alt="Daton" className="h-9" />
          </div>
        </motion.div>

        {/* Auth Card - Glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card p-6 md:p-8"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-transparent border-b border-[var(--heimdall-border)] rounded-none p-0 h-auto">
              <TabsTrigger
                value="login"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--heimdall-accent)] data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-[var(--heimdall-text)] text-[var(--heimdall-text-muted)] font-mono text-xs uppercase tracking-widest pb-3 pt-1"
              >
                Login
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--heimdall-accent)] data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-[var(--heimdall-text)] text-[var(--heimdall-text-muted)] font-mono text-xs uppercase tracking-widest pb-3 pt-1"
              >
                Criar Conta
              </TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login" className="mt-6">
              <h2 className="heimdall-heading-sm text-center">Bem-vindo de volta</h2>
              <p className="heimdall-body-sm text-center mt-1">
                Entre com suas credenciais para acessar sua conta
              </p>

              {!isLoading && user && (
                <div className="mt-4 p-3 bg-[var(--heimdall-accent)]/10 border border-[var(--heimdall-accent)]/20 rounded-lg text-sm text-center">
                  Você já está logado, redirecionando...
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-[var(--heimdall-text-secondary)] text-sm">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-[var(--heimdall-text-muted)]" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      className={inputClassName}
                      value={loginData.email}
                      onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-[var(--heimdall-text-secondary)] text-sm">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-[var(--heimdall-text-muted)]" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      className={inputClassName}
                      value={loginData.password}
                      onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="heimdall-btn heimdall-btn-primary w-full text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-sm text-[var(--heimdall-accent)] hover:underline"
                  >
                    Esqueci minha senha
                  </button>
                </div>
              </form>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register" className="mt-6">
              <h2 className="heimdall-heading-sm text-center">Criar Conta Empresarial</h2>
              <p className="heimdall-body-sm text-center mt-1">
                Registre sua empresa na plataforma Daton
              </p>

              {/* Info box para usuários convidados */}
              <Alert className="mt-4 bg-[var(--heimdall-accent)]/5 border-[var(--heimdall-accent)]/20">
                <Info className="h-4 w-4 text-[var(--heimdall-accent)]" />
                <AlertDescription className="text-[var(--heimdall-text-secondary)] text-sm">
                  <strong>Recebeu um convite?</strong> Use o link enviado por email para definir sua senha. Não é necessário criar uma nova conta.
                </AlertDescription>
              </Alert>

              <form onSubmit={handleRegister} className="space-y-4 mt-6">
                {/* Dados da Empresa */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[var(--heimdall-text-muted)]" />
                    <span className="heimdall-label text-[0.7rem]">Dados da Empresa</span>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="company-name" className="text-[var(--heimdall-text-secondary)] text-sm">Nome da Empresa</Label>
                    <Input
                      id="company-name"
                      placeholder="Sua Empresa Ltda"
                      className={inputClassNameNoIcon}
                      value={registerData.company_name}
                      onChange={(e) => setRegisterData({...registerData, company_name: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cnpj" className="text-[var(--heimdall-text-secondary)] text-sm">CNPJ</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 h-4 w-4 text-[var(--heimdall-text-muted)]" />
                      <Input
                        id="cnpj"
                        placeholder="00.123.456/0001-89"
                        className={inputClassName}
                        value={registerData.cnpj}
                        onChange={(e) => setRegisterData({...registerData, cnpj: e.target.value})}
                        aria-describedby="cnpj-hint"
                        required
                      />
                    </div>
                    <small id="cnpj-hint" className="text-xs text-[var(--heimdall-text-muted)]">
                      Apenas números, 14 dígitos
                    </small>
                  </div>
                </div>

                <Separator className="bg-[var(--heimdall-border)]" />

                {/* Dados do Usuário */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-[var(--heimdall-text-muted)]" />
                    <span className="heimdall-label text-[0.7rem]">Dados do Administrador</span>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="user-name" className="text-[var(--heimdall-text-secondary)] text-sm">Nome Completo</Label>
                    <Input
                      id="user-name"
                      placeholder="Seu Nome Completo"
                      className={inputClassNameNoIcon}
                      value={registerData.user_name}
                      onChange={(e) => setRegisterData({...registerData, user_name: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-[var(--heimdall-text-secondary)] text-sm">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-[var(--heimdall-text-muted)]" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="admin@suaempresa.com"
                        className={inputClassName}
                        value={registerData.email}
                        onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                        aria-describedby="email-hint"
                        required
                      />
                    </div>
                    <small id="email-hint" className="text-xs text-[var(--heimdall-text-muted)]">
                      Use seu email corporativo
                    </small>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-[var(--heimdall-text-secondary)] text-sm">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-[var(--heimdall-text-muted)]" />
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="••••••••"
                        className={inputClassName}
                        value={registerData.password}
                        onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                        required
                      />
                    </div>
                    {registerData.password && (
                      <div className="mt-2 space-y-1">
                        {getPasswordRequirementChecks(registerData.password).map((req, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs">
                            {req.met ? (
                              <CheckCircle2 className="h-3 w-3 text-[var(--heimdall-accent)]" />
                            ) : (
                              <XCircle className="h-3 w-3 text-[var(--heimdall-text-muted)]" />
                            )}
                            <span className={req.met ? 'text-[var(--heimdall-accent)]' : 'text-[var(--heimdall-text-muted)]'}>
                              {req.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-[var(--heimdall-text-secondary)] text-sm">Confirmar Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-[var(--heimdall-text-muted)]" />
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="••••••••"
                        className={inputClassName}
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="heimdall-btn heimdall-btn-primary w-full text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Criando Conta...' : 'Criar Conta Empresarial'}
                </button>
              </form>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Footer Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-6 text-sm text-[var(--heimdall-text-muted)]"
        >
          <p>
            Ao criar uma conta, você concorda com nossos{' '}
            <Link to="/termos" className="text-[var(--heimdall-accent)] hover:underline">
              Termos de Serviço
            </Link>{' '}
            e{' '}
            <Link to="/privacidade" className="text-[var(--heimdall-accent)] hover:underline">
              Política de Privacidade
            </Link>
          </p>
        </motion.div>
      </div>

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />
    </div>
  );
}
