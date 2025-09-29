import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  Sparkles, 
  ArrowRight,
  Star,
  Trophy,
  Target,
  Zap
} from 'lucide-react';

interface OnboardingSuccessScreenProps {
  userName?: string;
  modulesCount: number;
  configCount: number;
  onContinue: () => void;
}

export function OnboardingSuccessScreen({ 
  userName, 
  modulesCount, 
  configCount, 
  onContinue 
}: OnboardingSuccessScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-background to-blue-50 p-4">
      <div className="max-w-lg w-full space-y-8 text-center">
        {/* Success Animation */}
        <div className="animate-scale-in">
          <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto shadow-2xl animate-pulse">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Success Message */}
        <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <Trophy className="w-3 h-3 mr-1" />
            Configuração Concluída
          </Badge>
          
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            🎉 Parabéns{userName ? `, ${userName}` : ''}!
          </h1>
          
          <p className="text-lg text-muted-foreground">
            Sua plataforma Daton está 100% configurada e pronta para uso!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/20 hover-scale">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div className="text-2xl font-bold text-primary">{modulesCount}</div>
              <div className="text-xs text-muted-foreground">Módulos Ativos</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-card to-secondary/5 border-secondary/20 hover-scale">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <Zap className="w-5 h-5 text-secondary" />
              </div>
              <div className="text-2xl font-bold text-secondary">{configCount}</div>
              <div className="text-xs text-muted-foreground">Configurações</div>
            </CardContent>
          </Card>
        </div>

        {/* Features Highlight */}
        <Card className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-blue-200/30 animate-fade-in" style={{ animationDelay: '0.7s' }}>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-foreground">O que você pode fazer agora:</h3>
            </div>
            <div className="grid grid-cols-2 gap-y-2 text-sm text-muted-foreground text-left">
              <div className="flex items-center gap-2">
                <Star className="w-3 h-3 text-yellow-500" />
                <span>Dashboard em tempo real</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-3 h-3 text-yellow-500" />
                <span>Relatórios automáticos</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-3 h-3 text-yellow-500" />
                <span>Gestão inteligente</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-3 h-3 text-yellow-500" />
                <span>Conformidade ESG</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.9s' }}>
          <Button 
            onClick={onContinue}
            size="lg"
            className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-lg hover:shadow-xl transition-all group"
          >
            <span>Acessar Plataforma</span>
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          <p className="text-xs text-muted-foreground">
            Você pode personalizar tudo a qualquer momento nas configurações
          </p>
        </div>
      </div>
    </div>
  );
}