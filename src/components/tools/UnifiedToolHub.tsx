import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  MessageCircle, 
  HelpCircle,
  Settings,
  BookOpen,
  Accessibility,
  X,
  Minimize2,
  Maximize2,
  ChevronLeft,
  Sparkles,
  Loader2,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AccessibilityHelper } from '@/components/accessibility/AccessibilityHelper';
import { toast } from '@/hooks/use-toast';

import { UnifiedHelpCenter } from '@/components/tutorial/UnifiedHelpCenter';
import { ChatAssistant } from '@/components/tools/ChatAssistant';
import { useTutorial } from '@/contexts/TutorialContext';

interface ToolItem {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  component?: React.ComponentType<any>;
  action?: () => Promise<void> | void;
}

export function UnifiedToolHub() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeComponent, setActiveComponent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const { restartOnboarding, startTour } = useTutorial();

  const tools: ToolItem[] = [
    {
      id: 'ai-chat',
      name: 'Chat IA',
      description: 'Assistente ESG inteligente',
      icon: MessageCircle,
      component: ChatAssistant
    },
    {
      id: 'tour-guiado',
      name: 'Tour',
      description: 'Guia interativo',
      icon: BookOpen,
      action: async () => {
        toast({ title: "Iniciando tour completo...", description: "Navegando pela plataforma" });
        await new Promise(resolve => setTimeout(resolve, 300));
        startTour('complete-platform-tour');
        setIsOpen(false);
      }
    },
    {
      id: 'ajuda',
      name: 'Ajuda',
      description: 'Suporte e docs',
      icon: HelpCircle,
      action: () => setShowHelpCenter(true)
    },
    {
      id: 'configuracao',
      name: 'Config',
      description: 'Configurações',
      icon: Settings,
      action: async () => {
        toast({ title: "Reiniciando...", description: "Redirecionando" });
        await new Promise(resolve => setTimeout(resolve, 500));
        restartOnboarding();
      }
    },
    {
      id: 'acessibilidade',
      name: 'A11y',
      description: 'Acessibilidade',
      icon: Accessibility,
      component: () => <AccessibilityHelper embedded />
    }
  ];

  const handleToolClick = useCallback(async (tool: ToolItem) => {
    if (tool.action) {
      setIsLoading(true);
      try {
        await tool.action();
      } catch (error) {
        toast({
          title: "Erro",
          description: "Falha ao executar ação",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    } else if (tool.component) {
      setActiveComponent(activeComponent === tool.id ? null : tool.id);
    }
  }, [activeComponent, startTour, restartOnboarding]);

  const closeHub = useCallback(() => {
    setIsOpen(false);
    setActiveComponent(null);
    setIsLoading(false);
    setShowHelpCenter(false);
  }, []);

  // ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeHub();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeHub]);

  const renderActiveComponent = () => {
    const activeTool = tools.find(tool => tool.id === activeComponent);
    if (!activeTool?.component) return null;

    const Component = activeTool.component;
    return (
      <div className="h-full">
        <Component />
      </div>
    );
  };

  // Floating Hub Button
  if (!isOpen) {
    return (
      <TooltipProvider>
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setIsOpen(true)}
                size="lg"
                className={cn(
                  "h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg hover:shadow-xl",
                  "bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-110",
                  "animate-fade-in"
                )}
              >
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Hub de Ferramentas</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 animate-scale-in">
        <Card className={cn(
          "w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-background/95 backdrop-blur-lg border shadow-2xl",
          activeComponent ? "h-[70vh] sm:h-[32rem]" : "h-auto"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-primary-foreground" />
              </div>
              <span className="font-medium text-sm">Ferramentas</span>
              <Badge variant="secondary" className="text-xs">
                {tools.length}
              </Badge>
            </div>
            
            <div className="flex items-center gap-1">
              {activeComponent && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveComponent(null)}
                  className="h-6 w-6 p-0"
                >
                  <Minimize2 className="w-3 h-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={closeHub}
                className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <CardContent className="p-3">
            {/* Tools Grid */}
            {!activeComponent && (
              <div className="grid grid-cols-2 gap-2">
                {tools.map((tool) => (
                  <Tooltip key={tool.id}>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => handleToolClick(tool)}
                        variant="ghost"
                        disabled={isLoading}
                        className={cn(
                          "h-16 flex flex-col items-center justify-center gap-1 relative",
                          "hover:bg-accent transition-all duration-200 hover:scale-105",
                          "border border-transparent hover:border-border rounded-lg"
                        )}
                      >
                        {/* Loading overlay */}
                        {isLoading && (
                          <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                            <Loader2 className="w-4 h-4 animate-spin" />
                          </div>
                        )}

                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <tool.icon className="w-4 h-4 text-primary" />
                        </div>
                        
                        <div className="text-center">
                          <div className="text-xs font-medium">{tool.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {tool.description}
                          </div>
                        </div>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>{tool.description}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            )}

            {/* Active Component */}
            {activeComponent && (
              <div className="flex flex-col h-[calc(70vh-6rem)] sm:h-[calc(32rem-6rem)]">
                <div className="flex items-center justify-between mb-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveComponent(null)}
                    className="gap-1 h-7 text-xs"
                  >
                    <ChevronLeft className="w-3 h-3" />
                    Voltar
                  </Button>
                  
                  <Badge variant="outline" className="text-xs">
                    {tools.find(t => t.id === activeComponent)?.name}
                  </Badge>
                </div>
                
                <div className="flex-1 overflow-hidden rounded-lg border bg-muted/20">
                  {renderActiveComponent()}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Center Dialog */}
        <Dialog open={showHelpCenter} onOpenChange={setShowHelpCenter}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Central de Ajuda</DialogTitle>
              <DialogDescription>
                Acesse tutoriais, documentação e suporte para usar a plataforma
              </DialogDescription>
            </DialogHeader>
            <UnifiedHelpCenter />
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}