import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MaterialityTheme, MATERIALITY_CATEGORIES } from "@/services/materiality";
import { Target, TrendingUp, AlertTriangle, Filter, Download, Maximize2 } from "lucide-react";

interface MaterialityInteractiveMatrixProps {
  themes: MaterialityTheme[];
  matrix: Record<string, { x: number; y: number; priority: 'low' | 'medium' | 'high' }>;
  className?: string;
}

export const MaterialityInteractiveMatrix = ({ themes, matrix, className }: MaterialityInteractiveMatrixProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { themesMap, filteredMatrix, priorityStats } = useMemo(() => {
    const themesMap = themes.reduce((acc, theme) => {
      acc[theme.id] = theme;
      return acc;
    }, {} as Record<string, MaterialityTheme>);

    // Filtrar matrix baseado nos filtros selecionados
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
      case 'high': return 'bg-destructive border-destructive/70 shadow-destructive/20';
      case 'medium': return 'bg-warning border-warning/70 shadow-warning/20';
      case 'low': return 'bg-success border-success/70 shadow-success/20';
      default: return 'bg-muted border-muted-foreground/70';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'environmental': return 'text-success bg-success/10';
      case 'social': return 'text-primary bg-primary/10';
      case 'governance': return 'text-secondary bg-secondary/10';
      case 'economic': return 'text-warning bg-warning/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const handleExport = () => {
    // Funcionalidade de exportação - poderia gerar PDF, imagem, etc.
    console.log('Exportar matriz', { filteredMatrix, themes: themesMap });
  };

  const matrixSize = isFullscreen ? 'h-[70vh]' : 'h-[40vh] sm:h-80';

  return (
    <div className={className}>
      <Tabs defaultValue="matrix" className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="matrix">Matriz Visual</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="themes">Lista de Temas</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="matrix" className="space-y-3">
          {/* Filtros Compactos */}
          <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Filter className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros:</span>
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {MATERIALITY_CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>
            
            {Object.keys(filteredMatrix).length !== Object.keys(matrix).length && (
              <Badge variant="secondary" className="text-xs">
                {Object.keys(filteredMatrix).length}/{Object.keys(matrix).length} temas
              </Badge>
            )}
          </div>

          {/* Estatísticas Compactas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <Card className="p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 text-destructive" />
                <div>
                  <p className="text-xs font-medium">Alta</p>
                  <p className="text-lg font-bold text-destructive">{priorityStats.high}</p>
                </div>
              </div>
            </Card>

            <Card className="p-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3 w-3 text-warning" />
                <div>
                  <p className="text-xs font-medium">Média</p>
                  <p className="text-lg font-bold text-warning">{priorityStats.medium}</p>
                </div>
              </div>
            </Card>

            <Card className="p-3">
              <div className="flex items-center gap-2">
                <Target className="h-3 w-3 text-success" />
                <div>
                  <p className="text-xs font-medium">Baixa</p>
                  <p className="text-lg font-bold text-success">{priorityStats.low}</p>
                </div>
              </div>
            </Card>

            <Card className="p-3">
              <div className="flex items-center gap-2">
                <Target className="h-3 w-3 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium">Total</p>
                  <p className="text-lg font-bold">{Object.keys(filteredMatrix).length}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Matriz Interativa Compacta */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Matriz de Materialidade</CardTitle>
              <CardDescription className="text-sm">
                Stakeholders (X) vs. Organização (Y)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 sm:p-4">
              <div className={`relative w-full ${matrixSize} border-2 border-border rounded-lg bg-gradient-to-br from-background to-muted/20 overflow-hidden`}>
                {/* Quadrantes com gradientes */}
                <div className="absolute inset-0">
                  {/* Quadrante superior direito - Alta prioridade */}
                  <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-br from-destructive/20 to-destructive/10 rounded-tr-lg"></div>
                  {/* Quadrante superior esquerdo - Média prioridade */}
                  <div className="absolute top-0 left-[8%] sm:left-8 right-1/2 h-1/2 bg-gradient-to-bl from-warning/15 to-warning/8"></div>
                  {/* Quadrante inferior direita - Média prioridade */}
                  <div className="absolute bottom-[8%] sm:bottom-8 right-0 w-1/2 top-1/2 bg-gradient-to-tr from-warning/15 to-warning/8"></div>
                  {/* Quadrante inferior esquerdo - Baixa prioridade */}
                  <div className="absolute bottom-[8%] sm:bottom-8 left-[8%] sm:left-8 w-1/2 h-1/2 bg-gradient-to-tl from-success/15 to-success/8 rounded-bl-lg"></div>
                </div>

                {/* Eixos */}
                <div className="absolute left-[8%] sm:left-8 top-0 w-px h-full bg-border z-10"></div>
                <div className="absolute bottom-[8%] sm:bottom-8 left-0 w-full h-px bg-border z-10"></div>
                
                {/* Labels dos eixos - Compactos */}
                <div className="absolute bottom-1 right-2 text-[10px] sm:text-xs font-medium text-muted-foreground">
                  <span className="hidden sm:inline">Stakeholders →</span>
                  <span className="sm:hidden">S →</span>
                </div>
                <div className="absolute top-2 left-1 text-[10px] sm:text-xs font-medium text-muted-foreground transform -rotate-90 origin-left">
                  <span className="hidden sm:inline">← Organização</span>
                  <span className="sm:hidden">← O</span>
                </div>

                {/* Linhas de grade - Mais sutis */}
                {[25, 50, 75].map(percent => (
                  <div key={`v-${percent}`}>
                    <div 
                      className="absolute top-0 h-full w-px bg-border/20"
                      style={{ left: `${8 + (percent * 0.84)}%` }}
                    ></div>
                    <div 
                      className="absolute left-0 w-full h-px bg-border/20"
                      style={{ bottom: `${8 + (percent * 0.84)}%` }}
                    ></div>
                  </div>
                ))}

                {/* Pontos dos temas */}
                <TooltipProvider>
                  {Object.entries(filteredMatrix).map(([themeId, position]) => {
                    const theme = themesMap[themeId];
                    if (!theme) return null;

                    const x = 8 + (position.x * 0.84); // 8% offset + 84% useful width
                    const y = 92 - (position.y * 0.84); // Inverted Y + 84% useful height

                    return (
                      <Tooltip key={themeId}>
                        <TooltipTrigger asChild>
                          <div
                            className={`absolute w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 cursor-pointer transition-all duration-200 hover:scale-150 hover:shadow-lg z-20 ${getPriorityColor(position.priority)}`}
                            style={{
                              left: `${x}%`,
                              top: `${y}%`,
                              transform: 'translate(-50%, -50%)'
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <div className="space-y-1.5">
                            <div className="font-semibold text-sm">{theme.title}</div>
                            <div className="text-xs text-muted-foreground line-clamp-2">{theme.description}</div>
                            <div className="flex items-center gap-1 flex-wrap">
                              <Badge 
                                variant="outline" 
                                className={`text-[10px] ${getCategoryColor(theme.category)}`}
                              >
                                {MATERIALITY_CATEGORIES.find(c => c.value === theme.category)?.label}
                              </Badge>
                              <Badge 
                                variant={position.priority === 'high' ? 'destructive' : position.priority === 'medium' ? 'default' : 'secondary'}
                                className="text-[10px]"
                              >
                                {position.priority === 'high' ? 'Alta' : position.priority === 'medium' ? 'Média' : 'Baixa'}
                              </Badge>
                            </div>
                            <div className="text-[10px] grid grid-cols-2 gap-1 pt-1 border-t">
                              <div>S: <span className="font-mono">{position.x.toFixed(1)}</span></div>
                              <div>O: <span className="font-mono">{position.y.toFixed(1)}</span></div>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </TooltipProvider>

                {/* Legenda Compacta - Reposicionada */}
                <div className="absolute bottom-2 right-2 bg-background/95 backdrop-blur-sm p-2 rounded border text-[10px] sm:text-xs space-y-1 min-w-[80px]">
                  <div className="font-medium text-center">Prioridade</div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-destructive"></div>
                    <span>Alta</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-warning"></div>
                    <span>Média</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                    <span>Baixa</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Insights da Matriz</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{priorityStats.high}</div>
                    <div className="text-sm text-red-800">Temas Críticos</div>
                    <div className="text-xs text-red-600 mt-1">Requerem ação imediata</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{priorityStats.medium}</div>
                    <div className="text-sm text-yellow-800">Temas Importantes</div>
                    <div className="text-xs text-yellow-600 mt-1">Monitoramento contínuo</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{priorityStats.low}</div>
                    <div className="text-sm text-green-800">Temas de Base</div>
                    <div className="text-xs text-green-600 mt-1">Revisão periódica</div>
                  </div>
                </div>

                {priorityStats.high > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-2">🔴 Ação Recomendada</h4>
                    <p className="text-sm text-red-700">
                      {priorityStats.high} tema(s) identificado(s) como alta prioridade. 
                      Desenvolva planos de ação específicos e defina metas mensuráveis para estes temas.
                    </p>
                  </div>
                )}

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">💡 Próximos Passos</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
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
          <div className="grid gap-2">
            {Object.entries(filteredMatrix)
              .sort((a, b) => {
                // Ordenar por prioridade (alta -> média -> baixa) e depois por score
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                const priorityDiff = priorityOrder[b[1].priority] - priorityOrder[a[1].priority];
                if (priorityDiff !== 0) return priorityDiff;
                
                const scoreA = Math.sqrt(a[1].x ** 2 + a[1].y ** 2);
                const scoreB = Math.sqrt(b[1].x ** 2 + b[1].y ** 2);
                return scoreB - scoreA;
              })
              .map(([themeId, position]) => {
                const theme = themesMap[themeId];
                if (!theme) return null;

                return (
                  <Card key={themeId} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-3 h-3 rounded-full ${getPriorityColor(position.priority).split(' ')[0]}`}></div>
                          <h4 className="font-medium">{theme.title}</h4>
                          <Badge 
                            variant={position.priority === 'high' ? 'destructive' : position.priority === 'medium' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {position.priority === 'high' ? 'Alta' : position.priority === 'medium' ? 'Média' : 'Baixa'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{theme.description}</p>
                        <div className="flex items-center gap-4 text-xs">
                          <span>Stakeholders: <strong>{position.x.toFixed(1)}</strong></span>
                          <span>Organização: <strong>{position.y.toFixed(1)}</strong></span>
                          <Badge variant="outline" className={getCategoryColor(theme.category)}>
                            {MATERIALITY_CATEGORIES.find(c => c.value === theme.category)?.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};