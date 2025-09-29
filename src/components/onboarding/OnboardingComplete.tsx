import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Rocket, ArrowRight } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function OnboardingComplete() {
  const { skipOnboarding } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-complete onboarding after component mounts
    const completeOnboarding = async () => {
      try {
        console.log('🎉 OnboardingComplete component mounted - completing onboarding');
        await skipOnboarding();
        console.log('✅ Onboarding marked as completed');
      } catch (error) {
        console.error('❌ Error completing onboarding:', error);
      }
    };

    // Add a small delay to ensure proper state transition
    const timer = setTimeout(completeOnboarding, 500);
    return () => clearTimeout(timer);
  }, [skipOnboarding]);

  const handleGoToDashboard = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md text-center shadow-xl border-green-200 bg-green-50/50">
        <CardHeader className="space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          
          <CardTitle className="text-2xl font-bold text-green-800">
            🎉 Onboarding Concluído!
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-green-700">
              Sua plataforma Daton está configurada e pronta para uso!
            </p>
            <p className="text-sm text-green-600">
              Você criou dados reais em seus módulos e pode começar a trabalhar imediatamente.
            </p>
          </div>

          <Button 
            onClick={handleGoToDashboard}
            size="lg"
            className="w-full"
          >
            <Rocket className="mr-2 h-4 w-4" />
            Ir para Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <p className="text-xs text-muted-foreground">
            Você sempre pode acessar o guia de configuração pelo menu lateral.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}