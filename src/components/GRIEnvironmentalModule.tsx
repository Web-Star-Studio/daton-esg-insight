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

export function GRIEnvironmentalModule() {
  const [selectedIndicator, setSelectedIndicator] = useState<any>(null);
  const [showFormModal, setShowFormModal] = useState(false);

  const { data: indicatorData = [], isLoading } = useQuery({
    queryKey: ["gri-environmental-indicators"],
    queryFn: () => getGRIIndicatorData("") // You would pass the appropriate report ID
  });

  const environmentalCategories = [
    {
      id: "materials",
      title: "Materiais (GRI 301)",
      description: "Gestão de materiais utilizados e reciclados",
      icon: Recycle,
      color: "text-green-600",
      indicators: ["301-1", "301-2", "301-3"]
    },
    {
      id: "energy",
      title: "Energia (GRI 302)",
      description: "Consumo energético interno e externo",
      icon: Zap,
      color: "text-yellow-600",
      indicators: ["302-1", "302-2", "302-3", "302-4", "302-5"]
    },
    {
      id: "water",
      title: "Água (GRI 303)",
      description: "Monitoramento de captação, descarte e consumo",
      icon: Droplets,
      color: "text-blue-600",
      indicators: ["303-1", "303-2", "303-3", "303-4", "303-5"]
    },
    {
      id: "emissions",
      title: "Emissões (GRI 305)",
      description: "Gestão completa de emissões de GEE",
      icon: Wind,
      color: "text-gray-600",
      indicators: ["305-1", "305-2", "305-3", "305-4", "305-5", "305-6", "305-7"]
    },
    {
      id: "waste",
      title: "Resíduos (GRI 306)",
      description: "Gestão de resíduos e economia circular",
      icon: Factory,
      color: "text-orange-600",
      indicators: ["306-1", "306-2", "306-3", "306-4", "306-5"]
    }
  ];

  const getIndicatorsByCategory = (categoryIndicators: string[]) => {
    return indicatorData.filter(indicator => 
      categoryIndicators.includes(indicator.indicator?.code)
    );
  };

  const calculateCategoryProgress = (categoryIndicators: string[]) => {
    const categoryData = getIndicatorsByCategory(categoryIndicators);
    if (categoryData.length === 0) return 0;
    const completed = categoryData.filter(ind => ind.is_complete).length;
    return Math.round((completed / categoryData.length) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando módulo ambiental...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Environmental Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-green-600" />
            Módulo Ambiental - Indicadores GRI
          </CardTitle>
          <CardDescription>
            Gestão inteligente dos indicadores ambientais (GRI 301-308)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {environmentalCategories.slice(0, 3).map((category) => {
              const progress = calculateCategoryProgress(category.indicators);
              const categoryData = getIndicatorsByCategory(category.indicators);
              const completed = categoryData.filter(ind => ind.is_complete).length;
              
              return (
                <Card key={category.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <category.icon className={`h-5 w-5 ${category.color}`} />
                      <h4 className="font-medium text-sm">{category.title}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      {category.description}
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span>Progresso</span>
                        <span>{completed}/{category.indicators.length} ({progress}%)</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <Tabs defaultValue="materials" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          {environmentalCategories.map((category) => (
            <TabsTrigger key={category.id} value={category.id} className="text-xs">
              <category.icon className="h-4 w-4 mr-1" />
              {category.title.split(' ')[0]}
            </TabsTrigger>
          ))}
        </TabsList>

        {environmentalCategories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <category.icon className={`h-5 w-5 ${category.color}`} />
                  {category.title}
                </CardTitle>
                <CardDescription>
                  {category.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Progresso da Categoria</span>
                      <span className="text-sm text-muted-foreground">
                        {calculateCategoryProgress(category.indicators)}%
                      </span>
                    </div>
                    <Progress value={calculateCategoryProgress(category.indicators)} className="h-2" />
                  </div>

                  {/* Indicators List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {category.indicators.map((indicatorCode) => {
                      const indicatorData = getIndicatorsByCategory([indicatorCode])[0];
                      const hasData = !!indicatorData;
                      const isComplete = hasData && indicatorData.is_complete;
                      const hasValue = hasData && indicatorData.value;

                      return (
                        <Card key={indicatorCode} className="hover:shadow-sm transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <Badge variant="outline">{indicatorCode}</Badge>
                              <Badge 
                                className={
                                  isComplete ? "bg-green-100 text-green-800" :
                                  hasValue ? "bg-yellow-100 text-yellow-800" :
                                  "bg-red-100 text-red-800"
                                }
                              >
                                {isComplete ? "Concluído" : hasValue ? "Em Progresso" : "Não Iniciado"}
                              </Badge>
                            </div>
                            
                            <h4 className="font-medium text-sm mb-2">
                              {indicatorData?.indicator?.title || `Indicador ${indicatorCode}`}
                            </h4>
                            
                            {hasData && (indicatorData as any).value && (
                              <p className="text-xs bg-muted p-2 rounded mb-2">
                                Valor atual: {(indicatorData as any).value}
                              </p>
                            )}
                            
                            <div className="flex gap-2 mt-3">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="flex-1 text-xs"
                                onClick={() => {
                                  setSelectedIndicator(indicatorData || { code: indicatorCode });
                                  setShowFormModal(true);
                                }}
                              >
                                <FileText className="h-3 w-3 mr-1" />
                                {hasData ? "Editar" : "Preencher"}
                              </Button>
                              <Button size="sm" variant="ghost" className="px-2">
                                <Bot className="h-3 w-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Bot className="h-4 w-4" />
                      Preenchimento Automático
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Ver Tendências
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Target className="h-4 w-4" />
                      Definir Metas
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category-specific insights */}
            {category.id === "emissions" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Integração com Inventário GEE
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-green-600">Auto</p>
                      <p className="text-sm text-muted-foreground">GRI 305-1 (Escopo 1)</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">Auto</p>
                      <p className="text-sm text-muted-foreground">GRI 305-2 (Escopo 2)</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">Manual</p>
                      <p className="text-sm text-muted-foreground">GRI 305-3 (Escopo 3)</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Os indicadores de emissões são preenchidos automaticamente com dados do seu inventário GEE.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Form Modal */}
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