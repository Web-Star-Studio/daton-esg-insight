import { useMemo, memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MaterialityTheme } from "@/services/materiality";
import { Target, TrendingUp, AlertTriangle } from "lucide-react";

interface MaterialityMatrixProps {
  themes: MaterialityTheme[];
  matrix: Record<string, { x: number; y: number; priority: 'low' | 'medium' | 'high' }>;
  className?: string;
}

const MaterialityMatrixComponent = ({ themes, matrix, className }: MaterialityMatrixProps) => {
  const { themesMap, maxX, maxY, priorityStats } = useMemo(() => {
    const themesMap = themes.reduce((acc, theme) => {
      acc[theme.id] = theme;
      return acc;
    }, {} as Record<string, MaterialityTheme>);

    const positions = Object.values(matrix);
    const maxX = Math.max(...positions.map(p => p.x), 100);
    const maxY = Math.max(...positions.map(p => p.y), 100);

    const priorityStats = {
      high: Object.values(matrix).filter(p => p.priority === 'high').length,
      medium: Object.values(matrix).filter(p => p.priority === 'medium').length,
      low: Object.values(matrix).filter(p => p.priority === 'low').length,
    };

    return { themesMap, maxX, maxY, priorityStats };
  }, [themes, matrix]);

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return 'bg-red-500 border-red-600';
      case 'medium': return 'bg-yellow-500 border-yellow-600';
      case 'low': return 'bg-green-500 border-green-600';
      default: return 'bg-gray-500 border-gray-600';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'environmental': return 'text-green-600';
      case 'social': return 'text-blue-600';
      case 'governance': return 'text-purple-600';
      case 'economic': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className={className}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        {/* Estatísticas de Prioridade */}
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
                <p className="text-sm font-medium">Total de Temas</p>
                <p className="text-2xl font-bold">{Object.keys(matrix).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Matriz de Materialidade */}
      <Card>
        <CardHeader>
          <CardTitle>Matriz de Materialidade</CardTitle>
          <CardDescription>
            Visualização da importância dos temas para stakeholders vs. impacto para a organização
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative w-full h-96 border-2 border-border rounded-lg bg-muted/20">
            {/* Eixos e Labels */}
            <div className="absolute bottom-0 left-0 w-full h-full">
              {/* Linha vertical (eixo Y) */}
              <div className="absolute left-12 top-0 w-px h-full bg-border"></div>
              {/* Linha horizontal (eixo X) */}
              <div className="absolute bottom-12 left-0 w-full h-px bg-border"></div>
              
              {/* Labels dos eixos */}
              <div className="absolute bottom-2 right-2 text-sm text-muted-foreground">
                Importância para Stakeholders →
              </div>
              <div className="absolute top-2 left-2 text-sm text-muted-foreground rotate-90 origin-center">
                ← Impacto para Organização
              </div>

              {/* Quadrantes */}
              <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-red-50 opacity-30 rounded-tr-lg"></div>
              <div className="absolute bottom-12 right-0 w-1/2 h-1/2 bg-yellow-50 opacity-30"></div>
              <div className="absolute top-0 left-12 w-1/2 h-1/2 bg-yellow-50 opacity-30"></div>
              <div className="absolute bottom-12 left-12 w-1/2 h-1/2 bg-green-50 opacity-30 rounded-bl-lg"></div>

              {/* Pontos dos temas */}
              <TooltipProvider>
                {Object.entries(matrix).map(([themeId, position]) => {
                  const theme = themesMap[themeId];
                  if (!theme) return null;

                  const x = (position.x / maxX) * 80 + 12; // 12% offset para o eixo Y, 80% da largura útil
                  const y = 88 - (position.y / maxY) * 76; // Invertido para Y crescer para cima, 76% da altura útil, 12% offset para eixo X

                  return (
                    <Tooltip key={themeId}>
                      <TooltipTrigger asChild>
                        <div
                          className={`absolute w-3 h-3 rounded-full border-2 cursor-pointer transition-transform hover:scale-150 ${getPriorityColor(position.priority)}`}
                          style={{
                            left: `${x}%`,
                            top: `${y}%`,
                            transform: 'translate(-50%, -50%)'
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <div className="space-y-2">
                          <div className="font-semibold">{theme.title}</div>
                          <div className="text-sm text-muted-foreground">{theme.description}</div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getCategoryColor(theme.category)}>
                              {theme.category}
                            </Badge>
                            <Badge variant={position.priority === 'high' ? 'destructive' : position.priority === 'medium' ? 'default' : 'secondary'}>
                              {position.priority === 'high' ? 'Alta' : position.priority === 'medium' ? 'Média' : 'Baixa'} Prioridade
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Stakeholders: {position.x.toFixed(1)} | Organização: {position.y.toFixed(1)}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </TooltipProvider>
            </div>
          </div>

          {/* Legenda */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-red-600"></div>
              <span>Alta Prioridade</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500 border-2 border-yellow-600"></div>
              <span>Média Prioridade</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-green-600"></div>
              <span>Baixa Prioridade</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Export memoized component with deep comparison of themes and matrix
export const MaterialityMatrix = memo(MaterialityMatrixComponent, (prevProps, nextProps) => {
  return prevProps.themes.length === nextProps.themes.length &&
         Object.keys(prevProps.matrix).length === Object.keys(nextProps.matrix).length &&
         prevProps.className === nextProps.className;
});