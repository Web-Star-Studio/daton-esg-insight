import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { 
  MessageCircle, 
  HelpCircle,
  Accessibility,
  BookOpen,
  RotateCcw,
  Settings,
  X,
  Minimize2,
  Maximize2,
  Expand,
  ChevronLeft,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AccessibilityHelper } from '@/components/accessibility/AccessibilityHelper';

import { UnifiedHelpCenter } from '@/components/tutorial/UnifiedHelpCenter';
import { ChatIA } from '@/components/tools/ChatIA';
import { useTutorial } from '@/contexts/TutorialContext';

interface ToolItem {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  component?: React.ComponentType<any>;
  action?: () => void;
  badge?: string | number;
}

export function UnifiedToolHub() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeComponent, setActiveComponent] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [hubMode, setHubMode] = useState<'compact' | 'expanded'>('compact');
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const { restartOnboarding, startTour } = useTutorial();

  const tools: ToolItem[] = [
    {
      id: 'ai-chat',
      name: 'Chat IA',
      description: 'Assistente inteligente ESG',
      icon: MessageCircle,
      color: 'from-blue-500 to-cyan-500',
      component: ChatIA,
      badge: 'NEW'
    },
    {
      id: 'tour-guiado',
      name: 'Tour Guiado',
      description: 'Aprenda a usar a plataforma',
      icon: BookOpen,
      color: 'from-green-500 to-emerald-500',
      action: () => {
        // Aguardar um pouco para garantir que os elementos existam
        setTimeout(() => {
          startTour('dashboard-intro');
        }, 100);
        setIsOpen(false);
      }
    },
    {
      id: 'ajuda',
      name: 'Ajuda',
      description: 'Central de ajuda e suporte',
      icon: HelpCircle,
      color: 'from-orange-500 to-red-500',
      action: () => {
        setShowHelpCenter(true);
      }
    },
    {
      id: 'configuracao',
      name: 'Configuração',
      description: 'Refazer configuração inicial',
      icon: Settings,
      color: 'from-purple-500 to-pink-500',
      action: () => {
        restartOnboarding();
        setIsOpen(false);
      }
    },
    {
      id: 'acessibilidade',
      name: 'Acessibilidade',
      description: 'Ferramentas de acessibilidade',
      icon: Accessibility,
      color: 'from-indigo-500 to-purple-500',
      component: () => <AccessibilityHelper embedded />
    }
  ];

  const handleToolClick = (tool: ToolItem) => {
    if (tool.action) {
      tool.action();
    } else if (tool.component) {
      setActiveComponent(activeComponent === tool.id ? null : tool.id);
      setIsMinimized(false);
      // Auto expand for Chat IA
      if (tool.id === 'ai-chat') {
        setHubMode('expanded');
      }
    }
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const renderActiveComponent = () => {
    const activeTool = tools.find(tool => tool.id === activeComponent);
    if (!activeTool?.component) return null;

    const Component = activeTool.component;
    
    // Full screen mode for Chat IA
    if (isFullScreen && activeTool.id === 'ai-chat') {
      return (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFullScreen(false)}
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Voltar
                </Button>
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Chat IA - ESG Assistant</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsFullScreen(false);
                  setActiveComponent(null);
                  setIsOpen(false);
                }}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 p-4">
              <Component />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full">
        <Component />
      </div>
    );
  };

  // Floating Hub Button (closed state)
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="h-14 w-14 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-primary via-primary/90 to-primary/80 hover:scale-110 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex flex-col items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground group-hover:rotate-12 transition-transform" />
            <span className="text-xs text-primary-foreground font-medium mt-0.5">Hub</span>
          </div>
          <div className="absolute top-1 right-1 w-2 h-2 bg-success rounded-full animate-pulse" />
        </Button>
      </div>
    );
  }

  // Render full screen component if active
  if (isFullScreen) {
    return renderActiveComponent();
  }

  // Responsive Hub Interface with improved dimensions
  const hubWidth = hubMode === 'expanded' ? 'w-[36rem]' : 'w-[28rem]';
  const hubHeight = activeComponent && !isMinimized ? 'h-[40rem]' : 'h-auto';

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <Card className={cn(
        "max-w-[calc(100vw-24px)] bg-background/95 backdrop-blur-sm border shadow-2xl transition-all duration-300",
        hubWidth,
        isMinimized ? "h-16" : hubHeight
      )}>
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 border-b">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">Hub de Ferramentas</CardTitle>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="secondary" className="text-xs px-2 py-0">
                  {tools.length} Ferramentas
                </Badge>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
                  <span className="text-xs text-muted-foreground">Online</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {activeComponent === 'ai-chat' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullScreen}
                className="h-7 w-7 p-0"
                title="Tela Cheia"
              >
                <Expand className="h-3.5 w-3.5" />
              </Button>
            )}
            {activeComponent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-7 w-7 p-0"
                title={isMinimized ? "Maximizar" : "Minimizar"}
              >
                {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsOpen(false);
                setActiveComponent(null);
                setIsMinimized(false);
                setHubMode('compact');
              }}
              className="h-7 w-7 p-0"
              title="Fechar Hub"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className={cn("p-3", isMinimized && "hidden")}>
          {/* Tools Grid - Improved with better spacing and larger cards */}
          {!activeComponent && (
            <div className="grid grid-cols-2 gap-4">
              {tools.map((tool) => (
                <Button
                  key={tool.id}
                  onClick={() => handleToolClick(tool)}
                  variant="ghost"
                  className={cn(
                    "h-20 flex flex-col items-center justify-center gap-2 relative overflow-hidden group p-4",
                    "hover:scale-105 transition-all duration-200 hover:shadow-lg",
                    "border border-border/50 hover:border-primary/30 rounded-xl",
                    "bg-card hover:bg-accent/50"
                  )}
                >
                  {/* Background gradient */}
                  <div className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-15 transition-opacity bg-gradient-to-br",
                    tool.color
                  )} />
                  
                  {/* Icon */}
                  <div className="relative">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md bg-gradient-to-br",
                      tool.color
                    )}>
                      <tool.icon className="h-5 w-5" />
                    </div>
                    {tool.badge && (
                      <Badge 
                        variant="secondary" 
                        className="absolute -top-1 -right-1 h-4 min-w-4 text-xs px-1.5 py-0 bg-primary text-primary-foreground"
                      >
                        {tool.badge}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Text */}
                  <div className="text-center space-y-1">
                    <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {tool.name}
                    </div>
                    <div className="text-xs text-muted-foreground leading-tight">
                      {tool.description}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}

          {/* Active Component Area - Improved with better sizing */}
          {activeComponent && (
            <div className="flex flex-col h-[calc(40rem-8rem)]">
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveComponent(null);
                    setHubMode('compact');
                  }}
                  className="gap-2 h-8"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Voltar
                </Button>
                
                {activeComponent === 'ai-chat' && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      <MessageCircle className="h-3 w-3 mr-1" />
                      ESG Assistant
                    </Badge>
                  </div>
                )}
              </div>
              
              <div className="flex-1 overflow-hidden">
                {renderActiveComponent()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Center Dialog */}
      <Dialog open={showHelpCenter} onOpenChange={setShowHelpCenter}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <UnifiedHelpCenter />
        </DialogContent>
      </Dialog>
    </div>
  );
}