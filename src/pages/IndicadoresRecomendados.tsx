import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { IndicatorCategoryCard } from "@/components/esg/IndicatorCategoryCard";
import { IndicatorTrendChart } from "@/components/esg/IndicatorTrendChart";
import { IndicatorComparisonChart } from "@/components/esg/IndicatorComparisonChart";
import { 
  getAllRecommendedIndicators, 
  getCachedIndicators, 
  saveIndicatorsToCache,
  CategoryIndicators 
} from "@/services/esgRecommendedIndicators";
import { RefreshCw, Download, TrendingUp, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function IndicadoresRecomendados() {
  const [categories, setCategories] = useState<CategoryIndicators[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    loadIndicators();
  }, []);

  const loadIndicators = async (forceRecalculate = false) => {
    try {
      setLoading(true);

      // Try to load from cache first
      if (!forceRecalculate) {
        const cached = await getCachedIndicators();
        if (cached) {
          setCategories(cached);
          setLastUpdate(new Date());
          setLoading(false);
          return;
        }
      }

      // Calculate fresh indicators
      setCalculating(true);
      const indicators = await getAllRecommendedIndicators();
      setCategories(indicators);
      setLastUpdate(new Date());

      // Save to cache
      await saveIndicatorsToCache(indicators);

      toast.success('Indicadores calculados com sucesso!');
    } catch (error) {
      console.error('Error loading indicators:', error);
      toast.error('Erro ao carregar indicadores');
    } finally {
      setLoading(false);
      setCalculating(false);
    }
  };

  const handleRecalculate = () => {
    loadIndicators(true);
  };

  const handleExport = () => {
    toast.info('Funcionalidade de exportação em desenvolvimento');
  };

  if (loading && categories.length === 0) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const overallCompleteness = categories.length > 0
    ? categories.reduce((sum, cat) => sum + cat.completeness, 0) / categories.length
    : 0;

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Indicadores ESG Recomendados</h1>
          <p className="text-muted-foreground mt-1">
            Métricas calculadas automaticamente com base em frameworks internacionais
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleExport}
            disabled={calculating}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button 
            onClick={handleRecalculate}
            disabled={calculating}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${calculating ? 'animate-spin' : ''}`} />
            {calculating ? 'Calculando...' : 'Recalcular'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Categorias Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              de 7 categorias disponíveis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Indicadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {categories.reduce((sum, cat) => sum + cat.indicators.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              calculados automaticamente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completude Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold">{Math.round(overallCompleteness)}%</div>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {lastUpdate ? `Atualizado ${lastUpdate.toLocaleTimeString('pt-BR')}` : 'Não calculado'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alert for low data quality */}
      {overallCompleteness < 50 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Dados Incompletos</AlertTitle>
          <AlertDescription>
            Alguns indicadores não puderam ser calculados devido à falta de dados. 
            Complete os cadastros nas respectivas seções para melhorar a qualidade dos indicadores.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs for Categories */}
      <Tabs defaultValue="6.1" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7">
          <TabsTrigger value="6.1" className="text-xs lg:text-sm">
            Clima & Energia
          </TabsTrigger>
          <TabsTrigger value="6.2" className="text-xs lg:text-sm">
            Água
          </TabsTrigger>
          <TabsTrigger value="6.3" className="text-xs lg:text-sm">
            Resíduos
          </TabsTrigger>
          <TabsTrigger value="6.4" className="text-xs lg:text-sm">
            Saúde & Segurança
          </TabsTrigger>
          <TabsTrigger value="6.5" className="text-xs lg:text-sm">
            Capital Humano
          </TabsTrigger>
          <TabsTrigger value="6.6" className="text-xs lg:text-sm">
            Governança
          </TabsTrigger>
          <TabsTrigger value="6.7" className="text-xs lg:text-sm">
            Econômico
          </TabsTrigger>
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category.categoryCode} value={category.categoryCode}>
            <IndicatorCategoryCard category={category} />
          </TabsContent>
        ))}
      </Tabs>

      {/* Visualizations Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Análise de Tendências</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <IndicatorTrendChart
            title="Emissões de GEE (tCO₂e)"
            data={generateMockTrendData('ghg_emissions')}
            unit="tCO₂e"
            color="#ef4444"
          />
          
          <IndicatorTrendChart
            title="Consumo de Energia (kWh)"
            data={generateMockTrendData('energy_consumption')}
            unit="kWh"
            color="#f59e0b"
          />
          
          <IndicatorTrendChart
            title="Geração de Resíduos (t)"
            data={generateMockTrendData('waste_generation')}
            unit="toneladas"
            color="#10b981"
          />
          
          <IndicatorTrendChart
            title="Taxa de Acidentes (LTIFR)"
            data={generateMockTrendData('ltifr')}
            unit=""
            color="#8b5cf6"
          />
        </div>
        
        <IndicatorComparisonChart
          title="Completude por Categoria"
          data={categories.map(cat => ({
            name: cat.categoryName,
            value: cat.completeness
          }))}
          unit="%"
        />
      </div>

      {/* Framework Mapping Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Compatibilidade com Frameworks</CardTitle>
          <CardDescription>
            Os indicadores estão alinhados com os principais frameworks internacionais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">GRI (Global Reporting Initiative)</Badge>
            <Badge variant="outline">CDP (Carbon Disclosure Project)</Badge>
            <Badge variant="outline">SASB (Sustainability Accounting Standards Board)</Badge>
            <Badge variant="outline">GHG Protocol</Badge>
            <Badge variant="outline">ISO 14064</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Mock data generator for trend charts
function generateMockTrendData(type: string) {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  const baseValues: Record<string, number> = {
    ghg_emissions: 1500,
    energy_consumption: 50000,
    waste_generation: 120,
    ltifr: 2.5
  };
  
  const base = baseValues[type] || 100;
  
  return months.map((month, index) => {
    const variance = (Math.random() - 0.5) * 0.2;
    const trend = -0.02;
    const value = base * (1 + trend * index + variance);
    
    return {
      period: month,
      value: parseFloat(value.toFixed(2)),
      benchmark: type === 'ltifr' ? 2.0 : undefined,
      target: type === 'ghg_emissions' ? base * 0.8 : undefined
    };
  });
}
