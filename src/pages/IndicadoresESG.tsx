import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, TrendingUp, Loader2 } from 'lucide-react';
import { CustomIndicatorModal } from '@/components/esg/CustomIndicatorModal';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function IndicadoresESG() {
  const { toast } = useToast();
  const [indicators, setIndicators] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState<any>(null);

  useEffect(() => {
    loadIndicators();
  }, []);

  const loadIndicators = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_esg_indicators')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIndicators(data || []);
    } catch (error) {
      console.error('Erro ao carregar indicadores:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os indicadores.',
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

  const calculateProgress = (current: number, target: number) => {
    if (!target || target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando indicadores...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Indicadores ESG Customizados</h1>
          <p className="text-muted-foreground">Crie e monitore indicadores específicos da sua empresa</p>
        </div>
        <Button onClick={() => { setEditingIndicator(null); setIsModalOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Indicador
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['environmental', 'social', 'governance'].map((category) => {
          const count = indicators.filter(i => i.category === category && i.is_active).length;
          return (
            <Card key={category}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{getCategoryLabel(category)}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                  <Badge className={getCategoryColor(category)}>
                    Ativos
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{indicators.length}</div>
              <div className="text-sm text-muted-foreground">Total de Indicadores</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Indicators by Category */}
      {['environmental', 'social', 'governance'].map((category) => {
        const categoryIndicators = indicators.filter(i => i.category === category);
        if (categoryIndicators.length === 0) return null;

        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Indicadores {getCategoryLabel(category)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryIndicators.map((indicator) => {
                  const progress = calculateProgress(indicator.current_value, indicator.target_value);
                  
                  return (
                    <Card 
                      key={indicator.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => { setEditingIndicator(indicator); setIsModalOpen(true); }}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-sm">{indicator.indicator_name}</h4>
                            {!indicator.is_active && (
                              <Badge variant="secondary" className="text-xs">Inativo</Badge>
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-baseline justify-between">
                              <span className="text-2xl font-bold">{indicator.current_value || 0}</span>
                              <span className="text-sm text-muted-foreground">{indicator.unit}</span>
                            </div>
                            
                            {indicator.target_value && (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Meta: {indicator.target_value}</span>
                                  <span className="font-semibold">{progress.toFixed(0)}%</span>
                                </div>
                                <Progress value={progress} className="h-1.5" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between text-xs">
                            <Badge variant="outline" className="text-xs">
                              {indicator.indicator_code}
                            </Badge>
                            <span className="text-muted-foreground capitalize">
                              {indicator.measurement_frequency}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {indicators.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">Nenhum indicador customizado</h3>
            <p className="text-muted-foreground mb-4">
              Crie indicadores ESG específicos para monitorar o desempenho da sua empresa.
            </p>
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Indicador
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal */}
      <CustomIndicatorModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingIndicator(null); }}
        onSuccess={loadIndicators}
        editingIndicator={editingIndicator}
      />
    </div>
  );
}
