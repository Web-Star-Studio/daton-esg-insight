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
      case 'high': return 'bg-red-500 border-red-600 shadow-red-200';
      case 'medium': return 'bg-yellow-500 border-yellow-600 shadow-yellow-200';
      case 'low': return 'bg-green-500 border-green-600 shadow-green-200';
      default: return 'bg-gray-500 border-gray-600';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'environmental': return 'text-green-600 bg-green-50';
      case 'social': return 'text-blue-600 bg-blue-50';
      case 'governance': return 'text-purple-600 bg-purple-50';
      case 'economic': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handleExport = () => {
    // Funcionalidade de exportação - poderia gerar PDF, imagem, etc.
    console.log('Exportar matriz', { filteredMatrix, themes: themesMap });
  };

  const matrixSize = isFullscreen ? 'h-[80vh]' : 'h-[50vh] sm:h-96';

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

        <TabsContent value="matrix" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <CardTitle className="text-base">Filtros</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Categoria</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Categorias</SelectItem>
                      {MATERIALITY_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Prioridade</label>
                  <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Prioridades</SelectItem>
                      <SelectItem value="high">Alta Prioridade</SelectItem>
                      <SelectItem value="medium">Média Prioridade</SelectItem>
                      <SelectItem value="low">Baixa Prioridade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">Alta Prioridade</p>
                    <p className="text-2xl font-bold text-red-600">{priorityStats.high}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium">Média Prioridade</p>
                    <p className="text-2xl font-bold text-yellow-600">{priorityStats.medium}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Baixa Prioridade</p>
                    <p className="text-2xl font-bold text-green-600">{priorityStats.low}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">Total Filtrado</p>
                    <p className="text-2xl font-bold">{Object.keys(filteredMatrix).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Matriz Interativa */}
          <Card>
            <CardHeader>
              <CardTitle>Matriz de Materialidade</CardTitle>
              <CardDescription>
                Importância para Stakeholders (X) vs. Impacto para Organização (Y)
                {Object.keys(filteredMatrix).length !== Object.keys(matrix).length && (
                  <span className="ml-2 text-blue-600">
                    • Filtrado: {Object.keys(filteredMatrix).length} de {Object.keys(matrix).length} temas
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-2 sm:p-6">
              <div className={`relative w-full ${matrixSize} border-2 border-border rounded-lg bg-gradient-to-br from-background to-muted/20 overflow-hidden`}>
                {/* Quadrantes com gradientes */}
                <div className="absolute inset-0">
                  {/* Quadrante superior direito - Alta prioridade */}
                  <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-br from-red-100/60 to-red-200/40 rounded-tr-lg"></div>
                  {/* Quadrante superior esquerdo - Média prioridade */}
                  <div className="absolute top-0 left-[10%] sm:left-12 right-1/2 h-1/2 bg-gradient-to-bl from-yellow-100/40 to-yellow-200/30"></div>
                  {/* Quadrante inferior direita - Média prioridade */}
                  <div className="absolute bottom-[10%] sm:bottom-12 right-0 w-1/2 top-1/2 bg-gradient-to-tr from-yellow-100/40 to-yellow-200/30"></div>
                  {/* Quadrante inferior esquerdo - Baixa prioridade */}
                  <div className="absolute bottom-[10%] sm:bottom-12 left-[10%] sm:left-12 w-1/2 h-1/2 bg-gradient-to-tl from-green-100/40 to-green-200/30 rounded-bl-lg"></div>
                </div>

                {/* Eixos */}
                <div className="absolute left-[10%] sm:left-12 top-0 w-px h-full bg-border z-10"></div>
                <div className="absolute bottom-[10%] sm:bottom-12 left-0 w-full h-px bg-border z-10"></div>
                
                {/* Labels dos eixos */}
                <div className="absolute bottom-1 right-1 text-xs sm:text-sm font-medium text-muted-foreground">
                  <span className="hidden sm:inline">Importância para Stakeholders →</span>
                  <span className="sm:hidden">Stakeholders →</span>
                </div>
                <div className="absolute top-1 left-1 text-xs sm:text-sm font-medium text-muted-foreground transform -rotate-90 origin-left">
                  <span className="hidden sm:inline">← Impacto para Organização</span>
                  <span className="sm:hidden">← Impacto</span>
                </div>

                {/* Linhas de grade */}
                {[25, 50, 75].map(percent => (
                  <div key={`v-${percent}`}>
                    <div 
                      className="absolute top-0 h-full w-px bg-border/30"
                      style={{ left: `${10 + (percent * 0.80)}%` }}
                    ></div>
                    <div 
                      className="absolute left-0 w-full h-px bg-border/30"
                      style={{ bottom: `${10 + (percent * 0.80)}%` }}
                    ></div>
                  </div>
                ))}

                {/* Pontos dos temas */}
                <TooltipProvider>
                  {Object.entries(filteredMatrix).map(([themeId, position]) => {
                    const theme = themesMap[themeId];
                    if (!theme) return null;

                    const x = 10 + (position.x * 0.80); // 10% offset + 80% useful width
                    const y = 90 - (position.y * 0.80); // Inverted Y + 80% useful height

                    return (
                      <Tooltip key={themeId}>
                        <TooltipTrigger asChild>
                          <div
                            className={`absolute w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 cursor-pointer transition-all duration-200 hover:scale-150 hover:shadow-lg z-20 ${getPriorityColor(position.priority)}`}
                            style={{
                              left: `${x}%`,
                              top: `${y}%`,
                              transform: 'translate(-50%, -50%)'
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-sm">
                          <div className="space-y-2">
                            <div className="font-semibold text-base">{theme.title}</div>
                            <div className="text-sm text-muted-foreground">{theme.description}</div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getCategoryColor(theme.category)}`}
                              >
                                {MATERIALITY_CATEGORIES.find(c => c.value === theme.category)?.label}
                              </Badge>
                              <Badge 
                                variant={position.priority === 'high' ? 'destructive' : position.priority === 'medium' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {position.priority === 'high' ? 'Alta' : position.priority === 'medium' ? 'Média' : 'Baixa'} Prioridade
                              </Badge>
                            </div>
                            <div className="text-xs grid grid-cols-2 gap-2 pt-2 border-t">
                              <div>Stakeholders: <span className="font-mono">{position.x.toFixed(1)}</span></div>
                              <div>Organização: <span className="font-mono">{position.y.toFixed(1)}</span></div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              GRI: {theme.gri_indicators.slice(0, 3).join(', ')}
                              {theme.gri_indicators.length > 3 && ` +${theme.gri_indicators.length - 3}`}
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </TooltipProvider>

                {/* Legenda das zonas - Reposicionada para não sair da tela */}
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-background/90 backdrop-blur-sm p-2 sm:p-3 rounded-lg border text-xs space-y-1 max-w-[200px] sm:max-w-none">
                  <div className="font-medium text-center sm:text-left">Zonas de Prioridade</div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-xs">Alta</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <span className="text-xs">Média</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-xs">Baixa</span>
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