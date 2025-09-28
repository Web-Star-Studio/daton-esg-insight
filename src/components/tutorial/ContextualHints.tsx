import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Lightbulb, 
  X, 
  ArrowRight,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  FileText,
  Settings
} from "lucide-react";

interface ContextualHint {
  id: string;
  title: string;
  description: string;
  action?: string;
  actionUrl?: string;
  icon: any;
  priority: 'high' | 'medium' | 'low';
}

const PAGE_HINTS: Record<string, ContextualHint[]> = {
  '/dashboard': [
    {
      id: 'dashboard-kpis',
      title: 'Personalize seus KPIs',
      description: 'Configure quais indicadores são mais importantes para você',
      action: 'Personalizar',
      actionUrl: '/configuracao',
      icon: TrendingUp,
      priority: 'high'
    },
    {
      id: 'dashboard-widgets',
      title: 'Organize seus widgets',
      description: 'Arraste e solte para reorganizar os painéis como preferir',
      icon: Target,
      priority: 'medium'
    }
  ],
  '/gestao-pessoas': [
    {
      id: 'people-import',
      title: 'Importe seus colaboradores',
      description: 'Acelere o processo importando dados de planilhas Excel',
      action: 'Importar',
      actionUrl: '/gestao-pessoas/importar',
      icon: Users,
      priority: 'high'
    }
  ],
  '/relatorios': [
    {
      id: 'reports-templates',
      title: 'Use templates prontos',
      description: 'Economize tempo com modelos pré-configurados de relatórios',
      action: 'Ver Templates',
      actionUrl: '/relatorios/templates',
      icon: FileText,
      priority: 'high'
    }
  ],
  '/configuracao': [
    {
      id: 'config-notifications',
      title: 'Configure notificações',
      description: 'Defina quais alertas e lembretes você quer receber',
      action: 'Configurar',
      actionUrl: '/configuracao/notificacoes',
      icon: Settings,
      priority: 'medium'
    }
  ]
};

export function ContextualHints() {
  const location = useLocation();
  const [currentHints, setCurrentHints] = useState<ContextualHint[]>([]);
  const [dismissedHints, setDismissedHints] = useState<string[]>([]);
  const [visibleHint, setVisibleHint] = useState<ContextualHint | null>(null);

  useEffect(() => {
    // Load dismissed hints from localStorage
    const dismissed = localStorage.getItem('daton_dismissed_hints');
    if (dismissed) {
      setDismissedHints(JSON.parse(dismissed));
    }
  }, []);

  useEffect(() => {
    const hints = PAGE_HINTS[location.pathname] || [];
    const availableHints = hints.filter(hint => !dismissedHints.includes(hint.id));
    setCurrentHints(availableHints);
    
    // Show highest priority hint after 5 seconds
    if (availableHints.length > 0) {
      const timer = setTimeout(() => {
        const highPriorityHints = availableHints.filter(h => h.priority === 'high');
        const hintToShow = highPriorityHints[0] || availableHints[0];
        setVisibleHint(hintToShow);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [location.pathname, dismissedHints]);

  const dismissHint = (hintId: string) => {
    const newDismissed = [...dismissedHints, hintId];
    setDismissedHints(newDismissed);
    localStorage.setItem('daton_dismissed_hints', JSON.stringify(newDismissed));
    setVisibleHint(null);
  };

  const handleAction = (hint: ContextualHint) => {
    if (hint.actionUrl) {
      window.location.href = hint.actionUrl;
    }
    dismissHint(hint.id);
  };

  if (!visibleHint) return null;

  const Icon = visibleHint.icon;
  const priorityColors = {
    high: 'border-orange-200 bg-orange-50/50',
    medium: 'border-blue-200 bg-blue-50/50', 
    low: 'border-gray-200 bg-gray-50/50'
  };

  return (
    <Card className={`fixed top-20 right-6 w-80 z-30 shadow-xl border-2 ${priorityColors[visibleHint.priority]} animate-slide-in-right`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-white" />
            </div>
            <Badge 
              variant="secondary" 
              className={`text-xs animate-fade-in ${
                visibleHint.priority === 'high' ? 'bg-orange-100 text-orange-700' : 
                visibleHint.priority === 'medium' ? 'bg-blue-100 text-blue-700' : 
                'bg-gray-100 text-gray-700'
              }`}
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Dica {visibleHint.priority === 'high' ? 'Importante' : 'Útil'}
            </Badge>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => dismissHint(visibleHint.id)}
            className="w-6 h-6 p-0 hover:bg-white/50"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <Icon className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-foreground text-sm animate-fade-in">
                {visibleHint.title}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
                {visibleHint.description}
              </p>
            </div>
          </div>

          {visibleHint.action && (
            <div className="flex gap-2 pt-2 border-t border-white/50 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => dismissHint(visibleHint.id)}
                className="flex-1 text-xs"
              >
                Dispensar
              </Button>
              
              <Button 
                onClick={() => handleAction(visibleHint)}
                size="sm"
                className="flex-1 text-xs bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white hover-scale group"
              >
                <span>{visibleHint.action}</span>
                <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </div>
          )}

          <div className="text-center">
            <button 
              onClick={() => dismissHint(visibleHint.id)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors story-link"
            >
              Não mostrar mais dicas nesta página
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}