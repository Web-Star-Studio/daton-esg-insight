import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Leaf, 
  Droplets, 
  Zap, 
  Recycle, 
  Factory, 
  Wind,
  TrendingUp,
  Target,
  FileText,
  Bot,
  Plus
} from "lucide-react";
import { GRIIndicatorFormModal } from "@/components/GRIIndicatorFormModal";
import { getGRIIndicatorData } from "@/services/griReports";
import { getIndicatorValue } from "@/services/griIndicators";

export function GRIEnvironmentalModule() {
  const [selectedIndicator, setSelectedIndicator] = useState<any>(null);
  const [showFormModal, setShowFormModal] = useState(false);

  const { data: indicatorData = [], isLoading } = useQuery({
    queryKey: ["gri-environmental-indicators"],
    queryFn: () => getGRIIndicatorData("") // You would pass the appropriate report ID
  });

  // Environmental categories with GRI indicators
  const environmentalCategories = [
    {
      id: "materials",
      title: "Materiais",
      description: "Materiais utilizados por peso ou volume",
      icon: Factory,
      color: "bg-blue-500",
      indicators: ["301-1", "301-2", "301-3"],
    },
    {
      id: "energy", 
      title: "Energia",
      description: "Consumo de energia dentro da organização",
      icon: Zap,
      color: "bg-yellow-500",
      indicators: ["302-1", "302-2", "302-3", "302-4", "302-5"],
    },
    {
      id: "water",
      title: "Água e Efluentes",
      description: "Retirada de água por fonte",
      icon: Droplets,
      color: "bg-blue-600",
      indicators: ["303-1", "303-2", "303-3", "303-4", "303-5"],
    },
    {
      id: "emissions",
      title: "Emissões",
      description: "Emissões diretas de GEE (Escopo 1)",
      icon: Wind,
      color: "bg-gray-500",
      indicators: ["305-1", "305-2", "305-3", "305-4", "305-5", "305-6", "305-7"],
    },
    {
      id: "waste",
      title: "Resíduos",
      description: "Resíduos gerados por tipo e método de disposição",
      icon: Recycle,
      color: "bg-green-600",
      indicators: ["306-1", "306-2", "306-3", "306-4", "306-5"],
    }
  ];

  // Helper function to get indicators by category
  const getIndicatorsByCategory = (categoryIndicators: string[]) => {
    return indicatorData.filter((indicator: any) => 
      categoryIndicators.includes(indicator.indicator?.code)
    );
  };

  // Calculate progress for a category
  const calculateCategoryProgress = (categoryIndicators: string[]) => {
    const indicators = getIndicatorsByCategory(categoryIndicators);
    if (indicators.length === 0) return 0;
    
    const completedCount = indicators.filter((indicator: any) => 
      indicator.is_complete
    ).length;
    
    return Math.round((completedCount / indicators.length) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {environmentalCategories.slice(0, 3).map((category) => {
          const progress = calculateCategoryProgress(category.indicators);
          const Icon = category.icon;
          
          return (
            <Card key={category.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${category.color} text-white`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{category.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {category.indicators.length} indicadores
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Progresso</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {category.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Categories */}
      <Tabs defaultValue="materials" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          {environmentalCategories.map((category) => (
            <TabsTrigger key={category.id} value={category.id} className="text-xs">
              {category.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {environmentalCategories.map((category) => {
          const categoryData = getIndicatorsByCategory(category.indicators);
          const progress = calculateCategoryProgress(category.indicators);
          const Icon = category.icon;

          return (
            <TabsContent key={category.id} value={category.id} className="space-y-6">
              {/* Category Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${category.color} text-white`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{category.title}</CardTitle>
                        <CardDescription>{category.description}</CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{progress}%</div>
                      <div className="text-sm text-muted-foreground">Completo</div>
                    </div>
                  </div>
                  <Progress value={progress} className="h-3 mt-4" />
                </CardHeader>
              </Card>

              {/* Indicators List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {category.indicators.map((indicatorCode) => {
                  const indicatorData = getIndicatorsByCategory([indicatorCode])[0];
                  const hasData = !!indicatorData;
                  const isComplete = hasData && indicatorData.is_complete;
                  const hasValue = hasData && getIndicatorValue(indicatorData);

                  return (
                    <Card key={indicatorCode} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="outline">{indicatorCode}</Badge>
                          <Badge 
                            className={
                              isComplete 
                                ? "bg-green-100 text-green-800" 
                                : hasValue 
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-600"
                            }
                          >
                            {isComplete ? "Concluído" : hasValue ? "Em Progresso" : "Não Iniciado"}
                          </Badge>
                        </div>
                        
                        <h4 className="font-medium mb-2">
                          {indicatorData?.indicator?.title || `Indicador ${indicatorCode}`}
                        </h4>
                        
                        <p className="text-sm text-muted-foreground mb-3">
                          {indicatorData?.indicator?.description || "Descrição não disponível"}
                        </p>

                        {hasData && (
                          <div className="mb-3 p-2 bg-muted rounded">
                            <p className="text-sm text-muted-foreground">
                              Valor atual: {getIndicatorValue(indicatorData) || 'Não informado'}
                            </p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={hasData ? "outline" : "default"}
                            onClick={() => {
                              setSelectedIndicator({
                                code: indicatorCode,
                                ...indicatorData
                              });
                              setShowFormModal(true);
                            }}
                          >
                            {hasData ? "Editar" : "Preencher"}
                          </Button>
                          
                          {hasData && (
                            <Button size="sm" variant="ghost">
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      Preenchimento Automático
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Ver Tendências
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Definir Metas
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Special section for Emissions */}
              {category.id === "emissions" && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Wind className="h-5 w-5 text-orange-600" />
                      Integração com Inventário GEE
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Os dados de emissões podem ser automaticamente preenchidos com base no seu inventário de gases de efeito estufa.
                    </p>
                    <Button className="bg-orange-600 hover:bg-orange-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Importar do Inventário GEE
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Modal */}
      {showFormModal && selectedIndicator && (
        <GRIIndicatorFormModal
          isOpen={showFormModal}
          onClose={() => {
            setShowFormModal(false);
            setSelectedIndicator(null);
          }}
          indicator={selectedIndicator}
        />
      )}
    </div>
  );
}