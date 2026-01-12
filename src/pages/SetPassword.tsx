import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, Check, X, ShieldCheck } from "lucide-react";
import { z } from "zod";

// Password requirements
const passwordSchema = z.string()
  .min(8, "Mínimo 8 caracteres")
  .regex(/[A-Z]/, "Pelo menos uma letra maiúscula")
  .regex(/[a-z]/, "Pelo menos uma letra minúscula")
  .regex(/[0-9]/, "Pelo menos um número");

interface PasswordRequirement {
  label: string;
  regex: RegExp;
  met: boolean;
}

export default function SetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Password requirements check
  const requirements: PasswordRequirement[] = [
    { label: "Mínimo 8 caracteres", regex: /.{8,}/, met: /.{8,}/.test(password) },
    { label: "Uma letra maiúscula", regex: /[A-Z]/, met: /[A-Z]/.test(password) },
    { label: "Uma letra minúscula", regex: /[a-z]/, met: /[a-z]/.test(password) },
    { label: "Um número", regex: /[0-9]/, met: /[0-9]/.test(password) },
  ];

  const allRequirementsMet = requirements.every(r => r.met);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  // Handle magic link authentication from URL hash
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if we have hash parameters (magic link callback)
        const hashParams = new URLSearchParams(location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken && refreshToken) {
          // Set session from magic link tokens
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error("Error setting session:", error);
            toast({
              title: "Link expirado",
              description: "Este link de convite expirou. Solicite um novo convite ao administrador.",
              variant: "destructive",
            });
            setIsVerifying(false);
            return;
          }

          if (data.user) {
            setSessionValid(true);
            setUserEmail(data.user.email || "");
            // Clear the hash from URL for cleaner appearance
            window.history.replaceState(null, "", location.pathname);
          }
        } else {
          // No hash params, check for existing session
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            // User already has a session, check if they need to set password
            setSessionValid(true);
            setUserEmail(session.user.email || "");
          } else {
            toast({
              title: "Sessão inválida",
              description: "Por favor, use o link enviado no seu email de convite.",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error("Error handling auth callback:", error);
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao validar sua sessão.",
          variant: "destructive",
        });
      } finally {
        setIsVerifying(false);
      }
    };

    handleAuthCallback();
  }, [location, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password
    const validationResult = passwordSchema.safeParse(password);
    if (!validationResult.success) {
      toast({
        title: "Senha inválida",
        description: "Por favor, atenda todos os requisitos da senha.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Senhas não conferem",
        description: "As senhas digitadas não são iguais.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw error;
      }

      toast({
        title: "Senha definida com sucesso!",
        description: "Você será redirecionado para o painel.",
      });

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error: any) {
      console.error("Error setting password:", error);
      toast({
        title: "Erro ao definir senha",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Verificando seu convite...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!sessionValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <X className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Link Inválido ou Expirado</CardTitle>
            <CardDescription>
              Este link de convite não é válido ou já expirou. Por favor, entre em contato com o administrador para solicitar um novo convite.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/auth")}
            >
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Defina sua Senha</CardTitle>
          <CardDescription>
            Bem-vindo! Crie uma senha segura para acessar sua conta.
            {userEmail && (
              <span className="block mt-2 font-medium text-foreground">{userEmail}</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Password field */}
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  disabled={isLoading}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            {/* Password requirements */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Requisitos da senha:</p>
              <div className="grid grid-cols-2 gap-2">
                {requirements.map((req, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-2 text-sm ${
                      req.met ? "text-green-600" : "text-muted-foreground"
                    }`}
                  >
                    {req.met ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    <span>{req.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Confirm password field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme sua senha"
                  disabled={isLoading}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="text-sm text-destructive">As senhas não conferem</p>
              )}
              {passwordsMatch && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <Check className="h-4 w-4" /> Senhas conferem
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !allRequirementsMet || !passwordsMatch}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Definindo senha...
                </>
              ) : (
                "Definir Senha e Acessar"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
