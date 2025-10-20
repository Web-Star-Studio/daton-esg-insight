import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Loader2, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MaterialityTopic {
  id: string;
  topic_name: string;
  category: 'environmental' | 'social' | 'governance';
  financial_materiality_score: number;
  impact_materiality_score: number;
  is_material: boolean;
}

export function DoubleMaterialityMatrix() {
  const { toast } = useToast();
  const [topics, setTopics] = useState<MaterialityTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      const { data, error } = await supabase
        .from('double_materiality_matrix')
        .select('*')
        .order('financial_materiality_score', { ascending: false });

      if (error) throw error;
      setTopics((data || []) as MaterialityTopic[]);
    } catch (error) {
      console.error('Erro ao carregar tópicos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a matriz de materialidade.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'environmental': return 'bg-success/10 text-success border-success/20';
      case 'social': return 'bg-primary/10 text-primary border-primary/20';
      case 'governance': return 'bg-accent/10 text-accent border-accent/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'environmental': return '🌱 Ambiental';
      case 'social': return '👥 Social';
      case 'governance': return '⚖️ Governança';
      default: return category;
    }
  };

  // Calculate matrix quadrants
  const getQuadrant = (financial: number, impact: number) => {
    if (financial >= 3 && impact >= 3) return { name: 'Materialidade Dupla Alta', color: 'bg-red-100 dark:bg-red-950' };
    if (financial >= 3) return { name: 'Materialidade Financeira', color: 'bg-orange-100 dark:bg-orange-950' };
    if (impact >= 3) return { name: 'Materialidade de Impacto', color: 'bg-yellow-100 dark:bg-yellow-950' };
    return { name: 'Baixa Materialidade', color: 'bg-gray-100 dark:bg-gray-900' };
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando matriz de materialidade...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Matriz de Dupla Materialidade</h2>
          <p className="text-muted-foreground">Análise ESRS - European Sustainability Reporting Standards</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Tópico
        </Button>
      </div>

      {/* Matrix Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Matriz de Materialidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full aspect-square max-w-2xl mx-auto border-2 border-border rounded-lg p-4">
            {/* Axis Labels */}
            <div className="absolute -left-24 top-1/2 -translate-y-1/2 -rotate-90 text-sm font-semibold text-muted-foreground">
              Materialidade de Impacto →
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-8 text-sm font-semibold text-muted-foreground">
              Materialidade Financeira →
            </div>

            {/* Quadrants */}
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-px bg-border p-4 rounded-lg">
              <div className="bg-muted/20 flex items-center justify-center text-xs text-muted-foreground">
                Baixa/Alta
              </div>
              <div className="bg-red-100 dark:bg-red-950/30 flex items-center justify-center text-xs font-semibold">
                Alta/Alta
              </div>
              <div className="bg-muted/20 flex items-center justify-center text-xs text-muted-foreground">
                Baixa/Baixa
              </div>
              <div className="bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center text-xs font-semibold">
                Alta/Baixa
              </div>
            </div>

            {/* Plot Points */}
            {topics.map((topic) => {
              const x = (topic.financial_materiality_score / 5) * 100;
              const y = 100 - (topic.impact_materiality_score / 5) * 100;
              
              return (
                <div
                  key={topic.id}
                  className="absolute w-3 h-3 rounded-full bg-primary border-2 border-white cursor-pointer hover:scale-150 transition-transform"
                  style={{ 
                    left: `${x}%`, 
                    top: `${y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  title={topic.topic_name}
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-red-100 dark:bg-red-950/30">
              <div className="text-xs font-semibold text-red-700 dark:text-red-300">Materialidade Dupla Alta</div>
              <div className="text-xs text-muted-foreground">Impacto ≥3 e Financeiro ≥3</div>
            </div>
            <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-950/30">
              <div className="text-xs font-semibold text-orange-700 dark:text-orange-300">Mat. Financeira</div>
              <div className="text-xs text-muted-foreground">Financeiro ≥3</div>
            </div>
            <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-950/30">
              <div className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">Mat. de Impacto</div>
              <div className="text-xs text-muted-foreground">Impacto ≥3</div>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <div className="text-xs font-semibold">Baixa Materialidade</div>
              <div className="text-xs text-muted-foreground">Ambos &lt;3</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Topics List */}
      <Card>
        <CardHeader>
          <CardTitle>Tópicos Materiais ({topics.filter(t => t.is_material).length}/{topics.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topics.filter(t => t.is_material).map((topic) => {
              const quadrant = getQuadrant(topic.financial_materiality_score, topic.impact_materiality_score);
              
              return (
                <div key={topic.id} className={`p-4 rounded-lg border ${quadrant.color}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{topic.topic_name}</h4>
                        <Badge className={getCategoryColor(topic.category)}>
                          {getCategoryLabel(topic.category)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Materialidade Financeira:</span>
                          <span className="ml-2 font-semibold">{topic.financial_materiality_score}/5</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Materialidade de Impacto:</span>
                          <span className="ml-2 font-semibold">{topic.impact_materiality_score}/5</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">{quadrant.name}</Badge>
                  </div>
                </div>
              );
            })}

            {topics.filter(t => t.is_material).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum tópico material identificado ainda.</p>
                <p className="text-sm mt-2">Adicione tópicos ESG e avalie sua materialidade financeira e de impacto.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
