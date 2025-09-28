import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  X, 
  ArrowRight,
  Sparkles,
  Zap,
  BookOpen,
  Target
} from "lucide-react";
import { useTutorial } from '@/contexts/TutorialContext';

export function SmartTutorialFloater() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const { startTour } = useTutorial();

  useEffect(() => {
    // Show floater after 10 seconds if user hasn't interacted
    const timer = setTimeout(() => {
      const hasSeenFloater = localStorage.getItem('daton_tutorial_floater_seen');
      if (!hasSeenFloater && !hasInteracted) {
        setIsVisible(true);
      }
    }, 10000);

    // Hide if user starts interacting
    const handleInteraction = () => {
      setHasInteracted(true);
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('scroll', handleInteraction);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('scroll', handleInteraction);
    };
  }, [hasInteracted]);

  const handleStartTutorial = () => {
    startTour('dashboard-intro');
    setIsVisible(false);
    localStorage.setItem('daton_tutorial_floater_seen', 'true');
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('daton_tutorial_floater_seen', 'true');
  };

  if (!isVisible) return null;

  return (
    <Card className="fixed bottom-6 left-6 w-80 z-40 shadow-2xl border-2 border-primary/20 animate-slide-in-right">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-lg flex items-center justify-center animate-pulse">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <Badge variant="secondary" className="text-xs animate-fade-in">
              <Zap className="w-3 h-3 mr-1" />
              Novo usuário
            </Badge>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDismiss}
            className="w-6 h-6 p-0 hover:bg-muted"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-foreground animate-fade-in">
            👋 Precisa de ajuda para começar?
          </h4>
          
          <p className="text-sm text-muted-foreground leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Que tal um <strong>tour guiado de 2 minutos</strong> pelas principais funcionalidades? 
            Vamos te mostrar como aproveitar ao máximo a plataforma!
          </p>

          <div className="flex gap-2 pt-2 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDismiss}
              className="flex-1"
            >
              Agora não
            </Button>
            
            <Button 
              onClick={handleStartTutorial}
              size="sm"
              className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 hover-scale group"
            >
              <Play className="w-3 h-3 mr-1" />
              <span>Fazer Tour</span>
              <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
            </div>
            <span className="text-xs text-muted-foreground">
              2 min • Interativo • Personalizado
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}