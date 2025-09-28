import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Settings,
  MessageCircle, 
  HelpCircle,
  Accessibility,
  Monitor,
  Bell,
  BookOpen,
  RotateCcw,
  Zap,
  X,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AccessibilityHelper } from '@/components/accessibility/AccessibilityHelper';
import { PerformanceMonitor } from '@/components/performance/PerformanceMonitor';
import { SmartNotificationCenter } from '@/components/SmartNotificationCenter';
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
  const { restartOnboarding } = useTutorial();

  const tools: ToolItem[] = [
    {
      id: 'ai-chat',
      name: 'Chat IA',
      description: 'Assistente inteligente ESG',
      icon: MessageCircle,
      color: 'from-primary to-primary/80',
      component: ChatIA
    },
    {
      id: 'tutorials',
      name: 'Tutoriais',
      description: 'Central de ajuda e guias',
      icon: BookOpen,
      color: 'from-blue-500 to-blue-600',
      component: UnifiedHelpCenter
    },
    {
      id: 'accessibility',
      name: 'Acessibilidade',
      description: 'Configurações de acessibilidade',
      icon: Accessibility,
      color: 'from-green-500 to-green-600',
      component: AccessibilityHelper
    },
    {
      id: 'performance',
      name: 'Performance',
      description: 'Monitoramento do sistema',
      icon: Monitor,
      color: 'from-orange-500 to-orange-600',
      component: PerformanceMonitor
    },
    {
      id: 'notifications',
      name: 'Notificações',
      description: 'Central de notificações',
      icon: Bell,
      color: 'from-purple-500 to-purple-600',
      component: SmartNotificationCenter,
      badge: 3
    },
    {
      id: 'onboarding',
      name: 'Onboarding',
      description: 'Reiniciar configuração inicial',
      icon: RotateCcw,
      color: 'from-indigo-500 to-indigo-600',
      action: () => {
        restartOnboarding();
        setIsOpen(false);
      }
    }
  ];

  const handleToolClick = (tool: ToolItem) => {
    if (tool.action) {
      tool.action();
    } else if (tool.component) {
      setActiveComponent(activeComponent === tool.id ? null : tool.id);
      setIsMinimized(false);
    }
  };

  const renderActiveComponent = () => {
    const activeTool = tools.find(tool => tool.id === activeComponent);
    if (!activeTool?.component) return null;

    const Component = activeTool.component;
    return (
      <div className="mt-4">
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
          className="h-16 w-16 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-primary via-primary/90 to-primary/80 hover:scale-110 group relative"
        >
          <div className="flex flex-col items-center justify-center">
            <Zap className="w-6 h-6 text-primary-foreground group-hover:rotate-12 transition-transform" />
            <div className="flex items-center gap-1 mt-1">
              <div className="w-1 h-1 bg-success rounded-full animate-pulse"></div>
              <span className="text-xs text-primary-foreground font-medium">Hub</span>
            </div>
          </div>
          
          {/* Notification badge */}
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-destructive-foreground">3</span>
          </div>
        </Button>
      </div>
    );
  }

  // Expanded Hub Interface
  return (
    <div className="fixed bottom-6 right-6 z-40">
      <Card className={cn(
        "w-96 max-w-[calc(100vw-24px)] bg-background/95 backdrop-blur-sm border shadow-2xl transition-all duration-300",
        isMinimized ? "h-20" : "",
        activeComponent && !isMinimized ? "h-[600px]" : "h-auto"
      )}>
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">Hub de Ferramentas</CardTitle>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="secondary" className="text-xs px-2">
                  6 Ferramentas
                </Badge>
                <Badge variant="outline" className="text-xs px-2">
                  <div className="w-2 h-2 bg-success rounded-full mr-1"></div>
                  Online
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {activeComponent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8 p-0"
                title={isMinimized ? "Maximizar" : "Minimizar"}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsOpen(false);
                setActiveComponent(null);
                setIsMinimized(false);
              }}
              className="h-8 w-8 p-0"
              title="Fechar Hub"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className={cn("p-4", isMinimized && "hidden")}>
          {/* Tools Grid */}
          {!activeComponent && (
            <div className="grid grid-cols-2 gap-3">
              {tools.map((tool) => (
                <Button
                  key={tool.id}
                  onClick={() => handleToolClick(tool)}
                  variant="ghost"
                  className={cn(
                    "h-20 flex flex-col items-center justify-center gap-2 relative overflow-hidden group",
                    "hover:scale-105 transition-all duration-200",
                    "border-2 border-transparent hover:border-primary/20"
                  )}
                >
                  {/* Background gradient */}
                  <div className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br",
                    tool.color
                  )} />
                  
                  {/* Icon */}
                  <div className="relative">
                    <tool.icon className="h-6 w-6 text-foreground group-hover:text-primary transition-colors" />
                    {tool.badge && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-2 -right-2 h-4 min-w-4 text-xs px-1"
                      >
                        {tool.badge}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Text */}
                  <div className="text-center">
                    <div className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                      {tool.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate w-full">
                      {tool.description}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}

          {/* Active Component Area */}
          {activeComponent && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveComponent(null)}
                  className="gap-2"
                >
                  ← Voltar ao Hub
                </Button>
              </div>
              
              <ScrollArea className="h-[480px] pr-4">
                {renderActiveComponent()}
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}