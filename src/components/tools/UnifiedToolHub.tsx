import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  Sparkles,
  Loader2,
  CheckCircle,
  AlertCircle,
  Star,
  StarOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AccessibilityHelper } from '@/components/accessibility/AccessibilityHelper';
import { toast } from '@/hooks/use-toast';

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
  status?: 'online' | 'offline' | 'loading' | 'error';
  favorite?: boolean;
  lastUsed?: Date;
}

export function UnifiedToolHub() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeComponent, setActiveComponent] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [hubMode, setHubMode] = useState<'compact' | 'expanded'>('compact');
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTool, setLoadingTool] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['ai-chat']));
  const { restartOnboarding, startTour } = useTutorial();

  const tools: ToolItem[] = [
    {
      id: 'ai-chat',
      name: 'Chat IA',
      description: 'Assistente inteligente ESG',
      icon: MessageCircle,
      color: 'from-blue-500 to-cyan-500',
      component: ChatIA,
      badge: 'NEW',
      status: 'online',
      favorite: favorites.has('ai-chat')
    },
    {
      id: 'tour-guiado',
      name: 'Tour Guiado',
      description: 'Aprenda a usar a plataforma',
      icon: BookOpen,
      color: 'from-green-500 to-emerald-500',
      status: 'online',
      favorite: favorites.has('tour-guiado'),
      action: async () => {
        setLoadingTool('tour-guiado');
        toast({
          title: "Iniciando Tour Guiado",
          description: "Aguarde enquanto preparamos seu tour...",
        });
        
        // Aguardar um pouco para garantir que os elementos existam
        setTimeout(() => {
          startTour('dashboard-intro');
          setLoadingTool(null);
          setIsOpen(false);
          toast({
            title: "Tour Iniciado!",
            description: "Siga as instruções para aprender a plataforma.",
          });
        }, 500);
      }
    },
    {
      id: 'ajuda',
      name: 'Ajuda',
      description: 'Central de ajuda e suporte',
      icon: HelpCircle,
      color: 'from-orange-500 to-red-500',
      status: 'online',
      favorite: favorites.has('ajuda'),
      action: () => {
        setShowHelpCenter(true);
        toast({
          title: "Centro de Ajuda",
          description: "Acesse nossa documentação e suporte.",
        });
      }
    },
    {
      id: 'configuracao',
      name: 'Configuração',
      description: 'Refazer configuração inicial',
      icon: Settings,
      color: 'from-purple-500 to-pink-500',
      status: 'online',
      favorite: favorites.has('configuracao'),
      action: async () => {
        setLoadingTool('configuracao');
        toast({
          title: "Reiniciando Configuração",
          description: "Redirecionando para configuração inicial...",
        });
        
        setTimeout(() => {
          restartOnboarding();
          setLoadingTool(null);
          setIsOpen(false);
        }, 1000);
      }
    },
    {
      id: 'acessibilidade',
      name: 'Acessibilidade',
      description: 'Ferramentas de acessibilidade',
      icon: Accessibility,
      color: 'from-indigo-500 to-purple-500',
      status: 'online',
      favorite: favorites.has('acessibilidade'),
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
          description: "Falha ao executar a ação. Tente novamente.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    } else if (tool.component) {
      setActiveComponent(activeComponent === tool.id ? null : tool.id);
      setIsMinimized(false);
      
      // Auto expand for Chat IA
      if (tool.id === 'ai-chat') {
        setHubMode('expanded');
        toast({
          title: "Chat IA Ativado",
          description: "Converse com nosso assistente ESG inteligente!",
        });
      }
    }
  }, [activeComponent, startTour, restartOnboarding]);

  const toggleFavorite = useCallback((toolId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(toolId)) {
        newFavorites.delete(toolId);
        toast({
          title: "Removido dos Favoritos",
          description: "Ferramenta removida dos favoritos.",
        });
      } else {
        newFavorites.add(toolId);
        toast({
          title: "Adicionado aos Favoritos",
          description: "Ferramenta adicionada aos favoritos.",
        });
      }
      return newFavorites;
    });
  }, []);

  const closeHub = useCallback(() => {
    setIsOpen(false);
    setActiveComponent(null);
    setIsFullScreen(false);
    setIsMinimized(false);
    setHubMode('compact');
    setShowHelpCenter(false);
    setIsLoading(false);
    setLoadingTool(null);
  }, []);

  const toggleFullScreen = useCallback(() => {
    setIsFullScreen(!isFullScreen);
    if (!isFullScreen) {
      toast({
        title: "Modo Tela Cheia",
        description: "Use ESC para sair do modo tela cheia.",
      });
    }
  }, [isFullScreen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        if (isFullScreen) {
          setIsFullScreen(false);
        } else {
          closeHub();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullScreen, closeHub]);

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

  const getStatusIndicator = (status: ToolItem['status']) => {
    switch (status) {
      case 'online':
        return <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />;
      case 'offline':
        return <div className="w-2 h-2 bg-red-500 rounded-full" />;
      case 'loading':
        return <Loader2 className="w-3 h-3 animate-spin text-blue-500" />;
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
    }
  };

  // Responsive Hub Interface with better proportions
  const hubWidth = hubMode === 'expanded' ? 'w-[42rem]' : 'w-[32rem]';
  const hubHeight = activeComponent && !isMinimized ? 'h-[44rem]' : 'h-auto';

  return (
    <TooltipProvider>
      <div className="fixed bottom-6 right-6 z-40">{/* ... rest remains the same until tools grid */}
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
                onClick={closeHub}
                className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-600 transition-colors"
                title="Fechar Hub (ESC)"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
          </div>
        </CardHeader>

        <CardContent className={cn("p-3", isMinimized && "hidden")}>
          {/* Tools Grid - Enhanced with better UX */}
          {!activeComponent && (
            <div className="space-y-4">
              {/* Favorites Section */}
              {Array.from(favorites).length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium text-muted-foreground">Favoritos</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {tools
                      .filter(tool => favorites.has(tool.id))
                      .map((tool) => (
                        <Tooltip key={`fav-${tool.id}`}>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={() => handleToolClick(tool)}
                              variant="ghost"
                              disabled={loadingTool === tool.id || isLoading}
                              className={cn(
                                "h-20 flex flex-col items-center justify-center gap-2 relative overflow-hidden group p-4",
                                "hover:scale-105 transition-all duration-300 hover:shadow-lg",
                                "border border-border/50 hover:border-primary/30 rounded-xl",
                                "bg-card hover:bg-accent/50",
                                activeComponent === tool.id && "ring-2 ring-primary/50 bg-primary/5"
                              )}
                            >
                              {/* Loading overlay */}
                              {loadingTool === tool.id && (
                                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                </div>
                              )}

                              {/* Background gradient */}
                              <div className={cn(
                                "absolute inset-0 opacity-0 group-hover:opacity-15 transition-opacity bg-gradient-to-br",
                                tool.color
                              )} />
                              
                              {/* Icon with status */}
                              <div className="relative">
                                <div className={cn(
                                  "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md bg-gradient-to-br transition-transform group-hover:scale-110",
                                  tool.color
                                )}>
                                  <tool.icon className="h-5 w-5" />
                                </div>
                                
                                {/* Status indicator */}
                                <div className="absolute -bottom-1 -right-1">
                                  {getStatusIndicator(tool.status)}
                                </div>
                                
                                {/* Badge */}
                                {tool.badge && (
                                  <Badge 
                                    variant="secondary" 
                                    className="absolute -top-1 -right-1 h-4 min-w-4 text-xs px-1.5 py-0 bg-primary text-primary-foreground"
                                  >
                                    {tool.badge}
                                  </Badge>
                                )}
                                
                                {/* Favorite indicator */}
                                <div className="absolute -top-2 -left-2">
                                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                </div>
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
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            <div className="text-center">
                              <p className="font-medium">{tool.name}</p>
                              <p className="text-xs text-muted-foreground">{tool.description}</p>
                              <p className="text-xs mt-1">Status: {tool.status}</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                  </div>
                </div>
              )}

              {/* All Tools Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Todas as Ferramentas</span>
                  <Badge variant="outline" className="text-xs">
                    {tools.length} disponíveis
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {tools.map((tool) => (
                    <Tooltip key={tool.id}>
                      <TooltipTrigger asChild>
                        <div className="relative group">
                          <Button
                            onClick={() => handleToolClick(tool)}
                            variant="ghost"
                            disabled={loadingTool === tool.id || isLoading}
                            className={cn(
                              "h-20 w-full flex flex-col items-center justify-center gap-2 relative overflow-hidden p-4",
                              "hover:scale-105 transition-all duration-300 hover:shadow-lg",
                              "border border-border/50 hover:border-primary/30 rounded-xl",
                              "bg-card hover:bg-accent/50",
                              activeComponent === tool.id && "ring-2 ring-primary/50 bg-primary/5"
                            )}
                          >
                            {/* Loading overlay */}
                            {loadingTool === tool.id && (
                              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                              </div>
                            )}

                            {/* Background gradient */}
                            <div className={cn(
                              "absolute inset-0 opacity-0 group-hover:opacity-15 transition-opacity bg-gradient-to-br",
                              tool.color
                            )} />
                            
                            {/* Icon with status */}
                            <div className="relative">
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md bg-gradient-to-br transition-transform group-hover:scale-110",
                                tool.color
                              )}>
                                <tool.icon className="h-5 w-5" />
                              </div>
                              
                              {/* Status indicator */}
                              <div className="absolute -bottom-1 -right-1">
                                {getStatusIndicator(tool.status)}
                              </div>
                              
                              {/* Badge */}
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
                          
                          {/* Favorite toggle */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(tool.id);
                            }}
                            className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {favorites.has(tool.id) ? (
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            ) : (
                              <StarOff className="w-3 h-3 text-muted-foreground hover:text-yellow-400" />
                            )}
                          </Button>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <div className="text-center">
                          <p className="font-medium">{tool.name}</p>
                          <p className="text-xs text-muted-foreground">{tool.description}</p>
                          <p className="text-xs mt-1">Status: {tool.status}</p>
                          {tool.action && <p className="text-xs text-blue-400">Clique para executar</p>}
                          {tool.component && <p className="text-xs text-green-400">Clique para abrir</p>}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Active Component Area - Enhanced with loading states */}
          {activeComponent && (
            <div className="flex flex-col h-[calc(44rem-8rem)]">
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveComponent(null);
                    setHubMode('compact');
                    toast({
                      title: "Ferramenta Fechada",
                      description: "Voltando ao hub principal.",
                    });
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
                    <div className="flex items-center gap-1">
                      {getStatusIndicator('online')}
                      <span className="text-xs text-muted-foreground">Online</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex-1 overflow-hidden border rounded-lg bg-muted/30">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-2">
                      <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                      <p className="text-sm text-muted-foreground">Carregando ferramenta...</p>
                    </div>
                  </div>
                ) : (
                  renderActiveComponent()
                )}
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
    </TooltipProvider>
  );
}