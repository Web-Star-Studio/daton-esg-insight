import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingTipsProps {
  currentStep: number;
}

const TIPS_BY_STEP = {
  0: [
    "Configure seu perfil da empresa para recomendações personalizadas",
    "Quanto mais detalhes, melhor a experiência personalizada"
  ],
  1: [
    "Você pode começar com apenas 1 módulo e adicionar mais depois",
    "Módulos recomendados são baseados no seu setor e tamanho",
    "Use os filtros para encontrar módulos específicos rapidamente"
  ],
  2: [
    "Use o Setup Rápido para configurar tudo em segundos",
    "Configurações podem ser ajustadas depois no painel administrativo",
    "Expanda cada módulo para ver todas as opções disponíveis"
  ],
  3: [
    "Faça o tour guiado para conhecer todos os recursos",
    "Seu progresso está salvo, pode fazer uma pausa a qualquer momento"
  ]
};

export function OnboardingTips({ currentStep }: OnboardingTipsProps) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const tips = TIPS_BY_STEP[currentStep as keyof typeof TIPS_BY_STEP] || [];

  useEffect(() => {
    if (tips.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % tips.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [tips.length, currentStep]);

  useEffect(() => {
    setIsDismissed(false);
    setCurrentTipIndex(0);
  }, [currentStep]);

  if (tips.length === 0 || isDismissed) return null;

  return (
    <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200/50 animate-slide-up">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="p-1.5 bg-amber-100 rounded-lg">
            <Lightbulb className="h-4 w-4 text-amber-600" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <Badge className="bg-amber-600 hover:bg-amber-700 text-xs">
                Dica {currentTipIndex + 1}/{tips.length}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDismissed(true)}
                className="h-5 w-5 p-0 hover:bg-amber-100"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-sm text-amber-900 leading-relaxed animate-fade-in">
              {tips[currentTipIndex]}
            </p>
            {tips.length > 1 && (
              <div className="flex gap-1 pt-1">
                {tips.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 rounded-full transition-all ${
                      index === currentTipIndex
                        ? 'w-4 bg-amber-600'
                        : 'w-1 bg-amber-300'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
