import React, { useState, useMemo, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MaterialityTheme, MATERIALITY_CATEGORIES } from "@/services/materiality";
import { Target, TrendingUp, AlertTriangle, Filter, Download, Maximize2, Grid3X3, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MaterialityInteractiveMatrixProps {
  themes: MaterialityTheme[];
  matrix: Record<string, { x: number; y: number; priority: 'low' | 'medium' | 'high' }>;
  className?: string;
}

export const MaterialityInteractiveMatrix = ({ themes, matrix, className }: MaterialityInteractiveMatrixProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const matrixRef = useRef<HTMLDivElement>(null);
  
  // Initialize with fallback dimensions to prevent loading state
  const [matrixDimensions, setMatrixDimensions] = useState({ 
    width: 500, 
    height: 350 
  });

  // Calculate responsive matrix dimensions
  useEffect(() => {
    const updateDimensions = () => {
      // Get viewport dimensions first as fallback
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Try to get container dimensions, fallback to viewport if not available
      let containerWidth = viewportWidth - 64; // Default fallback
      
      if (matrixRef.current) {
        const rect = matrixRef.current.getBoundingClientRect();
        containerWidth = rect.width || matrixRef.current.offsetWidth || containerWidth;
      }
      
      let baseWidth, baseHeight;
      
      if (viewportWidth < 640) { // Mobile
        baseWidth = Math.min(containerWidth - 16, viewportWidth - 32, 350);
        baseHeight = Math.min(baseWidth * 0.8, viewportHeight * 0.4, 280);
      } else if (viewportWidth < 1024) { // Tablet
        baseWidth = Math.min(containerWidth - 32, 500);
        baseHeight = Math.min(baseWidth * 0.75, viewportHeight * 0.5, 375);
      } else { // Desktop
        baseWidth = Math.min(containerWidth - 48, 600);
        baseHeight = Math.min(baseWidth * 0.7, viewportHeight * 0.6, 420);
      }
      
      const finalDimensions = { 
        width: Math.max(300, baseWidth), 
        height: Math.max(220, baseHeight) 
      };
      
      setMatrixDimensions(finalDimensions);
    };

    // Initial calculation with slight delay to ensure DOM is ready
    const timer = setTimeout(updateDimensions, 100);
    
    // Set up resize observer
    let resizeObserver: ResizeObserver | null = null;
    
    const setupObserver = () => {
      if (matrixRef.current && window.ResizeObserver) {
        resizeObserver = new ResizeObserver(updateDimensions);
        resizeObserver.observe(matrixRef.current);
      }
    };
    
    // Set up observer after a short delay
    const observerTimer = setTimeout(setupObserver, 200);
    
    // Also listen to window resize as backup
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(observerTimer);
      window.removeEventListener('resize', updateDimensions);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  const { themesMap, filteredMatrix, priorityStats } = useMemo(() => {
    const themesMap = themes.reduce((acc, theme) => {
      acc[theme.id] = theme;
      return acc;
    }, {} as Record<string, MaterialityTheme>);

    const filteredMatrix = Object.entries(matrix).reduce((acc, [themeId, position]) => {
      const theme = themesMap[themeId];
      if (!theme) return acc;

      const categoryMatch = selectedCategory === 'all' || theme.category === selectedCategory;
      const priorityMatch = selectedPriority === 'all' || position.priority === selectedPriority;

      if (categoryMatch && priorityMatch) {
        acc[themeId] = position;
      }
      return acc;
    }, {} as Record<string, { x: number; y: number; priority: 'low' | 'medium' | 'high' }>);

    const priorityStats = {
      high: Object.values(filteredMatrix).filter(p => p.priority === 'high').length,
      medium: Object.values(filteredMatrix).filter(p => p.priority === 'medium').length,
      low: Object.values(filteredMatrix).filter(p => p.priority === 'low').length,
    };

    return { themesMap, filteredMatrix, priorityStats };
  }, [themes, matrix, selectedCategory, selectedPriority]);

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return 'bg-destructive text-destructive-foreground hover:bg-destructive/90 border-destructive';
      case 'medium': return 'bg-warning text-warning-foreground hover:bg-warning/90 border-warning';
      case 'low': return 'bg-success text-success-foreground hover:bg-success/90 border-success';
      default: return 'bg-muted text-muted-foreground hover:bg-muted/90 border-muted';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'environmental': return 'text-success bg-success/10 border-success/30';
      case 'social': return 'text-primary bg-primary/10 border-primary/30';
      case 'governance': return 'text-secondary bg-secondary/10 border-secondary/30';
      case 'economic': return 'text-warning bg-warning/10 border-warning/30';
      default: return 'text-muted-foreground bg-muted/10 border-muted/30';
    }
  };

  const handleExport = () => {
    console.log('Exportar matriz', { filteredMatrix, themes: themesMap });
  };

  // Matrix visualization component
  const MatrixVisualization = ({ compact = false }: { compact?: boolean }) => {
    const { width, height } = matrixDimensions;
    const isMobile = window.innerWidth < 640;
    
    // Responsive margins and calculations
    const margin = isMobile ? 35 : 50;
    const plotWidth = width - 2 * margin;
    const plotHeight = height - 2 * margin;

    // Ensure we have valid dimensions before rendering
    if (width <= 0 || height <= 0) {
      return (
        <div className="flex items-center justify-center h-80 bg-muted/10 rounded-lg border border-dashed border-muted-foreground/30">
          <div className="text-center space-y-2">
            <div className="text-muted-foreground">Preparando visualização...</div>
            <div className="text-xs text-muted-foreground">
              Dimensões: {width}x{height}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div 
        ref={!compact ? matrixRef : undefined}
        className={cn(
          "relative w-full flex flex-col items-center bg-background rounded-lg overflow-hidden",
          compact ? "h-[400px]" : "min-h-[320px]"
        )}
      >
        <div className="relative border border-border rounded-lg bg-gradient-to-br from-background to-muted/10" style={{ width, height }}>
          {/* SVG Matrix with proper scaling */}
          <svg width={width} height={height} className="absolute inset-0">
            {/* Background grid */}
            <defs>
              <pattern id="smallGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="0.3" opacity="0.3"/>
              </pattern>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <rect width="50" height="50" fill="url(#smallGrid)"/>
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" opacity="0.5"/>
              </pattern>
            </defs>
            
            {/* Plot area background with grid */}
            <rect 
              x={margin} 
              y={margin} 
              width={plotWidth} 
              height={plotHeight} 
              fill="url(#grid)" 
              opacity="0.1"
            />
            
            {/* Quadrant backgrounds with subtle gradients */}
            <rect 
              x={margin} 
              y={margin} 
              width={plotWidth/2} 
              height={plotHeight/2} 
              fill="hsl(var(--warning))" 
              opacity="0.05"
            />
            <rect 
              x={margin + plotWidth/2} 
              y={margin} 
              width={plotWidth/2} 
              height={plotHeight/2} 
              fill="hsl(var(--destructive))" 
              opacity="0.08"
            />
            <rect 
              x={margin} 
              y={margin + plotHeight/2} 
              width={plotWidth/2} 
              height={plotHeight/2} 
              fill="hsl(var(--success))" 
              opacity="0.05"
            />
            <rect 
              x={margin + plotWidth/2} 
              y={margin + plotHeight/2} 
              width={plotWidth/2} 
              height={plotHeight/2} 
              fill="hsl(var(--warning))" 
              opacity="0.06"
            />
            
            {/* Main axes */}
            <line 
              x1={margin} 
              y1={height - margin} 
              x2={width - margin} 
              y2={height - margin} 
              stroke="hsl(var(--foreground))" 
              strokeWidth="2"
            />
            <line 
              x1={margin} 
              y1={margin} 
              x2={margin} 
              y2={height - margin} 
              stroke="hsl(var(--foreground))" 
              strokeWidth="2"
            />
            
            {/* Center guide lines */}
            <line 
              x1={margin + plotWidth/2} 
              y1={margin} 
              x2={margin + plotWidth/2} 
              y2={height - margin} 
              stroke="hsl(var(--muted-foreground))" 
              strokeWidth="1" 
              strokeDasharray="4,4"
              opacity="0.5"
            />
            <line 
              x1={margin} 
              y1={margin + plotHeight/2} 
              x2={width - margin} 
              y2={margin + plotHeight/2} 
              stroke="hsl(var(--muted-foreground))" 
              strokeWidth="1" 
              strokeDasharray="4,4"
              opacity="0.5"
            />
          </svg>
          
          {/* Axis Labels - Positioned outside the plot area */}
          <div className="absolute inset-0 pointer-events-none">
            {/* X-axis label */}
            <div 
              className="absolute text-xs font-medium text-foreground text-center select-none"
              style={{
                bottom: '8px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: isMobile ? '11px' : '13px'
              }}
            >
              {isMobile ? 'Stakeholders →' : 'Relevância para Stakeholders →'}
            </div>
            
            {/* Y-axis label */}
            <div 
              className="absolute text-xs font-medium text-foreground select-none"
              style={{
                left: '6px',
                top: '50%',
                transform: 'translateY(-50%) rotate(-90deg)',
                transformOrigin: 'center',
                fontSize: isMobile ? '11px' : '13px'
              }}
            >
              {isMobile ? '← Organização' : '← Impacto na Organização'}
            </div>
            
            {/* Scale indicators */}
            {!isMobile && (
              <>
                <div className="absolute text-xs text-muted-foreground" style={{ left: margin - 5, bottom: margin - 20 }}>0</div>
                <div className="absolute text-xs text-muted-foreground" style={{ right: margin - 10, bottom: margin - 20 }}>10</div>
                <div className="absolute text-xs text-muted-foreground" style={{ left: margin - 10, top: margin - 5 }}>10</div>
                <div className="absolute text-xs text-muted-foreground" style={{ left: margin - 5, bottom: margin - 5 }}>0</div>
              </>
            )}
          </div>
          
          {/* Theme Points */}
          <div className="absolute inset-0">
            <TooltipProvider>
              {Object.entries(filteredMatrix).map(([themeId, data]) => {
                const theme = themesMap[themeId];
                if (!theme) return null;
                
                // Ensure coordinates are within bounds and add some padding
                const clampedX = Math.max(0.05, Math.min(0.95, data.x / 10));
                const clampedY = Math.max(0.05, Math.min(0.95, data.y / 10));
                
                const x = margin + (clampedX * plotWidth);
                const y = height - margin - (clampedY * plotHeight);
                
                const pointSize = isMobile ? 'w-3 h-3' : 'w-4 h-4';
                
                return (
                  <Tooltip key={themeId}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          `absolute ${pointSize} rounded-full cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 hover:scale-125 hover:z-20 shadow-lg border-2 border-background`,
                          getPriorityColor(data.priority)
                        )}
                        style={{ left: x, top: y }}
                      />
                    </TooltipTrigger>
                    <TooltipContent 
                      side="top" 
                      className="max-w-sm p-3 text-sm z-50"
                      sideOffset={8}
                      avoidCollisions={true}
                    >
                      <div className="space-y-2">
                        <div className="font-semibold">{theme.title}</div>
                        <div className="text-muted-foreground text-xs line-clamp-3">
                          {theme.description}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs px-2 py-0.5", getCategoryColor(theme.category))}
                          >
                            {MATERIALITY_CATEGORIES.find(c => c.value === theme.category)?.label || theme.category}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs px-2 py-0.5", getPriorityColor(data.priority))}
                          >
                            {data.priority === 'high' ? 'Alta' : data.priority === 'medium' ? 'Média' : 'Baixa'}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground grid grid-cols-2 gap-3 pt-2 border-t">
                          <span>Stakeholders: <strong>{data.x.toFixed(1)}</strong></span>
                          <span>Organização: <strong>{data.y.toFixed(1)}</strong></span>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </div>
          
          {/* Priority Legend - Positioned better */}
          <div className="absolute bottom-2 right-2 bg-background/95 backdrop-blur-sm p-2 rounded-lg border shadow-sm text-xs min-w-[90px]">
            <div className="font-medium text-center mb-2">Prioridade</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-destructive"></div>
                <span>Alta</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-warning"></div>
                <span>Média</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success"></div>
                <span>Baixa</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      <Tabs defaultValue="matrix" className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <TabsList className="grid w-full sm:w-auto grid-cols-3">
            <TabsTrigger value="matrix" className="text-xs sm:text-sm">Matriz</TabsTrigger>
            <TabsTrigger value="insights" className="text-xs sm:text-sm">Insights</TabsTrigger>
            <TabsTrigger value="themes" className="text-xs sm:text-sm">Temas</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={handleExport} className="flex-1 sm:flex-none">
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsFullscreen(true)} className="flex-1 sm:flex-none">
              <Maximize2 className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Tela Cheia</span>
            </Button>
          </div>
        </div>

        <TabsContent value="matrix" className="space-y-4">
          {/* Compact Filters */}
          <Card className="p-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filtros:</span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-[150px] h-9">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Categorias</SelectItem>
                    {MATERIALITY_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                  <SelectTrigger className="w-full sm:w-[130px] h-9">
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Prioridades</SelectItem>
                    <SelectItem value="high">Alta Prioridade</SelectItem>
                    <SelectItem value="medium">Média Prioridade</SelectItem>
                    <SelectItem value="low">Baixa Prioridade</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {Object.keys(filteredMatrix).length !== Object.keys(matrix).length && (
                <Badge variant="secondary" className="ml-auto">
                  {Object.keys(filteredMatrix).length}/{Object.keys(matrix).length} temas
                </Badge>
              )}
            </div>
          </Card>

          {/* Compact Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Alta', value: priorityStats.high, color: 'destructive', icon: AlertTriangle },
              { label: 'Média', value: priorityStats.medium, color: 'warning', icon: TrendingUp },
              { label: 'Baixa', value: priorityStats.low, color: 'success', icon: Target },
              { label: 'Total', value: Object.keys(filteredMatrix).length, color: 'muted', icon: Grid3X3 }
            ].map(({ label, value, color, icon: Icon }) => (
              <Card key={label} className="p-3">
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-4 w-4", {
                    'text-destructive': color === 'destructive',
                    'text-warning': color === 'warning',
                    'text-success': color === 'success',
                    'text-muted-foreground': color === 'muted'
                  })} />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{label}</p>
                    <p className={cn("text-xl font-bold", {
                      'text-destructive': color === 'destructive',
                      'text-warning': color === 'warning',
                      'text-success': color === 'success',
                      'text-foreground': color === 'muted'
                    })}>{value}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Matrix Visualization */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Matriz de Materialidade</CardTitle>
              <CardDescription>
                Visualização interativa dos temas por relevância para stakeholders e impacto organizacional
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <MatrixVisualization />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Análise de Materialidade</CardTitle>
                <CardDescription>Insights baseados na distribuição dos temas na matriz</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                    <div className="text-3xl font-bold text-destructive">{priorityStats.high}</div>
                    <div className="text-sm font-medium text-destructive">Temas Críticos</div>
                    <div className="text-xs text-muted-foreground mt-1">Requerem ação imediata</div>
                  </div>
                  <div className="text-center p-4 bg-warning/5 border border-warning/20 rounded-lg">
                    <div className="text-3xl font-bold text-warning">{priorityStats.medium}</div>
                    <div className="text-sm font-medium text-warning">Temas Importantes</div>
                    <div className="text-xs text-muted-foreground mt-1">Monitoramento contínuo</div>
                  </div>
                  <div className="text-center p-4 bg-success/5 border border-success/20 rounded-lg">
                    <div className="text-3xl font-bold text-success">{priorityStats.low}</div>
                    <div className="text-sm font-medium text-success">Temas de Base</div>
                    <div className="text-xs text-muted-foreground mt-1">Revisão periódica</div>
                  </div>
                </div>

                {priorityStats.high > 0 && (
                  <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                    <h4 className="font-semibold text-destructive mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Ação Recomendada
                    </h4>
                    <p className="text-sm text-foreground">
                      {priorityStats.high} tema(s) identificado(s) como alta prioridade. 
                      Desenvolva planos de ação específicos e defina metas mensuráveis para estes temas.
                    </p>
                  </div>
                )}

                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Próximos Passos
                  </h4>
                  <ul className="text-sm text-foreground space-y-1">
                    <li>• Desenvolver estratégias específicas para temas de alta prioridade</li>
                    <li>• Definir indicadores de monitoramento para todos os temas</li>
                    <li>• Estabelecer metas e cronogramas de implementação</li>
                    <li>• Programar revisão anual da matriz de materialidade</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="themes" className="space-y-4">
          <ScrollArea className="h-[600px]">
            <div className="grid gap-3">
              {Object.entries(filteredMatrix)
                .sort((a, b) => {
                  const priorityOrder = { high: 3, medium: 2, low: 1 };
                  const priorityDiff = priorityOrder[b[1].priority] - priorityOrder[a[1].priority];
                  if (priorityDiff !== 0) return priorityDiff;
                  return (b[1].x + b[1].y) - (a[1].x + a[1].y);
                })
                .map(([themeId, position]) => {
                  const theme = themesMap[themeId];
                  if (!theme) return null;

                  return (
                    <Card key={themeId} className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-start gap-3 mb-2">
                            <h4 className="font-semibold text-base">{theme.title}</h4>
                            <div className="flex gap-1 flex-wrap">
                              <Badge 
                                variant="outline" 
                                className={cn("text-xs", getCategoryColor(theme.category))}
                              >
                                {MATERIALITY_CATEGORIES.find(c => c.value === theme.category)?.label || theme.category}
                              </Badge>
                              <Badge 
                                variant="outline"
                                className={cn("text-xs", getPriorityColor(position.priority))}
                              >
                                {position.priority === 'high' ? 'Alta' : position.priority === 'medium' ? 'Média' : 'Baixa'}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{theme.description}</p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Stakeholders:</span>
                              <span className="ml-2 font-mono font-semibold">{position.x.toFixed(1)}/10</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Organização:</span>
                              <span className="ml-2 font-mono font-semibold">{position.y.toFixed(1)}/10</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-6">
          <DialogHeader className="pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl">Matriz de Materialidade - Visualização Completa</DialogTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsFullscreen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <MatrixVisualization compact />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};